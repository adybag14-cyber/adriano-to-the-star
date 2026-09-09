/** @jest-environment node */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const THREE = require('three');
const root = path.join(__dirname, '..');
const source = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('software graphics detection does not confuse hardware or privacy-redacted adapters', () => {
    const scope = vm.createContext({});
    vm.runInContext(
        source('renderer-capabilities.js').replace('export function ', 'function '),
        scope
    );
    for (const name of [
        'ANGLE (SwiftShader Device)',
        'llvmpipe (LLVM 20)',
        'Microsoft Basic Render Driver',
    ]) {
        expect(
            scope.isSoftwareWebGL({
                RENDERER: 1,
                getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 2 }),
                getParameter: () => name,
            })
        ).toBe(true);
    }
    for (const name of ['ANGLE (NVIDIA GeForce RTX 4090)', 'ANGLE (Apple M3)', 'WebKit WebGL']) {
        expect(
            scope.isSoftwareWebGL({
                RENDERER: 1,
                getExtension: () => null,
                getParameter: () => name,
            })
        ).toBe(false);
    }
    expect(
        scope.isSoftwareWebGL({
            getExtension: () => {
                throw new Error('privacy restricted');
            },
        })
    ).toBe(false);
});

function jpegSize(bytes) {
    let offset = 2;
    while (offset < bytes.length) {
        if (bytes[offset++] !== 255) throw new Error('Invalid JPEG marker');
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++],
            size = bytes.readUInt16BE(offset);
        if ([0xc0, 0xc1, 0xc2].includes(marker))
            return [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
        offset += size;
    }
    throw new Error('No JPEG dimensions');
}

test('all seven replacement maps are complete, attributed 2:1 sources with verified bytes', () => {
    const provenance = JSON.parse(source('data/planet-texture-provenance.json'));
    expect(Object.keys(provenance.maps)).toHaveLength(7);
    expect(provenance.license).toBe('CC BY 4.0');
    for (const map of Object.values(provenance.maps)) {
        const bytes = fs.readFileSync(path.join(root, map.file));
        expect(jpegSize(bytes)).toEqual([map.width, map.height]);
        expect(map.width).toBe(map.height * 2);
        expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(map.sha256);
        expect(source('education-viewer.js')).toContain(map.file);
    }
});

test('the shared header is extracted from home, appears exactly once, and respects immersive exemptions', () => {
    const scope = vm.createContext({ Map });
    vm.runInContext(source('scripts/shared-site-header.mjs').replace(/export /g, ''), scope);
    scope.home = source('index.html');
    const homeHeader = vm.runInContext('extractHomeHeader(home)', scope);
    scope.header = homeHeader;
    scope.input =
        '<html><head></head><body><a class="ita-skip-link" href="#main-content">Skip</a><header class="ita-db-header">Old</header><main id="main-content"></main></body></html>';
    const output = vm.runInContext('applySharedHeader(input,{path:"database.html"},header)', scope);
    expect(output.match(/data-shared-site-header="home-v1"/g)).toHaveLength(1);
    expect(output).not.toContain('ita-db-header');
    expect(output).toContain('href="/#routes"');
    expect(output.indexOf('ita-skip-link')).toBeLessThan(output.indexOf('data-shared-site-header'));
    for (const file of [
        'education.html',
        'star-maps.html',
        'tracker.html',
        'broadband-checker.html',
        'experimental/fluid-nebula/index.html',
    ]) {
        scope.file = file;
        expect(vm.runInContext('applySharedHeader(input,{path:file},header)', scope)).toBe(
            scope.input
        );
    }
});

test('adaptive spherical geometry refines near the camera within a bounded tile budget', () => {
    const scope = vm.createContext({ THREE });
    vm.runInContext(
        source('experimental/procedural-planets/forge-terrain.js').replace(
            'export class ',
            'class '
        ) + ';globalThis.Terrain=AdaptiveTerrain;',
        scope
    );
    const terrain = new scope.Terrain(THREE, new THREE.MeshBasicMaterial());
    const camera = new THREE.PerspectiveCamera(43, 16 / 9, 0.001, 1000);
    camera.position.set(0, 0.18, 3.5);
    for (let i = 0; i < 30; i++) terrain.update(camera, 720);
    const orbital = { ...terrain.stats };
    expect(orbital.triangles).toBeGreaterThan(20_000);
    camera.position.set(0, 0.1, 1.045);
    for (let i = 0; i < 60; i++) terrain.update(camera, 720);
    expect(terrain.stats.maxLevel).toBeGreaterThan(orbital.maxLevel);
    expect(terrain.stats.allocatedTiles).toBeLessThanOrEqual(454);
    expect(terrain.stats.triangles).toBeGreaterThan(orbital.triangles);
    for (const mesh of terrain.group.children) {
        expect([...mesh.geometry.attributes.position.array].every(Number.isFinite)).toBe(true);
    }
    camera.position.set(0, 0.18, 12);
    for (let i = 0; i < 30; i++) terrain.update(camera, 720);
    expect(terrain.stats.allocatedTiles).toBeLessThan(100);
    terrain.dispose();
    expect(terrain.group.children).toHaveLength(0);
});

function worker() {
    const callbacks = [],
        messages = [];
    class Canvas {
        constructor(width, height) {
            this.width = width;
            this.height = height;
        }
        getContext() {
            return {
                createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
                putImageData() {},
                drawImage() {},
            };
        }
    }
    const scope = vm.createContext({
        console,
        Float32Array,
        Uint8ClampedArray,
        Math,
        OffscreenCanvas: Canvas,
        performance: { now: () => 0 },
        setTimeout: (callback) => {
            callbacks.push(callback);
            return callbacks.length;
        },
        self: { postMessage: (data) => messages.push(data) },
    });
    vm.runInContext(source('experimental/fluid-nebula/nebula-cpu-worker.js'), scope);
    scope.self.onmessage({
        data: {
            type: 'init',
            canvas: new Canvas(256, 144),
            params: {
                quality: 'balanced',
                turbulence: 0,
                density: 1,
                exposure: 1,
                timeScale: 1,
                seed: 618,
                palette: 1,
            },
            playing: false,
        },
    });
    scope.self.onmessage({ data: { type: 'resize', width: 256, height: 144 } });
    return { scope, run: (expression) => vm.runInContext(expression, scope), callbacks, messages };
}

test('the actual CPU fluid projection reduces divergence and maintains nonnegative finite dye', () => {
    const w = worker();
    w.run(
        'for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;vx[i]=Math.sin(x/W*Math.PI*4)*.1;vy[i]=Math.sin(y/H*Math.PI*4)*.1;}'
    );
    const rms =
        '(()=>{let sum=0,n=0;for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++){const i=y*W+x,d=(vx[i+1]-vx[i-1])*W*.5+(vy[i+W]-vy[i-W])*H*.5;sum+=d*d;n++;}return Math.sqrt(sum/n);})()';
    const before = w.run(rms);
    w.run('for(let i=0;i<12;i++)step(0);');
    expect(w.run(rms)).toBeLessThan(before * 0.65);
    w.run('for(let i=0;i<120;i++)step(1/60);');
    expect(w.run('[...vx,...vy,...dye].every(Number.isFinite)')).toBe(true);
    expect(w.run('Math.min(...dye)')).toBeGreaterThanOrEqual(0);
    expect(w.run('dye.reduce((a,b)=>a+b,0)/N')).toBeGreaterThan(0.01);
    expect(w.callbacks).toHaveLength(0);
});

test('CPU pointer injection uses the same top-to-bottom screen coordinates as the GPU', () => {
    const w = worker();
    w.run('dye.fill(0);');
    w.scope.self.onmessage({
        data: { type: 'splat', splat: { x: 0.5, y: 0.85, dx: 0.1, dy: 0.1 } },
    });
    const peak = w.run(
        '(()=>{let index=0;for(let i=1;i<N;i++)if(dye[i]>dye[index])index=i;return Math.floor(index/W)/H;})()'
    );
    expect(peak).toBeCloseTo(0.15, 1);
});

test('Education CPU clouds use model alpha and opacity, and day lighting changes the visible result', () => {
    const scope = vm.createContext({
        Float32Array,
        Uint8ClampedArray,
        Math,
        self: {},
        postMessage() {},
    });
    vm.runInContext(source('education-software-worker.js'), scope);
    const run = (expression) => vm.runInContext(expression, scope);
    run(`canvas={};context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};resize(16);
    surface={width:2,height:1,data:new Uint8ClampedArray([30,50,70,255,30,50,70,255])};
    clouds={width:2,height:1,data:new Uint8ClampedArray([225,225,225,0,225,225,225,0])};
    atmosphere=false;cloudAlpha=true;cloudOpacity=.8;paint();`);
    const clear = run('frame.data[(8*16+8)*4]');
    run('clouds.data[3]=clouds.data[7]=255;paint();');
    const opaque = run('frame.data[(8*16+8)*4]');
    expect(opaque).toBeGreaterThan(clear + 80);
    run('cloudOpacity=0;paint();');
    expect(run('frame.data[(8*16+8)*4]')).toBe(clear);
    run('day=true;paint();');
    expect(run('frame.data[(8*16+8)*4]')).toBeGreaterThan(clear);
});
