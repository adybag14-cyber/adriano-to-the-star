import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.length ? rest.join('=') : true];
}));
const repoRoot = path.resolve(args.root || process.cwd());
const publicRoot = path.join(repoRoot, 'public');
const runId = String(args['run-id'] || new Date().toISOString().replace(/[:.]/g, '-'));
const runDir = path.resolve(repoRoot, args['run-dir'] || path.join('.devbox', 'logs', `pioneer-${runId}`));
const headed = args.headed !== 'false' && !args.headless;
const minHeadlessFpsArg = Number(args['min-headless-fps']);
const minHeadlessFps = Number.isFinite(minHeadlessFpsArg) ? Math.max(0.5, minHeadlessFpsArg) : 5;
const ciRenderProfile = String(args['ci-render-profile'] || '').trim().toLowerCase();
const ciWaitScale = ciRenderProfile === 'low' ? 6 : 1;
const ciTimeout = (milliseconds) => Math.max(1, Math.round(Number(milliseconds) * ciWaitScale));
await fsp.mkdir(runDir, { recursive: true });

const jsonlPath = path.join(runDir, 'events.jsonl');
const summaryPath = path.join(runDir, 'summary.json');
const statusPath = path.join(runDir, 'status.json');
const tracePath = path.join(runDir, 'trace.zip');
const screenshotsDir = path.join(runDir, 'screenshots');
await fsp.mkdir(screenshotsDir, { recursive: true });

const eventStream = fs.createWriteStream(jsonlPath, { flags: 'a', encoding: 'utf8' });
const nowIso = () => new Date().toISOString();
const sanitize = (value) => JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === 'number' && !Number.isFinite(item)) return String(item);
    if (item instanceof Error) return { name: item.name, message: item.message, stack: item.stack };
    return item;
}));
function log(type, data = {}) {
    const record = { ts: nowIso(), type, ...sanitize(data) };
    eventStream.write(`${JSON.stringify(record)}\n`);
    if (['phase', 'assert', 'issue', 'fatal', 'summary'].includes(type)) {
        console.log(`[${record.ts}] ${type.toUpperCase()} ${JSON.stringify(data)}`);
    }
    return record;
}
async function writeStatus(state, extra = {}) {
    await fsp.writeFile(statusPath, JSON.stringify({ runId, state, updatedAt: nowIso(), ...extra }, null, 2));
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mime = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream'
};
const serverRequestTrail = [];
const server = http.createServer(async (req, res) => {
    const requestStarted = Date.now();
    let rel = '';
    try {
        const url = new URL(req.url, 'http://localhost');
        rel = decodeURIComponent(url.pathname);
        if (rel === '/') rel = '/exoplanet-pioneer.html';
        const file = path.resolve(publicRoot, `.${rel}`);
        if (!file.startsWith(publicRoot)) throw new Error('path traversal');
        const data = await fsp.readFile(file);
        res.writeHead(200, { 'content-type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(data);
        serverRequestTrail.push({ rel, status: 200, ms: Date.now() - requestStarted, bytes: data.length });
    } catch (error) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('not found');
        serverRequestTrail.push({ rel, status: 404, ms: Date.now() - requestStarted, error: String(error) });
    }
    if (serverRequestTrail.length > 120) serverRequestTrail.splice(0, serverRequestTrail.length - 120);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const baseUrl = `http://127.0.0.1:${port}`;

const issues = [];
const consoleErrors = [];
const appWarnings = [];
const browserDiagnostics = [];
const pageErrors = [];
const requestFailures = [];
const firstPartyFailures = [];
const pendingFirstPartyRequests = new Map();
const milestones = [];
const assertions = [];
let browser;
let context;
let page;
let anchorTileId = null;
let phase = 'bootstrap';

function isBrowserDiagnostic(text) {
    return /GroupMarkerNotSet|GL Driver Message|software WebGL|SwiftShader|ReadPixels|GPU stall/i.test(text || '');
}
function issue(kind, message, details = {}) {
    const entry = { kind, message, phase, ...sanitize(details) };
    issues.push(entry);
    log('issue', entry);
}
function assert(condition, message, details = {}) {
    const entry = { pass: !!condition, message, phase, ...sanitize(details) };
    assertions.push(entry);
    log('assert', entry);
    if (!condition) {
        issue('assertion', message, details);
        throw new Error(`ASSERT: ${message}`);
    }
}
async function setPhase(name, details = {}) {
    phase = name;
    log('phase', { phase: name, ...details });
    await writeStatus('running', { phase: name, pid: process.pid, baseUrl, headed });
}
async function screenshot(name) {
    const file = path.join(screenshotsDir, `${String(milestones.length + 1).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    milestones.push({ name, file: path.relative(repoRoot, file), ts: nowIso() });
    log('screenshot', { name, file: path.relative(repoRoot, file) });
    return file;
}
async function state(label) {
    const data = await page.evaluate(() => {
        const g = window.game;
        if (!g) return { game: false };
        const structures = (g.structures || []).map((s) => ({
            id: s.id, type: s.type, tileId: s.tileId, level: s.level,
            constructing: !!s.isConstructing, progress: Number((s.buildProgress ?? 100).toFixed?.(2) ?? s.buildProgress),
            elapsed: s.buildElapsed ?? null, duration: s.buildDuration ?? null
        }));
        return {
            game: true,
            day: g.day, timeOfDay: g.timeOfDay, timeScale: g.timeScale, paused: g.isPaused,
            tutorial: { active: g.tutorialActive, step: g.tutorialStep, hidden: document.querySelector('#ep-tutorial')?.hidden },
            objective: document.querySelector('#ep-colony-path-current')?.textContent?.replace(/\s+/g, ' ').trim(),
            objectiveAction: document.querySelector('#ep-colony-path-action')?.textContent?.trim(),
            structures,
            inventory: (g.inventory || []).map((x) => ({ type: x.type, count: x.count })),
            resources: { ...g.resources },
            powerGrid: g.powerGrid ? { load: g.powerGrid.load, capacity: g.powerGrid.capacity, sourceCount: g.powerGrid.sources?.length || 0 } : null,
            tiles: g.tiles?.length || 0,
            sceneChildren: g.scene?.children?.length || 0,
            renderer: g.renderer ? {
                calls: g.renderer.info.render.calls,
                triangles: g.renderer.info.render.triangles,
                geometries: g.renderer.info.memory.geometries,
                textures: g.renderer.info.memory.textures,
                dpr: g.renderer.getPixelRatio()
            } : null
        };
    });
    log('state', { label, data });
    return data;
}
async function waitForGame() {
    await page.waitForFunction(() => window.game?.planetMesh && window.game.tiles?.length === 1000 && window.game.renderer?.domElement, null, { timeout: ciTimeout(60000) });
    await page.waitForTimeout(1200);
}
async function clickTimeSpeed(title) {
    const button = page.locator(`#ep-time-controls button[title="${title}"]`);
    await button.click();
    log('interaction', { action: 'click-time-speed', title });
}
async function getWindowRect(selector) {
    return page.locator(selector).evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom, managed: element.classList.contains('ep-window-managed'), positioned: element.dataset.epWindowPositioned === '1' };
    });
}
async function mouseDragManagedWindow(selector, dx, dy) {
    const windowLocator = page.locator(selector);
    const handle = windowLocator.locator('.ep-window-drag-handle').first();
    const box = await handle.boundingBox();
    if (!box) throw new Error(`No drag handle for ${selector}`);
    const startX = box.x + Math.min(Math.max(42, box.width * 0.35), Math.max(42, box.width - 70));
    const startY = box.y + Math.min(Math.max(16, box.height * 0.55), Math.max(16, box.height - 10));
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dx, startY + dy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(80);
}
async function mouseResizeManagedWindow(selector, dx, dy) {
    const grip = page.locator(`${selector} > .ep-window-resize-handle`);
    const box = await grip.boundingBox();
    if (!box) throw new Error(`No resize handle for ${selector}`);
    const startX = box.x + box.width * 0.72;
    const startY = box.y + box.height * 0.72;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dx, startY + dy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(80);
}
async function dispatchTouchDrag(startX, startY, endX, endY) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    const point = (x, y) => ({ x: Math.round(x), y: Math.round(y), radiusX: 6, radiusY: 6, force: 0.8, id: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(startX, startY)] });
    for (let step = 1; step <= 6; step += 1) {
        const t = step / 6;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(startX + (endX - startX) * t, startY + (endY - startY) * t)] });
        await page.waitForTimeout(18);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.detach();
    await page.waitForTimeout(100);
}
async function touchResizeManagedWindow(selector, dx, dy) {
    const box = await page.locator(`${selector} > .ep-window-resize-handle`).boundingBox();
    if (!box) throw new Error(`No touch resize handle for ${selector}`);
    const x = box.x + box.width * 0.72;
    const y = box.y + box.height * 0.72;
    await dispatchTouchDrag(x, y, x + dx, y + dy);
}
async function touchDragManagedWindow(selector, dx, dy) {
    const box = await page.locator(`${selector} .ep-window-drag-handle`).first().boundingBox();
    if (!box) throw new Error(`No touch drag handle for ${selector}`);
    const x = box.x + Math.min(Math.max(42, box.width * 0.3), Math.max(42, box.width - 72));
    const y = box.y + Math.min(Math.max(17, box.height * 0.55), Math.max(17, box.height - 10));
    await dispatchTouchDrag(x, y, x + dx, y + dy);
}
function windowRectInsideViewport(rect, width, height, tolerance = 2) {
    return rect.x >= -tolerance && rect.y >= -tolerance && rect.right <= width + tolerance && rect.bottom <= height + tolerance;
}
async function chooseSurfacePoint(itemType, preferNearTileId = null) {
    return page.evaluate(({ itemType, preferNearTileId }) => {
        const g = window.game;
        const canvas = g.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        g.planetMesh.updateMatrixWorld(true);
        g.camera.updateMatrixWorld(true);
        g.camera.updateProjectionMatrix();
        const anchor = Number.isInteger(preferNearTileId) ? g.tiles[preferNearTileId] : null;
        const candidates = [];
        const seenTiles = new Set();
        const minX = rect.left + 180;
        const maxX = rect.right - 120;
        const minY = rect.top + 105;
        const maxY = rect.bottom - 150;
        const cols = 24;
        const rows = 18;
        const pointer = new THREE.Vector2();
        for (let row = 0; row < rows; row += 1) {
            const y = minY + ((row + 0.5) / rows) * Math.max(1, maxY - minY);
            for (let col = 0; col < cols; col += 1) {
                const x = minX + ((col + 0.5) / cols) * Math.max(1, maxX - minX);
                if (document.elementFromPoint(x, y) !== canvas) continue;
                pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
                g.raycaster.setFromCamera(pointer, g.camera);
                const hit = g.raycaster.intersectObject(g.planetMesh, true)[0];
                if (!hit) continue;
                const match = g.getClosestTile(hit.point);
                if (!match?.tile || seenTiles.has(match.tile.id)) continue;
                if (!g.getPlacementValidity(match.tile, itemType).valid) continue;
                if (anchor && match.tile.position.distanceTo(anchor.position) > 18) continue;
                seenTiles.add(match.tile.id);
                const anchorDistance = anchor ? match.tile.position.distanceTo(anchor.position) : 0;
                const centerPenalty = Math.hypot(pointer.x * 0.75, pointer.y);
                candidates.push({
                    tileId: match.tile.id,
                    x,
                    y,
                    centerPenalty,
                    anchorDistance,
                    reserve: Number(match.tile.reserves?.[g.buildingTypes?.[itemType]?.requiredReserve] || 0)
                });
            }
        }
        candidates.sort((a, b) => (a.anchorDistance + a.centerPenalty * 6) - (b.anchorDistance + b.centerPenalty * 6));
        return candidates[0] || null;
    }, { itemType, preferNearTileId });
}

async function placeSelectedStructure(type, { preferNear = true } = {}) {
    const beforeCount = await page.evaluate((type) => window.game.structures.filter((s) => s.type === type).length, type);
    let point = await chooseSurfacePoint(type, preferNear ? anchorTileId : null);
    if (!point && preferNear) point = await chooseSurfacePoint(type, null);
    assert(!!point, `visible valid ${type} placement point exists`);
    await page.mouse.move(point.x, point.y, { steps: 5 });
    await page.waitForTimeout(140);
    const hint = await page.locator('#ep-placement-status').textContent().catch(() => '');
    log('interaction', { action: 'surface-hover', type, point, hint });
    await page.mouse.click(point.x, point.y);
    log('interaction', { action: 'surface-click', type, point });
    await page.waitForFunction(({ type, beforeCount }) => window.game.structures.filter((s) => s.type === type).length > beforeCount, { type, beforeCount }, { timeout: ciTimeout(8000) });
    const placed = await page.evaluate((type) => {
        const list = window.game.structures.filter((s) => s.type === type);
        const s = list[list.length - 1];
        const mesh = window.game.buildingMeshes[s.tileId];
        let scaffoldVisible = false;
        mesh?.traverse?.((c) => { if (c.userData?.isConstructionScaffold && c.visible) scaffoldVisible = true; });
        return { tileId: s.tileId, constructing: !!s.isConstructing, progress: s.buildProgress, scaffoldVisible, meshParented: mesh?.parent === window.game.planetMesh };
    }, type);
    if (anchorTileId === null) anchorTileId = placed.tileId;
    log('milestone', { action: 'structure-placed', type, placed });
    assert(placed.meshParented, `${type} mesh is parented to the planet`, placed);
    assert(placed.constructing, `${type} begins in timed construction state`, placed);
    assert(placed.progress >= 0 && placed.progress < 100, `${type} construction progress begins below 100%`, placed);
    assert(placed.scaffoldVisible, `${type} holographic construction scaffold is visible`, placed);
    return placed;
}
async function waitForConstruction(type, timeout = 16000) {
    if (ciRenderProfile === 'low') {
        const stepped = await page.evaluate((type) => {
            const g = window.game;
            const list = g.structures.filter((s) => s.type === type);
            const structure = list[list.length - 1];
            if (!structure) return { found: false, completed: false, steps: 0 };
            let steps = 0;
            while (structure.isConstructing && steps < 600) {
                g.advanceConstruction(1);
                steps += 1;
            }
            return {
                found: true,
                completed: !structure.isConstructing && structure.buildProgress === 100,
                steps,
                timeScale: g.timeScale,
                progress: structure.buildProgress
            };
        }, type);
        log('ci-simulation-step', { kind: 'construction', type, ...stepped });
        if (!stepped.found || !stepped.completed) {
            throw new Error(`CI deterministic construction step failed for ${type}: ${JSON.stringify(stepped)}`);
        }
    }
    await page.waitForFunction((type) => {
        const list = window.game.structures.filter((s) => s.type === type);
        const s = list[list.length - 1];
        return s && !s.isConstructing && s.buildProgress === 100;
    }, type, { timeout: ciTimeout(timeout) });
    const result = await page.evaluate((type) => {
        const list = window.game.structures.filter((s) => s.type === type);
        const s = list[list.length - 1];
        const mesh = window.game.buildingMeshes[s.tileId];
        let scaffoldVisible = false;
        let scaleY = null;
        mesh?.traverse?.((c) => { if (c.userData?.isConstructionScaffold && c.visible) scaffoldVisible = true; });
        if (mesh) scaleY = mesh.scale.y;
        return { tileId: s.tileId, constructing: s.isConstructing, progress: s.buildProgress, scaffoldVisible, scaleY };
    }, type);
    assert(!result.scaffoldVisible, `${type} scaffold disappears at completion`, result);
    assert(Math.abs((result.scaleY ?? 1.45) - 1.45) < 0.02, `${type} reaches full visual scale`, result);
    log('milestone', { action: 'construction-complete', type, result });
    return result;
}
async function samplePerformance(label, durationMs = 1600) {
    const sample = await page.evaluate((durationMs) => new Promise((resolve) => {
        const g = window.game;
        const start = performance.now();
        let frames = 0;
        function step(t) {
            frames += 1;
            if (t - start >= durationMs) {
                const info = g.renderer.info;
                resolve({
                    elapsedMs: t - start,
                    frames,
                    fps: frames * 1000 / (t - start),
                    calls: info.render.calls,
                    triangles: info.render.triangles,
                    geometries: info.memory.geometries,
                    textures: info.memory.textures,
                    jsHeapUsed: performance.memory?.usedJSHeapSize ?? null,
                    jsHeapLimit: performance.memory?.jsHeapSizeLimit ?? null
                });
                return;
            }
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }), durationMs);
    const minimumFps = headed ? 15 : minHeadlessFps;
    const mode = headed ? 'headed interactive' : 'headless software-validation';
    log('performance', { label, mode, minimumFps, sample });
    assert(sample.fps > minimumFps, `${label} remains responsive above ${minimumFps} FPS in ${mode} mode`, { mode, minimumFps, ...sample });
    return sample;
}
async function validateScene(label) {
    const result = await page.evaluate(() => {
        const g = window.game;
        const invalidTransforms = [];
        g.scene.updateMatrixWorld(true);
        g.scene.traverse((obj) => {
            if (!obj.matrixWorld.elements.every(Number.isFinite)) invalidTransforms.push(obj.name || obj.type || 'object');
        });
        const buildingBoxes = [];
        for (const s of g.structures) {
            const mesh = g.buildingMeshes[s.tileId];
            if (!mesh) { buildingBoxes.push({ tileId: s.tileId, type: s.type, missing: true }); continue; }
            const box = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3(); box.getSize(size);
            buildingBoxes.push({ tileId: s.tileId, type: s.type, size: size.toArray(), parented: mesh.parent === g.planetMesh });
        }
        const pos = g.planetMesh.geometry.attributes.position;
        let minR = Infinity, maxR = -Infinity;
        for (let i = 0; i < pos.count; i += 1) {
            const r = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
            minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        }
        const profile = g.planetMesh?.userData?.terrain?.physicalProfile || {};
        const worldType = String(profile.worldType || g.currentWorldType || 'planet').toLowerCase();
        const gasAtmosphereWorld = worldType === 'gas' || worldType === 'giant';
        const expectedAtmosphere = worldType !== 'moon' && !gasAtmosphereWorld
            && Number(profile.atmosphereRetention || 0) > 0.12;
        const expectedCloud = expectedAtmosphere && Number(profile.cloudPotential || 0) > 0.045;
        return {
            invalidTransforms,
            buildingBoxes,
            terrain: { minR, maxR },
            worldType,
            shellExpectations: { atmosphere: expectedAtmosphere, cloud: expectedCloud },
            shells: {
                atmosphere: g.atmosphereMesh?.parent === g.scene,
                cloud: g.cloudMesh?.parent === g.scene,
                cursor: g.cursorMesh?.parent === g.planetMesh,
                voxel: window.voxelTerrainSystem?.activePlanet === g.planetMesh,
                fluid: window.fluidDynamicsSystem?.planet === g.planetMesh
            }
        };
    });
    log('scene-validation', { label, result });
    assert(result.invalidTransforms.length === 0, `${label}: no NaN/Infinity scene transforms`, result.invalidTransforms);
    assert(result.terrain.minR > 49 && result.terrain.maxR < 52, `${label}: terrain radius stays bounded`, result.terrain);
    const shellLifecycleOk = result.shells.atmosphere === result.shellExpectations.atmosphere
        && result.shells.cloud === result.shellExpectations.cloud
        && result.shells.cursor && result.shells.voxel && result.shells.fluid;
    assert(shellLifecycleOk, `${label}: modeled atmosphere/cloud lifecycle and cursor/voxel/fluid bindings intact`, {
        worldType: result.worldType,
        expected: result.shellExpectations,
        actual: result.shells
    });
    for (const box of result.buildingBoxes) {
        assert(!box.missing, `${label}: ${box.type} has a visible mesh`, box);
        assert(box.parented, `${label}: ${box.type} stays surface-parented`, box);
        assert(Math.max(...box.size) < 15, `${label}: ${box.type} has no giant geometry spike`, box);
    }
    return result;
}
async function responsiveSweep() {
    const sizes = [
        { width: 1600, height: 1000 }, { width: 1366, height: 768 }, { width: 1024, height: 768 },
        { width: 800, height: 800 }, { width: 640, height: 800 }
    ];
    const results = [];
    for (const size of sizes) {
        await page.setViewportSize(size);
        await page.waitForTimeout(180);
        const result = await page.evaluate(() => {
            const rect = (selector) => {
                const el = document.querySelector(selector); if (!el) return null;
                const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
            };
            return {
                viewport: { w: innerWidth, h: innerHeight }, scrollW: document.documentElement.scrollWidth, scrollY: window.scrollY,
                resource: rect('#ep-res-panel'), commands: rect('.ep-command-primary'), left: rect('#ep-left-hud'), build: rect('.ep-build-dock')
            };
        });
        results.push(result);
        assert(result.scrollW <= size.width + 1, `no horizontal overflow at ${size.width}px`, result);
        for (const key of ['resource', 'commands', 'left', 'build']) {
            const r = result[key];
            assert(r && r.x >= -1 && r.right <= size.width + 1, `${key} remains horizontally inside ${size.width}px viewport`, r);
            assert(r && r.y >= -1 && r.bottom <= size.height + 1, `${key} remains vertically inside ${size.width}x${size.height} viewport`, { ...r, scrollY: result.scrollY });
        }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    log('responsive', { results });
    return results;
}

await writeStatus('starting', { pid: process.pid, runDir: path.relative(repoRoot, runDir), baseUrl, headed });
log('run-start', { pid: process.pid, runId, repoRoot, runDir: path.relative(repoRoot, runDir), baseUrl, headed });

let finalState = null;
let perfStart = null;
let perfColony = null;
let responsive = null;
let sceneValidation = null;
let galaxyBeforeReload = null;
let galaxyProbeTargetId = null;
let failed = false;
let fatalMessage = null;

try {
    const chromiumArgs = [
        '--disable-features=Translate',
        '--enable-unsafe-swiftshader'
    ];
    if (headed) chromiumArgs.unshift('--window-size=1480,980');
    log('browser-launch', {
        headed,
        args: chromiumArgs,
        graphicsBackend: 'Chromium-selected WebGL backend (software fallback explicitly allowed)'
    });
    browser = await chromium.launch({
        headless: !headed,
        args: chromiumArgs
    });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    page = await context.newPage();

    page.on('console', (msg) => {
        const entry = { level: msg.type(), text: msg.text(), location: msg.location(), phase };
        log('console', entry);
        if (msg.type() === 'error') consoleErrors.push(entry);
        if (msg.type() === 'warning') {
            if (isBrowserDiagnostic(msg.text())) browserDiagnostics.push(entry);
            else appWarnings.push(entry);
        }
    });
    page.on('pageerror', (error) => { const entry = { message: String(error), stack: error?.stack || '', phase }; pageErrors.push(entry); log('pageerror', entry); });
    page.on('request', (request) => {
        if (request.url().startsWith(baseUrl)) pendingFirstPartyRequests.set(request.url(), { method: request.method(), startedAt: Date.now() });
    });
    page.on('requestfinished', (request) => {
        if (request.url().startsWith(baseUrl)) pendingFirstPartyRequests.delete(request.url());
    });
    page.on('requestfailed', (request) => {
        if (request.url().startsWith(baseUrl)) pendingFirstPartyRequests.delete(request.url());
        const entry = { url: request.url(), method: request.method(), error: request.failure()?.errorText || 'unknown', phase };
        requestFailures.push(entry); log('requestfailed', entry);
    });
    page.on('response', (response) => {
        if (response.status() >= 400) {
            const entry = { status: response.status(), url: response.url(), phase };
            log('http-failure', entry);
            if (response.url().startsWith(baseUrl)) firstPartyFailures.push(entry);
        }
    });
    page.on('dialog', async (dialog) => { log('dialog', { type: dialog.type(), message: dialog.message(), phase }); await dialog.dismiss(); });

    await setPhase('load');
    const gameUrl = `${baseUrl}/exoplanet-pioneer.html?tutorial=1&workload=1`;
    const preflight = await fetch(`${baseUrl}/exoplanet-pioneer.html`, { signal: AbortSignal.timeout(8000) });
    assert(preflight.ok, 'workload static server responds before Chromium navigation', { status: preflight.status, baseUrl });
    try {
        await page.goto(gameUrl, { waitUntil: 'commit', timeout: ciTimeout(30000) });
        await page.waitForLoadState('domcontentloaded', { timeout: ciTimeout(60000) });
    } catch (error) {
        let readyState = 'unavailable';
        try { readyState = await page.evaluate(() => document.readyState); } catch { }
        log('load-diagnostics', {
            error: String(error),
            readyState,
            pendingFirstParty: [...pendingFirstPartyRequests.entries()].slice(-40),
            serverTail: serverRequestTrail.slice(-60)
        });
        throw error;
    }
    await waitForGame();
    if (ciRenderProfile === 'low') {
        const ciRenderState = await page.evaluate(() => {
            const g = window.game;
            g.graphicsSettings = g.normalizeGraphicsSettings({
                ...g.graphicsSettings,
                renderMode: 'standard',
                meshDetail: 'low',
                terrainDetail: 'low',
                atmosphereQuality: 'low',
                cloudQuality: 'low',
                shadowQuality: 'off'
            });
            const result = g.applyGraphicsSettings({ rebuildPlanet: true, notify: false });
            const ciPixelRatio = 0.35;
            const width = Math.max(1, g.container?.clientWidth || 1440);
            const height = Math.max(1, g.container?.clientHeight || 900);
            g.renderer?.setPixelRatio?.(ciPixelRatio);
            g.renderer?.setSize?.(width, height);
            g.composer?.setPixelRatio?.(ciPixelRatio);
            g.composer?.setSize?.(width, height);
            return {
                result,
                meshSegments: g.planetMesh?.userData?.terrain?.meshSegments ?? null,
                terrainVersion: g.planetMesh?.userData?.terrain?.version ?? null,
                dpr: g.renderer?.getPixelRatio?.() ?? null,
                shadowMapEnabled: !!g.renderer?.shadowMap?.enabled,
                graphics: { ...g.graphicsSettings }
            };
        });
        log('ci-render-profile', { profile: ciRenderProfile, state: ciRenderState });
        if (!ciRenderState.result?.ok || ciRenderState.meshSegments !== 80 || ciRenderState.terrainVersion !== 'catalog-informed-v4-geology'
            || !(ciRenderState.dpr <= 0.36) || ciRenderState.graphics?.shadowQuality !== 'off' || ciRenderState.shadowMapEnabled) {
            throw new Error(`CI low render profile failed to apply cleanly: ${JSON.stringify(ciRenderState)}`);
        }
    }
    await page.waitForFunction(() => window.game.tutorialActive && !document.querySelector('#ep-tutorial').hidden, null, { timeout: ciTimeout(8000) });
    const rendererInfo = await page.evaluate(() => ({ dpr: window.game.renderer.getPixelRatio(), outputColorSpace: window.game.renderer.outputColorSpace, toneMapping: window.game.renderer.toneMapping }));
    log('renderer-init', rendererInfo);
    assert(rendererInfo.dpr <= 1.75, 'renderer DPR is bounded for sustained workload', rendererInfo);
    const tutorialWindow = await getWindowRect('#ep-tutorial');
    assert(tutorialWindow.managed && !!(await page.locator('#ep-tutorial > .ep-window-resize-handle').count()), 'tutorial is automatically managed with a resize handle', tutorialWindow);
    await screenshot('tutorial-start');
    perfStart = await samplePerformance('fresh-world');

    await setPhase('tutorial');
    const canvas = page.locator('#game-container canvas').first();
    const box = await canvas.boundingBox();
    assert(!!box, 'game canvas has an interactive bounding box');
    await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.48);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.61, box.y + box.height * 0.43, { steps: 14 });
    await page.mouse.up();
    await page.mouse.wheel(0, -420);
    await page.waitForTimeout(250);
    await page.mouse.wheel(0, 180);
    log('interaction', { action: 'tutorial-orbit-and-zoom' });
    for (let step = 1; step <= 4; step += 1) {
        const before = await page.evaluate(() => ({ step: window.game.tutorialStep, title: document.querySelector('#ep-tutorial-title')?.textContent, progress: document.querySelector('#ep-tutorial-progress')?.textContent }));
        log('tutorial-step', before);
        await page.locator('#ep-tutorial-next').click();
        await page.waitForTimeout(120);
    }
    const tutorialDone = await page.evaluate(() => ({ active: window.game.tutorialActive, hidden: document.querySelector('#ep-tutorial').hidden, stored: localStorage.getItem(window.game.tutorialStorageKey) }));
    assert(!tutorialDone.active && tutorialDone.hidden && tutorialDone.stored === '1', 'tutorial completes through real UI controls', tutorialDone);
    await screenshot('tutorial-complete');

    await setPhase('solar-construction');
    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-colony-path-action').click();
    assert(await page.evaluate(() => window.game.selectedInventoryItem === 'solar'), 'objective CTA selects Solar Array');
    const solar = await placeSelectedStructure('solar', { preferNear: false });
    await page.waitForTimeout(1150);
    const solarMid = await page.evaluate((tileId) => {
        const s = window.game.structures.find((x) => x.tileId === tileId);
        return { progress: s?.buildProgress, constructing: s?.isConstructing, capacity: window.game.powerGrid?.capacity ?? 0 };
    }, solar.tileId);
    assert(solarMid.constructing && solarMid.progress > 0 && solarMid.progress < 100, 'Solar Array advances gradually at 1x', solarMid);
    assert(solarMid.capacity === 0, 'unfinished Solar Array contributes zero power', solarMid);
    await screenshot('solar-building');
    await clickTimeSpeed('10x Speed');
    await waitForConstruction('solar', 7000);
    await page.waitForTimeout(1100);
    const solarFlow = await page.evaluate(() => ({
        capacity: window.game.powerGrid?.capacity ?? 0,
        energyRate: window.game.resourceRates?.energy ?? 0,
        ratePill: document.querySelector('[data-resource="energy"] .ep-res-rate')?.textContent?.trim() || '',
        solarPowered: window.game.structures.find((s) => s.type === 'solar')?.powered
    }));
    assert(solarFlow.capacity > 0, 'completed Solar Array contributes power', solarFlow);
    assert(solarFlow.solarPowered === true, 'completed Solar Array reports powered state', solarFlow);
    assert(solarFlow.energyRate > 40, '10x simulation scales Solar Array production above 1x output', solarFlow);
    assert(/^\+/.test(solarFlow.ratePill), 'desktop resource HUD exposes positive live energy flow', solarFlow);

    await setPhase('habitat-construction');
    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-colony-path-action').click();
    assert(await page.evaluate(() => window.game.selectedInventoryItem === 'hab'), 'objective CTA selects Habitat Dome');
    await placeSelectedStructure('hab');
    await page.waitForTimeout(1100);
    await clickTimeSpeed('10x Speed');
    await waitForConstruction('hab', 8000);
    await page.waitForTimeout(1150);
    const habitatNetwork = await page.evaluate(() => {
        const g = window.game;
        const hab = g.structures.find((s) => s.type === 'hab');
        return {
            powered: hab?.powered,
            links: g.infrastructureLinks?.length || 0,
            networkParented: g.infrastructureGroup?.parent === g.planetMesh,
            pulseParented: !!g.infrastructureLinks?.[0]?.pulse?.parent
        };
    });
    assert(habitatNetwork.powered === true, 'completed Habitat Dome is powered by the nearby Solar Array', habitatNetwork);
    assert(habitatNetwork.links >= 1 && habitatNetwork.networkParented && habitatNetwork.pulseParented, 'colony power network creates a surface link and animated pulse', habitatNetwork);

    await setPhase('mining-construction');
    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-colony-path-action').click();
    assert(await page.evaluate(() => window.game.selectedInventoryItem === 'mine'), 'objective CTA selects Auto-Miner');
    const mine = await placeSelectedStructure('mine');
    const mineralsBefore = await page.evaluate(() => window.game.resources.minerals);
    await page.waitForTimeout(1100);
    const mineMid = await page.evaluate(({ tileId, mineralsBefore }) => {
        const s = window.game.structures.find((x) => x.tileId === tileId);
        return { progress: s?.buildProgress, constructing: s?.isConstructing, mineralsBefore, mineralsNow: window.game.resources.minerals };
    }, { tileId: mine.tileId, mineralsBefore });
    assert(mineMid.constructing, 'Auto-Miner remains under construction at 1x after one second', mineMid);
    assert(mineMid.mineralsNow <= mineMid.mineralsBefore + 0.001, 'unfinished Auto-Miner does not produce minerals', mineMid);
    await clickTimeSpeed('10x Speed');
    await waitForConstruction('mine', 8000);
    await screenshot('core-colony-online');

    await setPhase('research-manufacturing');
    await page.locator('#ep-colony-path-action').click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#ep-industry-modal')).display === 'flex', null, { timeout: ciTimeout(4000) });
    const labCard = page.locator('.ep-bp-card').filter({ hasText: 'Research Lab Blueprint' });
    assert(await labCard.count() === 1, 'Research Lab blueprint is available in Industry');
    await labCard.click();
    log('interaction', { action: 'manufacture-research-lab' });
    let labJobStarted = await page.waitForFunction(() => window.game.industry.jobs.some((job) => job.type === 'lab') || window.game.inventory.some((item) => item.type === 'lab' && item.count > 0), null, { timeout: ciTimeout(1200) }).then(() => true).catch(() => false);
    if (!labJobStarted) {
        const retryState = await page.evaluate(() => ({ jobs: window.game.industry.jobs.map((job) => ({ type: job.type, timeLeft: job.timeLeft })), minerals: window.game.resources.minerals, circuits: window.game.resources.circuits }));
        log('interaction', { action: 'manufacture-research-lab-retry', retryState });
        await page.locator('.ep-bp-card').filter({ hasText: 'Research Lab Blueprint' }).click();
        labJobStarted = await page.waitForFunction(() => window.game.industry.jobs.some((job) => job.type === 'lab') || window.game.inventory.some((item) => item.type === 'lab' && item.count > 0), null, { timeout: ciTimeout(1500) }).then(() => true).catch(() => false);
    }
    assert(labJobStarted, 'Research Lab blueprint click starts a manufacturing job');
    await page.waitForFunction(() => window.game.inventory.some((item) => item.type === 'lab' && item.count > 0), null, { timeout: ciTimeout(12000) });
    const labInventory = await page.evaluate(() => window.game.inventory.find((x) => x.type === 'lab'));
    assert(labInventory?.count > 0, 'Industry job completes and adds Research Lab to inventory', labInventory);
    await page.locator('#ep-industry-modal .ep-modal-header button').click();

    await setPhase('research-construction');
    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-colony-path-action').click();
    assert(await page.evaluate(() => window.game.selectedInventoryItem === 'lab'), 'objective CTA selects manufactured Research Lab');
    await placeSelectedStructure('lab');
    await page.waitForTimeout(1100);
    await clickTimeSpeed('10x Speed');
    await waitForConstruction('lab', 12000);
    await page.waitForTimeout(250);
    const objectiveAfterLab = await page.locator('#ep-colony-path-current').textContent();
    assert(/Claim the system/i.test(objectiveAfterLab || ''), 'mission path reaches system claim after real research construction', { objectiveAfterLab });
    await page.waitForFunction(() => window.game.structures.every((s) => window.game.buildingMeshes?.[s.tileId]?.userData?.assetLoadState), null, { timeout: ciTimeout(8000) });
    await page.waitForTimeout(1100);
    const matureColony = await page.evaluate(() => {
        const g = window.game;
        return {
            links: g.infrastructureLinks?.length || 0,
            powered: g.structures.map((s) => ({ type: s.type, powered: s.powered })),
            assets: g.structures.map((s) => {
                const group = g.buildingMeshes?.[s.tileId];
                let styledMeshes = 0;
                group?.traverse?.((child) => { if (child.userData?.buildingSurfaceStyled) styledMeshes += 1; });
                return { type: s.type, loadState: group?.userData?.assetLoadState || null, styledMeshes };
            })
        };
    });
    assert(matureColony.links >= 3, 'four-structure colony renders multiple active power links', matureColony);
    assert(matureColony.powered.every((entry) => entry.powered === true), 'all completed core colony structures report powered state', matureColony.powered);
    assert(matureColony.assets.every((entry) => entry.loadState && entry.styledMeshes > 0), 'all core colony models receive production/fallback material polish', matureColony.assets);
    await screenshot('research-complete');

    await setPhase('ui-workload');
    await page.locator('#ep-btn-ops').click();
    assert(!(await page.locator('#ep-ops-drawer').getAttribute('hidden')), 'operations drawer opens under workload');
    await page.locator('#ep-btn-ops').click();
    assert(await page.locator('#ep-ops-drawer').getAttribute('hidden') !== null, 'operations drawer closes under workload');
    await page.locator('#ep-data-toggle').click();
    await page.waitForFunction(() => document.querySelectorAll('#ep-live-feeds li').length > 0, null, { timeout: ciTimeout(10000) });
    await page.locator('#ep-live-refresh').click();
    await page.waitForFunction(() => document.querySelector('#ep-live-feeds')?.getAttribute('aria-busy') === 'false', null, { timeout: ciTimeout(10000) });
    await page.locator('#ep-data-toggle').click();

    await setPhase('window-management-desktop');
    await page.locator('#ep-btn-industry').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-industry-modal')).display !== 'none');
    const industrySelector = '#ep-industry-modal > .ep-modal';
    const industryInitial = await getWindowRect(industrySelector);
    assert(industryInitial.managed && !!(await page.locator(`${industrySelector} > .ep-window-resize-handle`).count()), 'Industry window is automatically draggable/resizable', industryInitial);
    await mouseDragManagedWindow(industrySelector, 92, 54);
    const industryDragged = await getWindowRect(industrySelector);
    assert(Math.abs(industryDragged.x - industryInitial.x) > 35 || Math.abs(industryDragged.y - industryInitial.y) > 25, 'desktop mouse drag moves the Industry window', { industryInitial, industryDragged });
    assert(windowRectInsideViewport(industryDragged, 1440, 900), 'dragged desktop window remains clamped to viewport', industryDragged);
    await mouseResizeManagedWindow(industrySelector, -115, -85);
    const industryResized = await getWindowRect(industrySelector);
    assert(industryResized.width < industryDragged.width - 55 && industryResized.height < industryDragged.height - 40, 'desktop mouse resize changes Industry window dimensions', { industryDragged, industryResized });
    assert(windowRectInsideViewport(industryResized, 1440, 900), 'resized desktop window remains inside viewport', industryResized);

    const readRotationSample = () => page.evaluate(() => ({
        x: window.game.planetMesh.rotation.x,
        y: window.game.planetMesh.rotation.y,
        frameCount: Number(window.game.frameCount || 0),
        camera: window.game.camera.position.toArray()
    }));
    const idleRotationStart = await readRotationSample();
    await page.waitForTimeout(350);
    const idleRotationEnd = await readRotationSample();
    const idleFrames = Math.max(1, idleRotationEnd.frameCount - idleRotationStart.frameCount);
    const idleDelta = { x: idleRotationEnd.x - idleRotationStart.x, y: idleRotationEnd.y - idleRotationStart.y };
    const idlePerFrame = { x: idleDelta.x / idleFrames, y: idleDelta.y / idleFrames };
    const canvasRotationBeforeWindowDrag = await readRotationSample();
    await mouseDragManagedWindow(industrySelector, -36, 24);
    const canvasRotationAfterWindowDrag = await readRotationSample();
    const dragFrames = Math.max(1, canvasRotationAfterWindowDrag.frameCount - canvasRotationBeforeWindowDrag.frameCount);
    const dragDelta = { x: canvasRotationAfterWindowDrag.x - canvasRotationBeforeWindowDrag.x, y: canvasRotationAfterWindowDrag.y - canvasRotationBeforeWindowDrag.y };
    const dragPerFrame = { x: dragDelta.x / dragFrames, y: dragDelta.y / dragFrames };
    const cameraDelta = Math.hypot(...canvasRotationAfterWindowDrag.camera.map((value, i) => value - canvasRotationBeforeWindowDrag.camera[i]));
    assert(
        Math.abs(dragPerFrame.x - idlePerFrame.x) < 0.001 &&
        Math.abs(dragPerFrame.y - idlePerFrame.y) < 0.001 &&
        cameraDelta < 0.01,
        'dragging a game window adds no camera/planet rotation beyond normal idle spin',
        { idleDelta, idleFrames, idlePerFrame, dragDelta, dragFrames, dragPerFrame, cameraDelta }
    );

    await page.evaluate(() => window.game.openProfile());
    await page.waitForFunction(() => document.querySelector('#ep-profile-modal > .ep-modal.ep-window-managed'));
    const dynamicProfile = await getWindowRect('#ep-profile-modal > .ep-modal');
    assert(dynamicProfile.managed && !!(await page.locator('#ep-profile-modal > .ep-modal > .ep-window-resize-handle').count()), 'dynamically-created Profile window is auto-enhanced', dynamicProfile);
    await page.locator('#ep-profile-modal .ep-modal-header button').click();

    await page.locator('#ep-industry-modal .ep-modal-header button').click();
    await page.locator('#ep-data-toggle').click();
    await page.waitForTimeout(100);
    const dataWindow = await getWindowRect('#ep-data-overlay');
    assert(dataWindow.managed && !!(await page.locator('#ep-data-overlay > .ep-window-resize-handle').count()), 'expanded Science Deck participates in the same window manager', dataWindow);
    await mouseDragManagedWindow('#ep-data-overlay', -90, 34);
    const dataDragged = await getWindowRect('#ep-data-overlay');
    assert(Math.abs(dataDragged.x - dataWindow.x) > 30 || Math.abs(dataDragged.y - dataWindow.y) > 20, 'Science Deck is draggable on desktop', { dataWindow, dataDragged });
    await page.locator('#ep-data-toggle').click();

    await setPhase('window-management-mobile');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(180);
    await page.locator('#ep-btn-industry').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-industry-modal')).display !== 'none');
    const mobileBefore = await getWindowRect(industrySelector);
    assert(windowRectInsideViewport(mobileBefore, 390, 844), 'Industry window opens fully inside phone viewport', mobileBefore);
    await touchResizeManagedWindow(industrySelector, -64, -88);
    const mobileResized = await getWindowRect(industrySelector);
    assert(mobileResized.width < mobileBefore.width - 30 && mobileResized.height < mobileBefore.height - 40, 'touch gesture resizes the Industry window on mobile', { mobileBefore, mobileResized });
    assert(windowRectInsideViewport(mobileResized, 390, 844), 'touch-resized mobile window remains clamped to viewport', mobileResized);
    await touchDragManagedWindow(industrySelector, 30, 38);
    const mobileDragged = await getWindowRect(industrySelector);
    assert(Math.abs(mobileDragged.x - mobileResized.x) > 12 || Math.abs(mobileDragged.y - mobileResized.y) > 18, 'touch gesture drags the Industry window on mobile', { mobileResized, mobileDragged });
    assert(windowRectInsideViewport(mobileDragged, 390, 844), 'touch-dragged mobile window remains inside viewport', mobileDragged);
    assert(await page.evaluate(() => window.scrollY === 0), 'mobile window gestures never scroll the Pioneer root document');
    const mobileGrip = await page.locator(`${industrySelector} > .ep-window-resize-handle`).boundingBox();
    assert(mobileGrip && mobileGrip.width >= 40 && mobileGrip.height >= 40, 'mobile resize grip is finger-sized', mobileGrip || {});
    await page.locator('#ep-industry-modal .ep-modal-header button').click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(180);

    await setPhase('ui-workload');
    for (let i = 0; i < 12; i += 1) {
        const b = await canvas.boundingBox();
        const sx = b.x + b.width * (0.44 + (i % 3) * 0.04);
        const sy = b.y + b.height * (0.44 + (i % 2) * 0.03);
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        await page.mouse.move(sx + (i % 2 ? -75 : 85), sy + (i % 3 - 1) * 26, { steps: 7 });
        await page.mouse.up();
        if (i % 3 === 0) await page.mouse.wheel(0, i % 2 ? 240 : -260);
    }
    perfColony = await samplePerformance('four-structure-colony');
    sceneValidation = await validateScene('interactive-colony');
    responsive = await responsiveSweep();
    await screenshot('ui-workload-complete');

    await setPhase('notification-dedupe');
    const dedupeCount = await page.evaluate(() => {
        const text = `Workload radiation warning ${Date.now()}`;
        window.game.notify(text, 'warning');
        window.game.notify(text, 'warning');
        return [...document.querySelectorAll('#ep-notifications .ep-notification')].filter((el) => el.textContent === text).length;
    });
    assert(dedupeCount === 1, 'duplicate urgent alerts collapse to one notification card', { dedupeCount });

    await setPhase('galaxy-expansion');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
        const g = window.game;
        for (const key of ['energy', 'data', 'credits', 'alloys', 'circuits']) {
            g.caps[key] = Math.max(Number(g.caps[key] || 0), 10000);
            g.resources[key] = Math.max(Number(g.resources[key] || 0), 5000);
        }
        g.updateResourceUI();
    });
    await page.locator('#ep-btn-galaxy').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-galaxy-map-modal')).display === 'flex');
    await page.waitForFunction(() => document.querySelector('#ep-galaxy-map-modal > .ep-modal.ep-window-managed'));
    const galaxyWindow = await getWindowRect('#ep-galaxy-map-modal > .ep-modal');
    assert(galaxyWindow.managed, 'Galactic Chart participates in draggable/resizable window manager', galaxyWindow);
    const initialGalaxy = await page.evaluate(() => ({
        sectors: window.game.universe.galacticMap.sectors.size,
        stars: window.game.universe.galacticMap.stars.length,
        discovered: window.game.universe.galacticMap.stars.filter((s) => s.discovered).length,
        credits: window.game.resources.credits
    }));
    await page.locator('[data-galaxy-action="survey"]').click();
    await page.waitForFunction((before) => window.game.universe.galacticMap.sectors.size > before, initialGalaxy.sectors, { timeout: ciTimeout(5000) });
    const surveyed = await page.evaluate(() => ({
        sectors: window.game.universe.galacticMap.sectors.size,
        stars: window.game.universe.galacticMap.stars.length
    }));
    assert(surveyed.sectors > initialGalaxy.sectors && surveyed.stars > initialGalaxy.stars, 'Survey Ring generates persistent adjacent galactic sectors', { initialGalaxy, surveyed });
    await page.locator('[data-galaxy-action="sensor"]').click();
    const afterSensor = await page.evaluate(() => ({
        discovered: window.game.universe.galacticMap.stars.filter((s) => s.discovered).length,
        energy: window.game.resources.energy
    }));
    assert(afterSensor.discovered >= initialGalaxy.discovered, 'Sensor Ping exposes additional galactic information', { initialGalaxy, afterSensor });
    await page.locator('[data-galaxy-action="zoom-out"]').click();
    await page.locator('[data-galaxy-action="zoom-out"]').click();
    await page.waitForTimeout(120);
    const unknownPoint = await page.evaluate(() => {
        const u = window.game.universe;
        u.renderGalaxyMap();
        const canvas = document.getElementById('ep-galaxy-chart-canvas');
        const w = canvas.clientWidth, h = canvas.clientHeight;
        const candidates = (u._galaxyScreenStars || []).filter((entry) => !entry.star.discovered && entry.x > 20 && entry.x < w - 20 && entry.y > 20 && entry.y < h - 20);
        candidates.sort((a, b) => Math.hypot(a.x - w / 2, a.y - h / 2) - Math.hypot(b.x - w / 2, b.y - h / 2));
        const pick = candidates[0];
        return pick ? { id: pick.star.id, x: pick.x, y: pick.y } : null;
    });
    assert(!!unknownPoint, 'survey exposes an uncharted star that can be selected from the visible chart');
    galaxyProbeTargetId = unknownPoint.id;
    const galaxyCanvas = page.locator('#ep-galaxy-chart-canvas');
    const galaxyCanvasBox = await galaxyCanvas.boundingBox();
    await page.mouse.click(galaxyCanvasBox.x + unknownPoint.x, galaxyCanvasBox.y + unknownPoint.y);
    await page.waitForFunction((id) => window.game.universe.galaxyViewState.selectedStarId === id, galaxyProbeTargetId);
    assert((await page.locator('#ep-star-details').textContent()).includes('Unknown System'), 'physical chart click selects an uncharted star');
    await page.locator('[data-galaxy-action="probe"]').click();
    await page.waitForFunction((id) => window.game.universe.galacticMap.probes.some((p) => p.targetId === id), galaxyProbeTargetId, { timeout: ciTimeout(3000) });
    assert(await page.evaluate((id) => window.game.universe.galacticMap.probes.some((p) => p.targetId === id), galaxyProbeTargetId), 'Launch Probe creates a real exploration job');
    await page.locator('[data-galaxy-action="speed"][data-speed-index="4"]').click();
    assert(await page.locator('[data-galaxy-action="speed"][data-speed-index="4"]').evaluate((el) => el.classList.contains('active')), 'Galactic Chart exposes an active real 10x simulation control');
    await page.waitForFunction((id) => window.game.universe.galacticMap.stars.find((s) => s.id === id)?.discovered === true, galaxyProbeTargetId, { timeout: ciTimeout(12000) });
    assert(await page.evaluate((id) => !window.game.universe.galacticMap.probes.some((p) => p.targetId === id), galaxyProbeTargetId), 'probe completes and retires after discovering its target');

    await page.locator('[data-galaxy-action="center"]').click();
    await page.waitForTimeout(100);
    if (await page.locator('[data-galaxy-action="claim"]').count()) await page.locator('[data-galaxy-action="claim"]').click();
    await page.waitForFunction(() => window.game.claims[String(window.game.currentSystemId)] === 'player', null, { timeout: ciTimeout(3000) });
    assert(await page.evaluate(() => window.game.claims[String(window.game.currentSystemId)] === 'player'), 'system claiming works locally without cloud authentication');
    await page.locator('[data-galaxy-action="relay"]').click();
    await page.locator('[data-galaxy-action="refuel"]').click();
    await page.locator('[data-galaxy-action="shipyard"]').click();
    await page.locator('[data-galaxy-action="mega"]').click();
    const expansionAssets = await page.evaluate(() => {
        const u = window.game.universe;
        const id = u.getCurrentStar().id;
        const mega = u.galacticMap.megastructures.find((m) => m.starId === id && m.type === 'dyson_swarm');
        return {
            currentStarId: id,
            relays: u.galacticMap.relays.filter((x) => x.starId === id).length,
            refuel: u.galacticMap.refuelingStations.filter((x) => x.starId === id).length,
            shipyards: u.galacticMap.deepShipyards.filter((x) => x.starId === id).length,
            megaCount: u.galacticMap.megastructures.filter((x) => x.starId === id && x.type === 'dyson_swarm').length,
            megaProgress: mega?.completion || 0
        };
    });
    assert(expansionAssets.relays === 1 && expansionAssets.refuel === 1 && expansionAssets.shipyards === 1 && expansionAssets.megaCount === 1, 'claimed system can deploy relay, refuel, shipyard and Dyson expansion assets', expansionAssets);
    await page.waitForTimeout(900);
    const megaProgressAfter = await page.evaluate((starId) => window.game.universe.galacticMap.megastructures.find((m) => m.starId === starId && m.type === 'dyson_swarm')?.completion || 0, expansionAssets.currentStarId);
    assert(megaProgressAfter > expansionAssets.megaProgress, 'megastructure construction advances under simulation time', { before: expansionAssets.megaProgress, after: megaProgressAfter });
    galaxyBeforeReload = await page.evaluate((targetId) => {
        const u = window.game.universe;
        return {
            targetId,
            targetDiscovered: u.galacticMap.stars.find((s) => s.id === targetId)?.discovered === true,
            sectors: u.galacticMap.sectors.size,
            stars: u.galacticMap.stars.length,
            relays: u.galacticMap.relays.length,
            refuel: u.galacticMap.refuelingStations.length,
            shipyards: u.galacticMap.deepShipyards.length,
            megastructures: u.galacticMap.megastructures.length
        };
    }, galaxyProbeTargetId);
    await screenshot('galaxy-expansion-online');
    await page.locator('[data-galaxy-action="close"]').click();
    await clickTimeSpeed('1x Speed');

    await setPhase('save-reload');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-save').click();
    await page.waitForTimeout(250);
    const countBeforeReload = await page.evaluate(() => {
        const count = window.game.structures.length;
        history.replaceState({}, '', `${location.pathname}?workload=1`);
        return count;
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: ciTimeout(60000) });
    await waitForGame();
    await page.waitForTimeout(900);
    const afterReload = await page.evaluate(() => ({ structures: window.game.structures.length, tutorialActive: window.game.tutorialActive, objective: document.querySelector('#ep-colony-path-current')?.textContent?.replace(/\s+/g, ' ').trim() }));
    assert(afterReload.structures === countBeforeReload, 'save/reload preserves tutorial-built colony', { countBeforeReload, afterReload });
    assert(!afterReload.tutorialActive, 'completed tutorial does not restart after reload', afterReload);
    const galaxyAfterReload = await page.evaluate((targetId) => {
        const u = window.game.universe;
        return {
            targetId,
            targetDiscovered: u.galacticMap.stars.find((s) => s.id === targetId)?.discovered === true,
            sectors: u.galacticMap.sectors.size,
            stars: u.galacticMap.stars.length,
            relays: u.galacticMap.relays.length,
            refuel: u.galacticMap.refuelingStations.length,
            shipyards: u.galacticMap.deepShipyards.length,
            megastructures: u.galacticMap.megastructures.length
        };
    }, galaxyProbeTargetId);
    assert(galaxyAfterReload.targetDiscovered && galaxyAfterReload.sectors === galaxyBeforeReload.sectors && galaxyAfterReload.relays === galaxyBeforeReload.relays && galaxyAfterReload.refuel === galaxyBeforeReload.refuel && galaxyAfterReload.shipyards === galaxyBeforeReload.shipyards && galaxyAfterReload.megastructures === galaxyBeforeReload.megastructures, 'save/reload preserves discovered galaxy and expansion infrastructure', { galaxyBeforeReload, galaxyAfterReload });
    await validateScene('post-reload');

    await setPhase('lunar-expansion');
    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-btn-ops').click();
    const preLaunchControls = await page.evaluate(() => ({
        orbitDisabled: document.querySelector('#ep-btn-orbit')?.disabled,
        moonDisabled: document.querySelector('#ep-btn-moon')?.disabled,
        orbitLabel: document.querySelector('#ep-btn-orbit .ep-orbit-label')?.textContent,
        moonLabel: document.querySelector('#ep-btn-moon .ep-moon-label')?.textContent,
        launchReady: window.game.hasOperationalLaunchSite()
    }));
    assert(!preLaunchControls.launchReady && preLaunchControls.orbitDisabled && preLaunchControls.moonDisabled, 'orbital and lunar travel are gated before an operational Launch Site', preLaunchControls);
    await page.locator('#ep-btn-ops').click();

    await page.locator('#ep-btn-industry').click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#ep-industry-modal')).display === 'flex');
    const launchCard = page.locator('.ep-bp-card').filter({ hasText: 'Launch Site Blueprint' });
    assert(await launchCard.count() === 1, 'Launch Site blueprint is available for orbital progression');
    await launchCard.click();
    await page.waitForFunction(() => window.game.industry.jobs.some((job) => job.type === 'launch_site'), null, { timeout: ciTimeout(1800) });
    assert(await page.evaluate(() => window.game.industry.jobs.some((job) => job.type === 'launch_site')), 'Launch Site manufacturing starts through the real Industry card');
    await page.locator('#ep-industry-modal .ep-modal-header button').click();
    await clickTimeSpeed('10x Speed');
    await page.waitForFunction(() => window.game.inventory.some((item) => item.type === 'launch_site' && item.count > 0), null, { timeout: ciTimeout(26000) });
    const launchInventory = await page.evaluate(() => window.game.inventory.find((item) => item.type === 'launch_site'));
    assert(launchInventory?.count > 0, 'Launch Site manufacturing completes into deploy inventory', launchInventory || {});

    await clickTimeSpeed('1x Speed');
    await page.locator('.ep-build-btn[data-building-type="launch_site"]').click();
    assert(await page.evaluate(() => window.game.selectedInventoryItem === 'launch_site'), 'Launch Site enters real surface placement mode');
    await placeSelectedStructure('launch_site');
    await clickTimeSpeed('10x Speed');
    await waitForConstruction('launch_site', 26000);
    const orbitalUnlock = await page.evaluate(() => ({
        launchReady: window.game.hasOperationalLaunchSite(),
        lunarBlueprints: ['helium_mine', 'lunar_hab', 'low_g_factory'].map((type) => window.game.blueprints.some((bp) => bp.type === type)),
        orbitDisabled: document.querySelector('#ep-btn-orbit')?.disabled,
        moonDisabled: document.querySelector('#ep-btn-moon')?.disabled,
        heliumCap: window.game.caps.helium3
    }));
    assert(orbitalUnlock.launchReady && orbitalUnlock.lunarBlueprints.every(Boolean), 'operational Launch Site unlocks all lunar blueprints', orbitalUnlock);
    assert(!orbitalUnlock.orbitDisabled && orbitalUnlock.heliumCap >= 250, 'Launch Site unlocks Orbit and a usable Helium-3 storage envelope', orbitalUnlock);

    await page.locator('#ep-btn-industry').click();
    const heliumCard = page.locator('.ep-bp-card').filter({ hasText: 'Helium-3 Extractor Blueprint' });
    assert(await heliumCard.count() === 1, 'Helium-3 Extractor blueprint appears after orbital program unlock');
    await heliumCard.click();
    await page.waitForFunction(() => window.game.industry.jobs.some((job) => job.type === 'helium_mine'), null, { timeout: ciTimeout(1800) });
    await page.locator('#ep-industry-modal .ep-modal-header button').click();
    await page.waitForFunction(() => window.game.inventory.some((item) => item.type === 'helium_mine' && item.count > 0), null, { timeout: ciTimeout(10000) });
    assert(await page.evaluate(() => window.game.inventory.some((item) => item.type === 'helium_mine' && item.count > 0)), 'lunar extractor manufacturing completes before departure');

    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-orbit').click();
    await page.waitForFunction(() => window.game.isOrbitalViewActive === true && window.game.orbit?.active === true && getComputedStyle(document.getElementById('ep-moon-ui')).display !== 'none', null, { timeout: ciTimeout(3000) });
    const orbitState = await page.evaluate(() => ({
        orbital: window.game.isOrbitalViewActive,
        orbitManager: window.game.orbit?.active,
        moonUI: getComputedStyle(document.getElementById('ep-moon-ui')).display,
        place: document.querySelector('#ep-location-display .ep-location-kicker')?.textContent
    }));
    assert(orbitState.orbital && orbitState.orbitManager && orbitState.moonUI !== 'none' && /HIGH ORBIT/i.test(orbitState.place || ''), 'real Orbit control enters high orbit and exposes the Moon', orbitState);

    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-moon').click();
    await page.waitForFunction(() => window.game.isOnMoon === true, null, { timeout: ciTimeout(6000) });
    const moonArrival = await page.evaluate(() => ({
        isOnMoon: window.game.isOnMoon,
        orbital: window.game.isOrbitalViewActive,
        gravity: window.game.modifiers.gravity,
        production: window.game.modifiers.moonProduction,
        place: document.querySelector('#ep-location-display .ep-location-kicker')?.textContent,
        energy: window.game.resources.energy
    }));
    assert(moonArrival.isOnMoon && !moonArrival.orbital && Math.abs(moonArrival.gravity - 0.165) < 0.001 && Math.abs(moonArrival.production - 1.25) < 0.001, 'lunar descent applies real low-gravity and +25% production modifiers', moonArrival);
    assert(/MOON SURFACE/i.test(moonArrival.place || ''), 'location HUD switches to Moon Surface after descent', moonArrival);

    const moonSolarButton = page.locator('.ep-build-btn[data-building-type="solar"]');
    assert(await moonSolarButton.count() === 1, 'a remaining Solar Array can power the first lunar outpost');
    await moonSolarButton.click();
    await placeSelectedStructure('solar');
    const heliumButton = page.locator('.ep-build-btn[data-building-type="helium_mine"]');
    assert(await heliumButton.count() === 1, 'manufactured Helium-3 Extractor is deployable on the Moon');
    await heliumButton.click();
    const heliumPlacement = await placeSelectedStructure('helium_mine');
    const heliumDeposit = await page.evaluate((tileId) => ({
        reserve: window.game.tiles[tileId]?.reserves?.helium3,
        validity: window.game.getPlacementValidity(window.game.tiles[tileId], 'helium_mine')
    }), heliumPlacement.tileId);
    assert(Number(heliumDeposit.reserve) > 0, 'Helium-3 Extractor placement resolves to a detected lunar deposit', heliumDeposit);

    await clickTimeSpeed('10x Speed');
    await waitForConstruction('solar', 8000);
    await waitForConstruction('helium_mine', 10000);
    const heliumBefore = await page.evaluate(() => window.game.resources.helium3);
    await page.waitForTimeout(1200);
    const lunarProduction = await page.evaluate((before) => {
        const extractor = window.game.structures.find((s) => s.type === 'helium_mine');
        return {
            before,
            after: window.game.resources.helium3,
            powered: extractor?.powered,
            cap: window.game.caps.helium3,
            gravity: window.game.modifiers.gravity,
            moonProduction: window.game.modifiers.moonProduction
        };
    }, heliumBefore);
    assert(lunarProduction.powered && lunarProduction.after > lunarProduction.before, 'powered lunar extractor produces Helium-3 under real simulation load', lunarProduction);
    await screenshot('lunar-outpost-online');

    const planetStructureCountBeforeReturn = await page.evaluate(() => window.game.systemStates[String(window.game.currentSystemId)]?.structures?.length || 0);
    await page.locator('#ep-location-display .ep-location-return').click();
    await page.waitForFunction(() => window.game.isOnMoon === false, null, { timeout: ciTimeout(6000) });
    const returnState = await page.evaluate(() => {
        const baseId = String(window.game.currentSystemId);
        return {
            isOnMoon: window.game.isOnMoon,
            gravity: window.game.modifiers.gravity,
            moonProduction: window.game.modifiers.moonProduction,
            planetStructures: window.game.structures.length,
            lunarStructures: window.game.systemStates[`${baseId}_moon`]?.structures?.map((s) => s.type) || [],
            launchReady: window.game.hasOperationalLaunchSite()
        };
    });
    assert(!returnState.isOnMoon && returnState.planetStructures === planetStructureCountBeforeReturn && returnState.launchReady, 'free reserved-propellant return restores the complete planet colony without a lunar softlock', { planetStructureCountBeforeReturn, returnState });
    assert(returnState.lunarStructures.includes('solar') && returnState.lunarStructures.includes('helium_mine'), 'Moon outpost state persists when returning to the planet', returnState);
    assert(Math.abs(returnState.moonProduction - 1) < 0.001, 'planet return removes the lunar production modifier', returnState);

    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-btn-industry').click();
    const lowGCard = page.locator('.ep-bp-card').filter({ hasText: 'Low-G Factory Blueprint' });
    assert(await lowGCard.count() === 1, 'Low-G Factory blueprint remains available after returning from the Moon');
    await lowGCard.click();
    await page.waitForFunction(() => window.game.industry.jobs.some((job) => job.type === 'low_g_factory'), null, { timeout: ciTimeout(1800) });
    if (ciRenderProfile === 'low') {
        const paused = await page.evaluate(() => {
            window.game.setTimeSpeed(0);
            return { timeScale: window.game.timeScale, timeSpeedIndex: window.game.timeSpeedIndex };
        });
        log('ci-simulation-step', { kind: 'freeze-industry-job', type: 'low_g_factory', ...paused });
        if (paused.timeScale !== 0 || paused.timeSpeedIndex !== 0) throw new Error(`CI failed to freeze in-progress Industry job: ${JSON.stringify(paused)}`);
    }
    await page.locator('#ep-industry-modal .ep-modal-header button').click();
    if (ciRenderProfile !== 'low') await clickTimeSpeed('Pause');
    const lunarSaveBefore = await page.evaluate(() => {
        const baseId = String(window.game.currentSystemId);
        return {
            blueprintTypes: window.game.blueprints.filter((bp) => ['helium_mine', 'lunar_hab', 'low_g_factory'].includes(bp.type)).map((bp) => bp.type).sort(),
            inventory: window.game.inventory.map((item) => `${item.type}:${item.count}`).sort(),
            lowGJob: window.game.industry.jobs.find((job) => job.type === 'low_g_factory')?.id || null,
            lunarStructures: window.game.systemStates[`${baseId}_moon`]?.structures?.map((s) => s.type).sort() || [],
            timeSpeedIndex: window.game.timeSpeedIndex
        };
    });
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-save').click();
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: ciTimeout(60000) });
    await waitForGame();
    await page.waitForTimeout(900);
    const lunarSaveAfter = await page.evaluate(() => {
        const baseId = String(window.game.currentSystemId);
        return {
            blueprintTypes: window.game.blueprints.filter((bp) => ['helium_mine', 'lunar_hab', 'low_g_factory'].includes(bp.type)).map((bp) => bp.type).sort(),
            inventory: window.game.inventory.map((item) => `${item.type}:${item.count}`).sort(),
            lowGJob: window.game.industry.jobs.find((job) => job.type === 'low_g_factory')?.id || null,
            lunarStructures: window.game.systemStates[`${baseId}_moon`]?.structures?.map((s) => s.type).sort() || [],
            timeSpeedIndex: window.game.timeSpeedIndex,
            launchReady: window.game.hasOperationalLaunchSite()
        };
    });
    assert(JSON.stringify(lunarSaveAfter.blueprintTypes) === JSON.stringify(lunarSaveBefore.blueprintTypes) && lunarSaveAfter.blueprintTypes.length === 3, 'save/reload preserves all lunar blueprint unlocks', { lunarSaveBefore, lunarSaveAfter });
    assert(JSON.stringify(lunarSaveAfter.inventory) === JSON.stringify(lunarSaveBefore.inventory), 'save/reload now preserves deploy inventory', { before: lunarSaveBefore.inventory, after: lunarSaveAfter.inventory });
    assert(lunarSaveAfter.lowGJob === lunarSaveBefore.lowGJob && !!lunarSaveAfter.lowGJob, 'save/reload now preserves an in-progress Industry job', { lunarSaveBefore, lunarSaveAfter });
    assert(JSON.stringify(lunarSaveAfter.lunarStructures) === JSON.stringify(lunarSaveBefore.lunarStructures) && lunarSaveAfter.launchReady, 'save/reload preserves lunar outpost and orbital unlock state', { lunarSaveBefore, lunarSaveAfter });
    assert(lunarSaveAfter.timeSpeedIndex === 0, 'save/reload preserves paused simulation speed state', lunarSaveAfter);
    await clickTimeSpeed('1x Speed');
    await screenshot('lunar-expansion-persisted');

    await setPhase('archaeology-expansion');
    await clickTimeSpeed('Pause');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-archaeology').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-archaeology-modal')).display === 'flex', null, { timeout: ciTimeout(4000) });
    const archaeologyWindow = await getWindowRect('#ep-archaeology-modal > .ep-modal');
    assert(archaeologyWindow.managed && windowRectInsideViewport(archaeologyWindow, 1440, 900), 'Archaeology catalog opens as a managed in-viewport game window', archaeologyWindow);
    const archaeologyStart = await page.evaluate(() => ({
        worldKey: window.game.archaeology.activeWorldKey,
        sites: window.game.archaeology.excavationSites.map((site) => ({ id: site.id, tileId: site.tileId, status: site.status, progress: site.progress })),
        artifacts: window.game.archaeology.artifacts.length,
        ruinMarkers: window.game.planetMesh.children.filter((child) => child.userData?.isRuin).length
    }));
    assert(archaeologyStart.sites.length >= 1 && archaeologyStart.ruinMarkers >= 1, 'deterministic archaeology creates persistent visible ruin sites for the active world', archaeologyStart);

    const firstSiteButton = page.locator('[data-arch-action="site"]').first();
    assert(await firstSiteButton.count() === 1, 'Archaeology catalog exposes a real excavation action');
    await firstSiteButton.click();
    const activeSiteId = archaeologyStart.sites.find((site) => site.status !== 'claimed')?.id;
    assert(!!activeSiteId, 'an unclaimed archaeology site is available for excavation', archaeologyStart);
    const energyBeforeDig = await page.evaluate(() => window.game.resources.energy);
    for (let index = 0; index < 25; index += 1) {
        const done = await page.evaluate((siteId) => window.game.archaeology.excavationSites.find((site) => site.id === siteId)?.progress >= 100, activeSiteId);
        if (done) break;
        const cell = page.locator(`[data-dig-index="${index}"]`);
        if (await cell.count() && await cell.isEnabled()) await cell.click();
    }
    const exposed = await page.evaluate((siteId) => {
        const site = window.game.archaeology.excavationSites.find((entry) => entry.id === siteId);
        return { progress: site?.progress, fragments: site?.fragments, revealed: site?.revealed?.length, energy: window.game.resources.energy };
    }, activeSiteId);
    assert(exposed.progress === 100 && exposed.fragments === 5 && exposed.revealed >= 5, 'real dig-cell interactions expose a relic after five deterministic fragments', exposed);
    const excavationEnergySpent = energyBeforeDig - exposed.energy;
    const expectedExcavationCost = exposed.revealed * 5;
    assert(Math.abs(excavationEnergySpent - expectedExcavationCost) < 0.01, 'archaeology excavation deducts exactly 5 Energy per revealed cell while simulation is paused', { energyBeforeDig, exposed, excavationEnergySpent, expectedExcavationCost });
    const claimRelic = page.locator('[data-arch-action="claim"]');
    assert(await claimRelic.count() === 1, 'completed excavation exposes a real Claim Relic action');
    await claimRelic.click();
    const archaeologyClaimed = await page.evaluate((siteId) => {
        const site = window.game.archaeology.excavationSites.find((entry) => entry.id === siteId);
        const artifact = window.game.archaeology.artifacts.find((entry) => entry.id === site?.claimedArtifactId);
        return {
            status: site?.status,
            artifact,
            artifacts: window.game.archaeology.artifacts.length,
            tileHasRuin: window.game.tiles.find((tile) => Number(tile.id) === Number(site?.tileId))?.hasRuin,
            ruinMarkers: window.game.planetMesh.children.filter((child) => child.userData?.isRuin).length,
            totalSites: window.game.archaeology.excavationSites.length
        };
    }, activeSiteId);
    assert(archaeologyClaimed.status === 'claimed' && !!archaeologyClaimed.artifact, 'Claim Relic archives the site and adds a named artifact to the permanent collection', archaeologyClaimed);
    assert(!archaeologyClaimed.tileHasRuin && archaeologyClaimed.ruinMarkers === archaeologyClaimed.totalSites - 1, 'claimed archaeology site removes its surface ruin marker without duplicating other sites', archaeologyClaimed);
    await screenshot('archaeology-relic-claimed');
    await page.locator('[data-arch-action="close"]').click();
    await clickTimeSpeed('1x Speed');

    const relicIdBeforeReload = archaeologyClaimed.artifact.id;
    const archaeologyWorldKeyBeforeReload = archaeologyStart.worldKey;
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-save').click();
    await page.waitForTimeout(180);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: ciTimeout(60000) });
    await waitForGame();
    await page.waitForTimeout(1000);
    const archaeologyReloaded = await page.evaluate(({ relicId, worldKey }) => {
        const manager = window.game.archaeology;
        const state = manager.worldStates?.[worldKey];
        const claimed = state?.sites?.find((site) => site.claimedArtifactId === relicId);
        return {
            activeWorldKey: manager.activeWorldKey,
            siteCount: state?.sites?.length || 0,
            claimedStatus: claimed?.status,
            artifactPresent: manager.artifacts.some((artifact) => artifact.id === relicId),
            artifactCount: manager.artifacts.length,
            claimedTileHasRuin: claimed ? window.game.tiles.find((tile) => Number(tile.id) === Number(claimed.tileId))?.hasRuin : null,
            ruinMarkers: window.game.planetMesh.children.filter((child) => child.userData?.isRuin).length
        };
    }, { relicId: relicIdBeforeReload, worldKey: archaeologyWorldKeyBeforeReload });
    assert(archaeologyReloaded.activeWorldKey === archaeologyWorldKeyBeforeReload && archaeologyReloaded.siteCount === archaeologyClaimed.totalSites, 'archaeology reload reuses the same deterministic world-site catalog instead of regenerating duplicates', archaeologyReloaded);
    assert(archaeologyReloaded.artifactPresent && archaeologyReloaded.claimedStatus === 'claimed' && archaeologyReloaded.claimedTileHasRuin === false, 'save/reload preserves recovered relic and claimed-site state', archaeologyReloaded);
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-archaeology').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-archaeology-modal')).display === 'flex');
    assert(await page.locator('#ep-archaeology-content').getByText(archaeologyClaimed.artifact.name).count() >= 1, 'Archaeology collection UI shows the persisted recovered relic after reload');
    await page.locator('[data-arch-action="close"]').click();
    await screenshot('archaeology-expansion-persisted');

    await setPhase('fleet-expansion');
    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-fleet').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-fleet-modal')).display === 'flex', null, { timeout: ciTimeout(4000) });
    const fleetWindow = await getWindowRect('#ep-fleet-modal > .ep-modal');
    assert(fleetWindow.managed && windowRectInsideViewport(fleetWindow, 1440, 900), 'Fleet Command opens as a managed in-viewport window', fleetWindow);
    const fleetStart = await page.evaluate(() => ({ ships: window.game.ships.length, designs: window.game.shipDesigner.designs.length }));
    assert(fleetStart.ships === 0, 'fresh workload reaches Fleet expansion without an injected vessel', fleetStart);

    await page.locator('#ep-btn-new-design').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-designer-modal')).display === 'flex', null, { timeout: ciTimeout(4000) });
    const designerWindow = await getWindowRect('#ep-designer-modal > .ep-modal');
    assert(designerWindow.managed && windowRectInsideViewport(designerWindow, 1440, 900), 'Ship Designer creates a real managed workstation on first use', designerWindow);
    await page.locator('#ep-design-name').fill('Pathfinder Scout');
    await page.locator('#ep-design-hulls .ep-design-item[data-module-id="hull_interceptor"]').click();
    await page.locator('#ep-design-engines .ep-design-item[data-module-id="eng_ion"]').click();
    await page.locator('#ep-design-weapons .ep-design-item[data-module-id="wep_laser"]').click();
    const draft = await page.evaluate(() => {
        const d = window.game.shipDesigner.currentDraft;
        const preview = new ShipDesign('Workload Preview', d.hull, d.engine, (d.slots || []).filter((m) => m?.type === 'weapon'), (d.slots || []).filter((m) => m?.type === 'shield'));
        return { hull: d.hull?.id, engine: d.engine?.id, modules: (d.slots || []).filter(Boolean).map((m) => m.id), stats: preview.stats, cost: preview.cost };
    });
    assert(draft.hull === 'hull_interceptor' && draft.engine === 'eng_ion' && draft.modules.includes('wep_laser') && draft.stats.speed >= 10, 'real Ship Designer selections produce a mission-capable scout design', draft);
    await page.locator('#ep-btn-save-design').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-fleet-modal')).display === 'flex' && window.game.shipDesigner.designs.some((d) => d.name === 'Pathfinder Scout'), null, { timeout: ciTimeout(5000) });
    const designState = await page.evaluate(() => {
        const design = window.game.shipDesigner.designs.find((d) => d.name === 'Pathfinder Scout');
        return design ? { id: design.id, name: design.name, stats: design.stats, cost: design.cost } : null;
    });
    assert(!!designState?.id, 'saved Ship Designer blueprint returns to Fleet shipyard', designState || {});
    await page.locator('#ep-fleet-build-design').selectOption(String(designState.id));
    await page.locator('#ep-fleet-list .ep-sys-btn').filter({ hasText: /^BUILD$/ }).click();
    await page.waitForFunction(() => window.game.ships.length === 1, null, { timeout: ciTimeout(5000) });
    const shipBuilt = await page.evaluate(() => {
        const ship = window.game.ships[0];
        return { id: ship.id, designId: ship.designId, name: ship.name, status: ship.status, currentStarId: ship.currentStarId, stats: ship.stats, designStats: ship.design?.stats };
    });
    assert(shipBuilt.designId === designState.id && shipBuilt.status === 'docked' && !!shipBuilt.currentStarId, 'Fleet shipyard builds a persistent docked vessel in the current system', shipBuilt);

    const missionSelect = page.locator(`.ep-fleet-mission-select[data-ship-id="${shipBuilt.id}"]`);
    const miningOption = missionSelect.locator('option[value="asteroid_mining"]');
    const patrolOption = missionSelect.locator('option[value="scout_patrol"]');
    assert(await miningOption.isDisabled(), 'Fleet mission requirements lock Asteroid Belt for an under-capacity interceptor');
    assert(!(await patrolOption.isDisabled()), 'Fleet mission requirements allow Sector Patrol for the scout');
    await page.locator('#ep-fleet-formation').selectOption('Turtle');
    await page.waitForFunction(() => window.game.fleetManager.activeFormation === 'Turtle');
    const formationStats = await page.evaluate((shipId) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        const stats = window.game.fleetManager.getShipMissionStats(ship);
        return { activeFormation: window.game.fleetManager.activeFormation, stats, chance: window.game.fleetManager.getMissionSuccessChance(ship, 'scout_patrol') };
    }, shipBuilt.id);
    assert(formationStats.activeFormation === 'Turtle' && formationStats.stats.defense > 0 && formationStats.chance >= 0.35 && formationStats.chance <= 0.98, 'formation bonuses feed the Fleet mission readiness model', formationStats);

    await missionSelect.selectOption('scout_patrol');
    await page.locator(`.ep-fleet-deploy[data-ship-id="${shipBuilt.id}"]`).click();
    const missionStarted = await page.evaluate((shipId) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        return { status: ship?.status, mission: ship?.mission ? { ...ship.mission } : null };
    }, shipBuilt.id);
    assert(missionStarted.status === 'mission' && missionStarted.mission?.type === 'scout_patrol' && missionStarted.mission.durationSeconds === 10 && missionStarted.mission.remaining > 0 && missionStarted.mission.remaining <= missionStarted.mission.durationSeconds && missionStarted.mission.elapsed >= 0 && missionStarted.mission.successChance > 0, 'real Fleet Deploy starts a live simulation-time patrol with projected success chance', missionStarted);
    await page.locator('#ep-fleet-modal .ep-modal-header button').click();
    await clickTimeSpeed('10x Speed');
    await page.waitForFunction((shipId) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        return ship?.status === 'docked' && window.game.fleetManager.missionHistory.length >= 1;
    }, shipBuilt.id, { timeout: ciTimeout(6000) });
    const missionOutcome = await page.evaluate((shipId) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        const history = window.game.fleetManager.missionHistory[0];
        return { shipStatus: ship?.status, hp: ship?.stats?.hp, history, resources: { data: window.game.resources.data } };
    }, shipBuilt.id);
    assert(missionOutcome.shipStatus === 'docked' && missionOutcome.history?.missionKey === 'scout_patrol' && typeof missionOutcome.history.success === 'boolean', '10x simulation completes Fleet mission into a deterministic outcome/history entry', missionOutcome);
    assert((missionOutcome.history.success && missionOutcome.history.rewards.data === 50) || (!missionOutcome.history.success && missionOutcome.history.damage > 0), 'Fleet mission risk now produces either full reward or explicit hull damage', missionOutcome.history);

    await clickTimeSpeed('1x Speed');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-fleet').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-fleet-modal')).display === 'flex');
    assert(await page.locator('#ep-fleet-list').getByText('RECENT MISSION LOG').count() === 1, 'Fleet Command visibly surfaces recent mission outcomes');
    const secondMissionSelect = page.locator(`.ep-fleet-mission-select[data-ship-id="${shipBuilt.id}"]`);
    await secondMissionSelect.selectOption('scout_patrol');
    await page.locator(`.ep-fleet-deploy[data-ship-id="${shipBuilt.id}"]`).click();
    if (ciRenderProfile === 'low') {
        const checkpoint = await page.evaluate((shipId) => {
            const g = window.game;
            g.setTimeSpeed(0);
            const ship = g.ships.find((entry) => entry.id === shipId);
            const before = Number(ship?.mission?.remaining);
            if (ship?.status === 'mission' && Number.isFinite(before) && before > 1) g.fleetManager.update(1);
            return {
                status: ship?.status,
                missionId: ship?.mission?.id || null,
                before,
                remaining: Number(ship?.mission?.remaining),
                timeScale: g.timeScale,
                timeSpeedIndex: g.timeSpeedIndex
            };
        }, shipBuilt.id);
        log('ci-simulation-step', { kind: 'fleet-persistence-checkpoint', ...checkpoint });
        if (checkpoint.status !== 'mission' || !checkpoint.missionId || !(checkpoint.remaining > 0 && checkpoint.remaining < checkpoint.before) || checkpoint.timeScale !== 0) {
            throw new Error(`CI failed to create in-progress Fleet checkpoint: ${JSON.stringify(checkpoint)}`);
        }
    }
    await page.locator('#ep-fleet-modal .ep-modal-header button').click();
    if (ciRenderProfile !== 'low') await page.waitForTimeout(700);
    const fleetBeforeSave = await page.evaluate((shipId) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        return {
            shipId,
            missionId: ship?.mission?.id,
            remaining: ship?.mission?.remaining,
            designId: ship?.designId,
            designName: ship?.design?.name,
            formation: window.game.fleetManager.activeFormation,
            historyCount: window.game.fleetManager.missionHistory.length
        };
    }, shipBuilt.id);
    assert(fleetBeforeSave.remaining > 0 && fleetBeforeSave.remaining < 10, 'second Fleet patrol is captured in progress before save', fleetBeforeSave);
    if (ciRenderProfile !== 'low') await clickTimeSpeed('Pause');
    const fleetSavedSnapshot = await page.evaluate((shipId) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        return { missionId: ship?.mission?.id, remaining: ship?.mission?.remaining, timeSpeedIndex: window.game.timeSpeedIndex };
    }, fleetBeforeSave.shipId);
    assert(fleetSavedSnapshot.missionId === fleetBeforeSave.missionId && fleetSavedSnapshot.remaining > 0 && fleetSavedSnapshot.remaining <= fleetBeforeSave.remaining && fleetSavedSnapshot.timeSpeedIndex === 0, 'Pause freezes the second Fleet patrol at the exact state that will be saved', { fleetBeforeSave, fleetSavedSnapshot });
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-save').click();
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: ciTimeout(60000) });
    await waitForGame();
    await page.waitForTimeout(900);
    const fleetReloaded = await page.evaluate(({ shipId, missionId, designId }) => {
        const ship = window.game.ships.find((entry) => entry.id === shipId);
        const design = window.game.shipDesigner.designs.find((entry) => entry.id === designId);
        return {
            shipPresent: !!ship,
            designPresent: !!design,
            missionId: ship?.mission?.id,
            remaining: ship?.mission?.remaining,
            status: ship?.status,
            formation: window.game.fleetManager.activeFormation,
            historyCount: window.game.fleetManager.missionHistory.length,
            timeSpeedIndex: window.game.timeSpeedIndex
        };
    }, { shipId: fleetBeforeSave.shipId, missionId: fleetBeforeSave.missionId, designId: fleetBeforeSave.designId });
    assert(fleetReloaded.shipPresent && fleetReloaded.designPresent, 'save/reload restores ship designs before deserializing Fleet vessels', { fleetBeforeSave, fleetReloaded });
    assert(fleetReloaded.status === 'mission' && fleetReloaded.missionId === fleetSavedSnapshot.missionId && Math.abs(fleetReloaded.remaining - fleetSavedSnapshot.remaining) < 0.15, 'save/reload preserves the paused in-progress Fleet mission snapshot', { fleetBeforeSave, fleetSavedSnapshot, fleetReloaded });
    assert(fleetReloaded.formation === 'Turtle' && fleetReloaded.historyCount === fleetBeforeSave.historyCount && fleetReloaded.timeSpeedIndex === 0, 'Fleet command state, mission history and pause state persist together', { fleetBeforeSave, fleetReloaded });
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-fleet').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-fleet-modal')).display === 'flex');
    assert(await page.locator('#ep-fleet-formation').inputValue() === 'Turtle', 'Fleet formation selector reflects persisted command state after reload');
    await page.locator('#ep-fleet-modal .ep-modal-header button').click();
    await clickTimeSpeed('10x Speed');
    await page.waitForFunction((shipId) => window.game.ships.find((entry) => entry.id === shipId)?.status === 'docked' && window.game.fleetManager.missionHistory.length >= 2, fleetBeforeSave.shipId, { timeout: ciTimeout(6000) });
    assert(await page.evaluate(() => window.game.fleetManager.missionHistory.length >= 2), 'restored Fleet mission continues and completes under accelerated simulation');
    await clickTimeSpeed('1x Speed');
    await screenshot('fleet-expansion-persisted');

    await setPhase('economy-expansion');
    await clickTimeSpeed('Pause');
    await page.locator('#ep-btn-ops').click();
    const passiveToastPointerEvents = await page.evaluate(() => {
        window.game.notify('Passive notification interaction probe.', 'info');
        const toast = document.querySelector('#ep-notifications .ep-notification');
        return toast ? getComputedStyle(toast).pointerEvents : null;
    });
    assert(passiveToastPointerEvents === 'none', 'passive Pioneer notifications never intercept command-deck pointer input', { passiveToastPointerEvents });
    await page.locator('#ep-btn-trade').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-market-modal')).display === 'flex' && document.querySelector('#ep-market-modal > .ep-modal.ep-window-managed'), null, { timeout: ciTimeout(4000) });
    const marketWindow = await getWindowRect('#ep-market-modal > .ep-modal');
    assert(marketWindow.managed && windowRectInsideViewport(marketWindow, 1440, 900), 'Galactic Market opens as a managed in-viewport window', marketWindow);
    const stablePrice = await page.evaluate(() => {
        const a = window.game.economyManager.getPrice('minerals');
        const b = window.game.economyManager.getPrice('minerals');
        return { a, b, statePrice: window.game.economyManager.marketState.minerals.price };
    });
    assert(Math.abs(stablePrice.a - stablePrice.b) < 1e-9, 'market price is state-driven and deterministic across repeated renders', stablePrice);

    const mineralBefore = await page.evaluate(() => ({
        minerals: window.game.resources.minerals,
        credits: window.game.resources.credits,
        ledger: window.game.economyManager.ledger.length
    }));
    const mineralCard = page.locator('#ep-market-content .ep-panel').filter({ hasText: 'minerals' }).first();
    assert(await mineralCard.count() === 1, 'commodity exchange renders a Minerals market card');
    await mineralCard.getByRole('button', { name: /BUY 10/i }).click();
    const mineralBought = await page.evaluate(() => ({
        minerals: window.game.resources.minerals,
        credits: window.game.resources.credits,
        lastLedger: window.game.economyManager.ledger.at(-1)
    }));
    assert(Math.abs(mineralBought.minerals - mineralBefore.minerals - 10) < 1e-6 && mineralBought.credits < mineralBefore.credits && mineralBought.lastLedger?.type === 'BUY', 'real commodity Buy action transfers stock and records the ledger transaction', { mineralBefore, mineralBought });
    await mineralCard.getByRole('button', { name: /SELL 10/i }).click();
    const mineralSold = await page.evaluate(() => ({
        minerals: window.game.resources.minerals,
        credits: window.game.resources.credits,
        lastLedger: window.game.economyManager.ledger.at(-1),
        price: window.game.economyManager.marketState.minerals.price
    }));
    assert(Math.abs(mineralSold.minerals - mineralBefore.minerals) < 1e-6 && mineralSold.lastLedger?.type === 'SELL', 'real commodity Sell action returns inventory and records the ledger transaction', { mineralBefore, mineralSold });
    assert(mineralSold.price !== stablePrice.statePrice, 'commodity trading feeds back into the simulated market price state', { stablePrice, mineralSold });
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'CLOSE' }).click();

    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-stocks').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-stocks-modal')).display === 'flex');
    const stockWindow = await getWindowRect('#ep-stocks-modal > .ep-modal');
    assert(stockWindow.managed && windowRectInsideViewport(stockWindow, 1440, 900), 'Galactic Stock Exchange participates in managed-window layout', stockWindow);
    const stockState = await page.evaluate(() => {
        const manager = window.game.economyManager;
        const credits = Number(window.game.resources.credits || 0);
        const stocks = manager.stocks.map((stock) => ({ id: stock.id, name: stock.name, price: stock.price, owned: stock.playerOwned, lotCost: stock.price * 10 }));
        const sellTarget = stocks.find((stock) => stock.owned >= 10) || null;
        const purchaseTarget = stocks
            .filter((stock) => stock.id !== sellTarget?.id && stock.lotCost <= credits)
            .sort((a, b) => a.lotCost - b.lotCost)[0]
            || stocks.filter((stock) => stock.lotCost <= credits).sort((a, b) => a.lotCost - b.lotCost)[0]
            || null;
        const unaffordableTarget = stocks.filter((stock) => stock.lotCost > credits).sort((a, b) => b.lotCost - a.lotCost)[0] || null;
        return { credits, stocks, purchaseTarget, sellTarget, unaffordableTarget };
    });
    assert(!!stockState.purchaseTarget && !!stockState.sellTarget, 'Stock Exchange exposes both an affordable purchase lot and an owned sell lot', stockState);
    const stockTarget = stockState.purchaseTarget;
    const purchaseCard = page.locator(`.ep-stock-card[data-stock-id="${stockTarget.id}"]`);
    const purchaseBuy = purchaseCard.locator('[data-stock-action="buy"]');
    assert(!(await purchaseBuy.isDisabled()), 'affordable 10-share stock lot is visibly actionable', stockTarget);
    if (stockState.unaffordableTarget) {
        const unaffordableBuy = page.locator(`.ep-stock-card[data-stock-id="${stockState.unaffordableTarget.id}"] [data-stock-action="buy"]`);
        assert(await unaffordableBuy.isDisabled(), 'unaffordable 10-share stock lot is disabled before transaction', stockState.unaffordableTarget);
    }
    await purchaseBuy.click();
    const stockBought = await page.evaluate((stockId) => {
        const stock = window.game.economyManager.stocks.find((entry) => entry.id === stockId);
        return { owned: stock?.playerOwned, credits: window.game.resources.credits, lastLedger: window.game.economyManager.ledger.at(-1) };
    }, stockTarget.id);
    assert(stockBought.owned === stockTarget.owned + 10 && stockBought.credits < stockState.credits && stockBought.lastLedger?.type === 'STOCK_BUY', 'Stock Exchange BUY 10 creates a real holding and ledger entry', { stockTarget, stockState, stockBought });

    const sellTarget = stockState.sellTarget;
    const sellCard = page.locator(`.ep-stock-card[data-stock-id="${sellTarget.id}"]`);
    const sellButton = sellCard.locator('[data-stock-action="sell"]');
    assert(!(await sellButton.isDisabled()), 'owned 10-share stock lot is visibly sellable', sellTarget);
    await sellButton.click();
    const stockAfter = await page.evaluate(({ purchaseId, sellId }) => {
        const purchase = window.game.economyManager.stocks.find((entry) => entry.id === purchaseId);
        const sold = window.game.economyManager.stocks.find((entry) => entry.id === sellId);
        return {
            purchaseOwned: purchase?.playerOwned,
            soldOwned: sold?.playerOwned,
            ledgerTypes: window.game.economyManager.ledger.slice(-2).map((entry) => entry.type),
            credits: window.game.resources.credits
        };
    }, { purchaseId: stockTarget.id, sellId: sellTarget.id });
    assert(stockAfter.purchaseOwned === stockTarget.owned + 10 && stockAfter.soldOwned === sellTarget.owned - 10 && stockAfter.ledgerTypes[0] === 'STOCK_BUY' && stockAfter.ledgerTypes[1] === 'STOCK_SELL', 'Stock Exchange buy/sell UI leaves the purchased holding plus complete ledger history', { stockTarget, sellTarget, stockAfter });
    await page.locator('#ep-stocks-modal .ep-modal-header button').click();

    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-trade').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-market-modal')).display === 'flex');
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'ROUTES' }).click();
    const routeState = await page.evaluate(() => {
        window.game.economyManager.syncTradeRoutesFromGalaxy();
        const route = window.game.economyManager.tradeRoutes.find((entry) => entry.local) || window.game.economyManager.tradeRoutes[0];
        const ship = window.game.ships.find((entry) => entry.status === 'docked');
        return route && ship ? { route: { id: route.id, name: route.name, duration: route.duration, credits: route.credits, risk: route.risk }, ship: { id: ship.id, name: ship.name } } : null;
    });
    assert(!!routeState?.route && !!routeState?.ship, 'discovered Galaxy and Launch Site generate a dispatchable trade route with a docked Fleet vessel', routeState || {});
    const routeShipSelect = page.locator(`[data-trade-ship-for="${routeState.route.id}"]`);
    await routeShipSelect.selectOption(String(routeState.ship.id));
    await page.locator(`[data-trade-insure-for="${routeState.route.id}"]`).check();
    await page.locator(`[data-trade-dispatch="${routeState.route.id}"]`).click();
    const tradeStarted = await page.evaluate(({ routeId, shipId }) => {
        const fleet = window.game.economyManager.tradeFleets.find((entry) => entry.routeId === routeId && String(entry.shipId) === String(shipId));
        const ship = window.game.ships.find((entry) => String(entry.id) === String(shipId));
        return { fleet: fleet ? { ...fleet } : null, shipStatus: ship?.status, credits: window.game.resources.credits };
    }, { routeId: routeState.route.id, shipId: routeState.ship.id });
    assert(tradeStarted.fleet?.insured && tradeStarted.shipStatus === 'trading' && tradeStarted.fleet.timer === routeState.route.duration, 'real Trade Route dispatch assigns selected vessel, insurance and simulation timer', { routeState, tradeStarted });
    const firstTradeFleetId = tradeStarted.fleet.id;
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'CLOSE' }).click();
    await clickTimeSpeed('10x Speed');
    await page.waitForFunction((fleetId) => {
        const fleet = window.game.economyManager.tradeFleets.find((entry) => entry.id === fleetId);
        return Number(fleet?.runsCompleted || 0) >= 1;
    }, firstTradeFleetId, { timeout: ciTimeout(8000) });
    const tradeRun = await page.evaluate((fleetId) => {
        const fleet = window.game.economyManager.tradeFleets.find((entry) => entry.id === fleetId);
        const route = window.game.economyManager.tradeRoutes.find((entry) => entry.id === fleet?.routeId);
        return {
            fleetRuns: fleet?.runsCompleted,
            routeRuns: route?.runsCompleted,
            credits: window.game.resources.credits,
            ledger: window.game.economyManager.ledger.filter((entry) => entry.type === 'TRADE_ROUTE').slice(-2)
        };
    }, firstTradeFleetId);
    assert(tradeRun.fleetRuns >= 1 && tradeRun.routeRuns >= 1 && tradeRun.ledger.length >= 1, '10x simulation completes autonomous trade run and records payout in route + ledger state', tradeRun);
    await clickTimeSpeed('Pause');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-trade').click();
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'ROUTES' }).click();
    const recallButton = page.locator(`[data-trade-recall="${firstTradeFleetId}"]`);
    assert(await recallButton.count() === 1, 'active trade fleet exposes a real Recall action');
    await recallButton.click();
    const recalled = await page.evaluate((shipId) => ({
        status: window.game.ships.find((entry) => String(entry.id) === String(shipId))?.status,
        activeFleets: window.game.economyManager.tradeFleets.length
    }), routeState.ship.id);
    assert(recalled.status === 'docked' && recalled.activeFleets === 0, 'Recall returns autonomous trader to Fleet docked state', recalled);

    await page.evaluate(() => {
        const bm = window.game.economyManager.blackMarket;
        bm.active = true;
        bm.timer = 120;
        bm.inventory = [{ name: 'Encrypted Survey Archive', cost: 120, type: 'data' }];
    });
    await page.evaluate(() => window.game.renderMarket());
    await page.locator('#ep-btn-black-market').click();
    const blackBefore = await page.evaluate(() => ({ credits: window.game.resources.credits, data: window.game.resources.data, ledger: window.game.economyManager.ledger.length }));
    assert(await page.locator('#ep-market-content').getByText('Encrypted Survey Archive').count() >= 1, 'active Black Market branch is reachable through the authoritative Market renderer');
    await page.locator('#ep-market-content').getByRole('button', { name: 'PURCHASE' }).click();
    const blackAfter = await page.evaluate(() => ({
        credits: window.game.resources.credits,
        data: window.game.resources.data,
        inventory: window.game.economyManager.blackMarket.inventory.length,
        lastLedger: window.game.economyManager.ledger.at(-1)
    }));
    assert(Math.abs(blackAfter.credits - (blackBefore.credits - 120)) < 1e-6 && blackAfter.data === blackBefore.data + 500 && blackAfter.inventory === 0 && blackAfter.lastLedger?.type === 'BLACK_MARKET', 'Black Market purchase uses real UI, applies reward/cost and persists in economic ledger', { blackBefore, blackAfter });

    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'ROUTES' }).click();
    await page.locator(`[data-trade-ship-for="${routeState.route.id}"]`).selectOption(String(routeState.ship.id));
    await page.locator(`[data-trade-dispatch="${routeState.route.id}"]`).click();
    const persistenceFleet = await page.evaluate(({ routeId, shipId }) => {
        const fleet = window.game.economyManager.tradeFleets.find((entry) => entry.routeId === routeId && String(entry.shipId) === String(shipId));
        return fleet ? { id: fleet.id, timer: fleet.timer, duration: fleet.duration, runsCompleted: fleet.runsCompleted } : null;
    }, { routeId: routeState.route.id, shipId: routeState.ship.id });
    assert(!!persistenceFleet?.id, 'second autonomous trade run starts for save/reload persistence test', persistenceFleet || {});
    if (ciRenderProfile === 'low') {
        const checkpoint = await page.evaluate((fleetId) => {
            const g = window.game;
            g.setTimeSpeed(0);
            const fleet = g.economyManager.tradeFleets.find((entry) => entry.id === fleetId);
            const before = Number(fleet?.timer);
            if (fleet && Number.isFinite(before) && before > 1) g.economyManager.update(1);
            return {
                id: fleet?.id || null,
                before,
                timer: Number(fleet?.timer),
                duration: Number(fleet?.duration),
                runsCompleted: Number(fleet?.runsCompleted || 0),
                timeScale: g.timeScale,
                timeSpeedIndex: g.timeSpeedIndex
            };
        }, persistenceFleet.id);
        log('ci-simulation-step', { kind: 'economy-persistence-checkpoint', ...checkpoint });
        if (!checkpoint.id || !(checkpoint.timer > 0 && checkpoint.timer < checkpoint.before) || checkpoint.runsCompleted !== 0 || checkpoint.timeScale !== 0) {
            throw new Error(`CI failed to create in-progress trade checkpoint: ${JSON.stringify(checkpoint)}`);
        }
    }
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'CLOSE' }).click();
    if (ciRenderProfile !== 'low') {
        await clickTimeSpeed('1x Speed');
        await page.waitForTimeout(700);
        await clickTimeSpeed('Pause');
    }
    const economyBeforeSave = await page.evaluate(({ fleetId, stockId }) => {
        const fleet = window.game.economyManager.tradeFleets.find((entry) => entry.id === fleetId);
        const stock = window.game.economyManager.stocks.find((entry) => entry.id === stockId);
        return {
            fleet: fleet ? { id: fleet.id, timer: fleet.timer, duration: fleet.duration, runsCompleted: fleet.runsCompleted } : null,
            stockOwned: stock?.playerOwned,
            mineralPrice: window.game.economyManager.marketState.minerals.price,
            ledgerLength: window.game.economyManager.ledger.length,
            blackMarketActive: window.game.economyManager.blackMarket.active,
            blackMarketInventory: window.game.economyManager.blackMarket.inventory.length,
            shipStatus: window.game.ships.find((entry) => String(entry.id) === String(fleet?.shipId))?.status,
            timeSpeedIndex: window.game.timeSpeedIndex
        };
    }, { fleetId: persistenceFleet.id, stockId: stockTarget.id });
    assert(economyBeforeSave.fleet?.timer < economyBeforeSave.fleet?.duration && economyBeforeSave.fleet?.timer > 0 && economyBeforeSave.shipStatus === 'trading', 'autonomous trade route is captured in progress before save', economyBeforeSave);
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-save').click();
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: ciTimeout(60000) });
    await waitForGame();
    await page.waitForTimeout(900);
    const economyReloaded = await page.evaluate(({ fleetId, stockId }) => {
        const manager = window.game.economyManager;
        const fleet = manager.tradeFleets.find((entry) => entry.id === fleetId);
        const stock = manager.stocks.find((entry) => entry.id === stockId);
        const ship = window.game.ships.find((entry) => String(entry.id) === String(fleet?.shipId));
        return {
            fleet: fleet ? { id: fleet.id, timer: fleet.timer, duration: fleet.duration, runsCompleted: fleet.runsCompleted } : null,
            stockOwned: stock?.playerOwned,
            mineralPrice: manager.marketState.minerals.price,
            ledgerLength: manager.ledger.length,
            blackMarketActive: manager.blackMarket.active,
            blackMarketInventory: manager.blackMarket.inventory.length,
            shipStatus: ship?.status,
            timeSpeedIndex: window.game.timeSpeedIndex
        };
    }, { fleetId: persistenceFleet.id, stockId: stockTarget.id });
    assert(economyReloaded.fleet?.id === economyBeforeSave.fleet.id && Math.abs(economyReloaded.fleet.timer - economyBeforeSave.fleet.timer) < 0.35 && economyReloaded.shipStatus === 'trading', 'save/reload preserves in-progress autonomous trade fleet and timer', { economyBeforeSave, economyReloaded });
    assert(economyReloaded.stockOwned === economyBeforeSave.stockOwned && Math.abs(economyReloaded.mineralPrice - economyBeforeSave.mineralPrice) < 1e-9 && economyReloaded.ledgerLength === economyBeforeSave.ledgerLength, 'save/reload preserves stock holding, simulated commodity price and full ledger', { economyBeforeSave, economyReloaded });
    assert(economyReloaded.blackMarketActive === economyBeforeSave.blackMarketActive && economyReloaded.blackMarketInventory === 0 && economyReloaded.timeSpeedIndex === 0, 'save/reload preserves Black Market and paused economy state', { economyBeforeSave, economyReloaded });

    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-trade').click();
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'ROUTES' }).click();
    assert(await page.locator(`[data-trade-recall="${persistenceFleet.id}"]`).count() === 1, 'Market UI restores active autonomous trade fleet after reload');
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'CLOSE' }).click();
    await clickTimeSpeed('10x Speed');
    await page.waitForFunction(({ fleetId, runsBefore }) => Number(window.game.economyManager.tradeFleets.find((entry) => entry.id === fleetId)?.runsCompleted || 0) > runsBefore, { fleetId: persistenceFleet.id, runsBefore: economyReloaded.fleet.runsCompleted }, { timeout: ciTimeout(8000) });
    await clickTimeSpeed('Pause');
    await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-trade').click();
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'ROUTES' }).click();
    await page.locator(`[data-trade-recall="${persistenceFleet.id}"]`).click();
    assert(await page.evaluate((shipId) => window.game.ships.find((entry) => String(entry.id) === String(shipId))?.status === 'docked' && window.game.economyManager.tradeFleets.length === 0, routeState.ship.id), 'restored autonomous route completes another run and recalls cleanly to Fleet');
    await page.locator('#ep-market-modal .ep-modal-header button').filter({ hasText: 'CLOSE' }).click();
    await clickTimeSpeed('1x Speed');
    await screenshot('economy-expansion-persisted');

    await setPhase('galaxy-warp');
    await page.locator('#ep-btn-galaxy').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-galaxy-map-modal')).display === 'flex');
    await page.locator('[data-galaxy-action="center"]').click();
    for (let i = 0; i < 3; i += 1) await page.locator('[data-galaxy-action="zoom-out"]').click();
    await page.waitForTimeout(120);
    const warpPoint = await page.evaluate((targetId) => {
        const u = window.game.universe;
        u.renderGalaxyMap();
        const hit = (u._galaxyScreenStars || []).find((entry) => entry.star.id === targetId);
        return hit ? { x: hit.x, y: hit.y, id: hit.star.id, reachable: u.getTravelMetrics(hit.star).reachable } : null;
    }, galaxyProbeTargetId);
    assert(warpPoint?.reachable, 'discovered probe target is inside the expanded warp envelope', warpPoint || {});
    const warpCanvasBox = await page.locator('#ep-galaxy-chart-canvas').boundingBox();
    await page.mouse.click(warpCanvasBox.x + warpPoint.x, warpCanvasBox.y + warpPoint.y);
    await page.waitForFunction((id) => window.game.universe.galaxyViewState.selectedStarId === id, galaxyProbeTargetId);
    await page.locator('[data-galaxy-action="warp"]').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('ep-system-modal')).display === 'flex');
    assert(await page.locator('#ep-btn-warp-peace').isEnabled(), 'peaceful warp action is enabled for reachable discovered target');
    await page.locator('#ep-btn-warp-peace').click();
    await page.waitForFunction((id) => String(window.game.currentSystemId) === String(id), galaxyProbeTargetId, { timeout: ciTimeout(10000) });
    const warpState = await page.evaluate(() => ({
        currentSystemId: String(window.game.currentSystemId),
        chartDisplay: getComputedStyle(document.getElementById('ep-galaxy-map-modal')).display,
        legacyActive: !!window.game.isGalaxyViewActive,
        legacyDisplay: getComputedStyle(document.getElementById('ep-galaxy-container')).display,
        worldSeed: window.game.currentWorldSeed,
        worldType: window.game.currentWorldType,
        expectedWorldType: window.game.getPlanetTypeFromSeed(window.game.currentWorldSeed),
        storedWorldType: window.game.systemStates?.[window.game.currentSystemId]?.worldType || null,
        terrainSpread: (() => {
            const pos = window.game.planetMesh?.geometry?.attributes?.position;
            if (!pos) return null;
            let minR = Infinity, maxR = -Infinity;
            for (let i = 0; i < pos.count; i += 1) {
                const r = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
                minR = Math.min(minR, r); maxR = Math.max(maxR, r);
            }
            return { minR, maxR, spread: maxR - minR };
        })()
    }));
    assert(warpState.chartDisplay === 'none' && !warpState.legacyActive && warpState.legacyDisplay !== 'block', 'modern Galaxy warp closes the chart without activating the obsolete renderer', warpState);
    assert(Number.isFinite(warpState.worldSeed), 'warp generates a playable destination world', warpState);
    assert(warpState.worldType === warpState.expectedWorldType && warpState.storedWorldType === warpState.worldType,
        'modern Galaxy warp now generates and records its deterministic destination world class', warpState);
    if (!['gas', 'giant'].includes(warpState.worldType)) {
        assert(warpState.terrainSpread?.spread > 0.25,
            'modern Galaxy rocky destination has real terrain relief instead of a perfect sphere', warpState);
    }
    await screenshot('galaxy-warp-arrival');

    await setPhase('regeneration-stress');
    const stress = await page.evaluate(() => {
        const g = window.game;
        const originalSeed = g.currentWorldSeed || 12345;
        // Raw planet replacement is tested with no logical colony attached, matching normal warp lifecycle.
        g.structures = [];
        const results = [];
        for (const seed of [24680, 77777, 13579, 424242, 98765]) {
            g.createPlanet(seed, 'planet');
            const pos = g.planetMesh.geometry.attributes.position;
            let minR = Infinity, maxR = -Infinity;
            for (let i = 0; i < pos.count; i += 1) {
                const r = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
                minR = Math.min(minR, r); maxR = Math.max(maxR, r);
            }
            results.push({ seed, minR, maxR, atmosphere: g.atmosphereMesh?.parent === g.scene, cloud: g.cloudMesh?.parent === g.scene, cursor: g.cursorMesh?.parent === g.planetMesh, voxel: window.voxelTerrainSystem?.activePlanet === g.planetMesh, fluid: window.fluidDynamicsSystem?.planet === g.planetMesh });
        }
        g.createPlanet(originalSeed, 'planet');
        return results;
    });
    for (const result of stress) {
        assert(result.minR > 49 && result.maxR < 52, `stress seed ${result.seed} terrain stays bounded`, result);
        assert(result.atmosphere && result.cloud && result.cursor && result.voxel && result.fluid, `stress seed ${result.seed} lifecycle bindings survive`, result);
    }
    log('stress', { regeneration: stress });

    await setPhase('climate-rendering');
    const climateProfiles = await page.evaluate(() => {
        const cold = window.normalizePlanetPhysicalProfile({
            insolation: 0.18,
            equilibriumTemperatureK: 190,
            radius: 1.0,
            mass: 1.0,
            host_star: 'K-type'
        }, 31001, 'planet');
        const greenhouse = window.normalizePlanetPhysicalProfile({
            insolation: 1.0,
            equilibriumTemperatureK: 275,
            radius: 1.0,
            mass: 1.0,
            host_star: 'G-type'
        }, 31002, 'planet');
        const locked = window.normalizePlanetPhysicalProfile({
            insolation: 0.92,
            equilibriumTemperatureK: 270,
            radius: 1.08,
            mass: 1.22,
            koi_period: 12,
            host_star: 'M-type'
        }, 31003, 'planet');
        const gas = window.normalizePlanetPhysicalProfile({
            equilibriumTemperatureK: 1050,
            radius: 10.5,
            mass: 145,
            koi_period: 2.7,
            host_star: 'K-type',
            tidallyLocked: true
        }, 31004, 'gas');
        const desert = window.normalizePlanetPhysicalProfile({
            insolation: 1.35,
            radius: 0.92,
            mass: 0.78,
            host_star: 'K-type'
        }, 31005, 'desert');
        return { cold, greenhouse, locked, gas, desert };
    });
    assert(climateProfiles.cold.climateModel === 'reduced-order-visual-scenario-v1' && climateProfiles.cold.icePotential > 0.35,
        'cold rocky scenario derives a strong cryosphere proxy without claiming observed topography', climateProfiles.cold);
    assert(climateProfiles.greenhouse.estimatedSurfaceTemperatureK > climateProfiles.greenhouse.equilibriumTemperatureK
        && climateProfiles.greenhouse.greenhouseOffsetK > 0,
        'atmosphere-bearing rocky scenario separates equilibrium and greenhouse-adjusted surface temperature', climateProfiles.greenhouse);
    assert(climateProfiles.locked.tidallyLocked && climateProfiles.locked.climateContrast > climateProfiles.greenhouse.climateContrast,
        'short-period M-dwarf scenario activates the reduced-order day/night climate contrast', climateProfiles.locked);
    assert(climateProfiles.gas.worldType === 'gas' && climateProfiles.gas.atmosphereRetention >= 1.4,
        'gas-giant scenario retains a deep-atmosphere profile instead of rocky-world defaults', climateProfiles.gas);
    assert(climateProfiles.desert.worldType === 'desert' && climateProfiles.desert.aridity > 0.7 && climateProfiles.desert.waterPotential < 0.13,
        'desert world class enforces an arid low-water climate profile', climateProfiles.desert);
    assert(climateProfiles.desert.catalogEquilibriumTemperatureK === null
        && Math.abs(climateProfiles.desert.equilibriumTemperatureK - climateProfiles.desert.radiativeEquilibriumTemperatureK) < 1e-6,
        'procedural world derives equilibrium temperature from absorbed stellar flux and Bond albedo', climateProfiles.desert);
    assert(Math.abs(climateProfiles.greenhouse.catalogEquilibriumTemperatureK - 275) < 1e-6
        && Math.abs(climateProfiles.greenhouse.equilibriumTemperatureK - 275) < 1e-6,
        'explicit catalog/scenario equilibrium temperature remains authoritative over the radiative fallback', climateProfiles.greenhouse);

    const climateWorldCases = [
        { type: 'terran', seed: 33000, shaderToken: 'waterMask', displaced: true },
        { type: 'desert', seed: 33005, shaderToken: 'dryBasin', displaced: true },
        { type: 'lava', seed: 33001, shaderToken: 'fracture', displaced: true },
        { type: 'ice', seed: 33002, shaderToken: 'fiss', displaced: true },
        { type: 'gas', seed: 33003, shaderToken: 'bands', displaced: false }
    ];
    const climateWorlds = [];
    for (const testCase of climateWorldCases) {
        const result = await page.evaluate(({ type, seed, shaderToken }) => {
            const g = window.game;
            g.structures = [];
            g.createPlanet(seed, type);
            const pos = g.planetMesh.geometry.attributes.position;
            let minR = Infinity, maxR = -Infinity;
            for (let i = 0; i < pos.count; i += 1) {
                const r = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i));
                minR = Math.min(minR, r);
                maxR = Math.max(maxR, r);
            }
            const terrain = g.planetMesh.userData?.terrain || {};
            const profile = terrain.physicalProfile || {};
            window.renderPioneerClimateModel?.();
            const scienceCardText = document.getElementById('ep-climate-model-card')?.textContent?.replace(/\s+/g, ' ').trim() || '';
            const tileRadii = (g.tiles || []).slice(0, 80).map((tile) => tile.position?.length?.() || NaN);
            const placement = type === 'gas' ? {
                ordinarySurface: g.getPlacementValidity(g.tiles?.[0], 'solar'),
                atmosphericSiphon: g.getPlacementValidity(g.tiles?.[0], 'gas_siphon')
            } : null;
            return {
                type,
                seed,
                minR,
                maxR,
                shaderToken,
                shaderHasToken: String(g.planetMesh.material?.fragmentShader || '').includes(shaderToken),
                version: terrain.version,
                description: terrain.description,
                climateModel: profile.climateModel,
                climateRegime: profile.climateRegime,
                insolationEarth: profile.insolationEarth,
                bondAlbedo: profile.bondAlbedo,
                equilibriumTemperatureK: profile.equilibriumTemperatureK,
                estimatedSurfaceTemperatureK: profile.estimatedSurfaceTemperatureK,
                resolvedSurfaceData: terrain.resolvedSurfaceData,
                finiteProfile: [profile.equilibriumTemperatureK, profile.estimatedSurfaceTemperatureK, profile.gravityEarth]
                    .every(Number.isFinite),
                logicalTileMinR: Math.min(...tileRadii),
                logicalTileMaxR: Math.max(...tileRadii),
                atmospherePresent: !!g.atmosphereMesh && g.atmosphereMesh.parent === g.scene,
                cloudPresent: !!g.cloudMesh && g.cloudMesh.parent === g.scene,
                expectedAtmosphere: !['gas', 'giant', 'moon'].includes(type) && Number(profile.atmosphereRetention || 0) > 0.12,
                expectedCloud: !['gas', 'giant', 'moon'].includes(type) && Number(profile.atmosphereRetention || 0) > 0.12
                    && Number(profile.cloudPotential || 0) > 0.045,
                hazeStrength: g.atmosphereMesh?.material?.uniforms?.hazeStrength?.value ?? null,
                scienceCardText,
                placement
            };
        }, testCase);
        // Yield a few frames so WebGL actually compiles and executes this world's material.
        await page.waitForTimeout(450);
        climateWorlds.push(result);
        assert(result.shaderHasToken, `${testCase.type} world uses its non-flat procedural climate shader`, result);
        assert(result.version === 'catalog-informed-v4-geology' && result.climateModel === 'reduced-order-visual-scenario-v1',
            `${testCase.type} world exposes the climate-model provenance marker`, result);
        assert(result.resolvedSurfaceData === false && /modeled scenarios, not observed exoplanet maps/i.test(result.description || ''),
            `${testCase.type} world clearly labels generated climate/surface fields as modeled rather than observed`, result);
        assert(result.finiteProfile, `${testCase.type} world climate profile remains finite`, result);
        assert(/MODELED CLIMATE SCENARIO/i.test(result.scienceCardText)
            && /not observed exoplanet surface maps/i.test(result.scienceCardText)
            && result.scienceCardText.toLowerCase().includes(testCase.type.toLowerCase()),
            `${testCase.type} Science Deck exposes climate provenance without presenting the scenario as observed data`, result);
        assert(result.atmospherePresent === result.expectedAtmosphere && result.cloudPresent === result.expectedCloud,
            `${testCase.type} atmosphere/cloud lifecycle follows its modeled retention and condensate profile`, result);
        if (['desert', 'lava'].includes(testCase.type) && result.atmospherePresent) {
            assert(Number(result.hazeStrength) > 0.15,
                `${testCase.type} retained atmosphere receives climate-conditioned aerosol/haze scattering`, result);
        }
        if (testCase.type === 'lava') {
            assert(result.insolationEarth >= 40 && result.estimatedSurfaceTemperatureK >= 650 && result.climateRegime === 'magma-dominated',
                'procedural lava class receives inner-system forcing consistent with a molten/hyperthermal scenario', result);
        }
        if (testCase.type === 'ice') {
            assert(result.insolationEarth < 0.40 && result.estimatedSurfaceTemperatureK < 260 && /ice/i.test(result.climateRegime),
                'procedural ice class receives outer-system forcing consistent with a frozen scenario', result);
        }
        if (testCase.type === 'desert') {
            assert(result.insolationEarth >= 0.70 && /arid/i.test(result.climateRegime),
                'procedural desert class retains an arid physically coherent climate regime', result);
        }
        if (testCase.displaced) {
            assert(result.minR > 49 && result.maxR < 52 && result.maxR - result.minR > 0.25,
                `${testCase.type} rocky world receives bounded physical terrain displacement`, result);
        } else {
            assert(result.minR > 49.99 && result.maxR < 50.01,
                `${testCase.type} atmosphere world remains spherical instead of receiving rocky relief`, result);
            assert(result.logicalTileMinR > 49.99 && result.logicalTileMaxR < 50.01,
                'gas-giant logical placement grid stays synchronized to the rendered pressure-level sphere', result);
            assert(result.placement?.ordinarySurface?.valid === false && /no solid surface/i.test(result.placement?.ordinarySurface?.reason || ''),
                'ordinary ground structures cannot anchor to a gas giant', result.placement || {});
            assert(!/requires a gas-giant atmosphere/i.test(result.placement?.atmosphericSiphon?.reason || ''),
                'Atmospheric Siphon passes the gas-world location gate before normal research/cost rules', result.placement || {});
        }
    }

    const worldTypePersistence = await page.evaluate(() => {
        const g = window.game;
        const previousId = g.currentSystemId;
        g.currentSystemId = '__climate_worldtype_regression__';
        g.structures = [];
        g.createPlanet(44001, 'ice');
        g.saveCurrentSystemState();
        const savedType = g.systemStates[g.currentSystemId]?.worldType;
        g.createPlanet(44002, 'lava');
        g.loadSystemState('__climate_worldtype_regression__');
        const restoredType = g.currentWorldType;
        const restoredVersion = g.planetMesh?.userData?.terrain?.version;
        delete g.systemStates.__climate_worldtype_regression__;
        g.currentSystemId = previousId;
        return { savedType, restoredType, restoredVersion };
    });
    await page.waitForTimeout(400);
    assert(worldTypePersistence.savedType === 'ice' && worldTypePersistence.restoredType === 'ice',
        'system save/load preserves an ice-world class instead of coercing it back to generic planet', worldTypePersistence);
    assert(worldTypePersistence.restoredVersion === 'catalog-informed-v4-geology',
        'restored non-Earthlike world remains on the climate-aware terrain renderer', worldTypePersistence);

    const lockedCloudState = await page.evaluate(() => {
        const g = window.game;
        g.createPlanet(33004, 'planet');
        const profile = g.planetMesh.userData.terrain.physicalProfile;
        profile.tidallyLocked = true;
        profile.insolationEarth = 1.15;
        profile.cloudPotential = 0.68;
        g.createClouds();
        return {
            tidallyLocked: g.cloudMesh.material.uniforms.tidallyLocked?.value,
            lockedCloudBoost: g.cloudMesh.material.uniforms.lockedCloudBoost?.value,
            cloudiness: g.cloudMesh.material.uniforms.cloudiness?.value,
            shaderHasSubstellarProxy: String(g.cloudMesh.material.fragmentShader || '').includes('substellar')
                && String(g.cloudMesh.material.fragmentShader || '').includes('cloudStreet')
        };
    });
    await page.waitForTimeout(450);
    assert(lockedCloudState.tidallyLocked === 1 && lockedCloudState.lockedCloudBoost > 0,
        'tidally locked rocky-world clouds receive a substellar convection concentration term', lockedCloudState);
    assert(lockedCloudState.shaderHasSubstellarProxy,
        'cloud shader includes substellar convection and organized cloud-street structure', lockedCloudState);

    await page.evaluate(() => {
        const g = window.game;
        const saved = JSON.parse(localStorage.getItem('exoplanetPioneerSave') || 'null');
        const seed = saved?.currentWorldSeed || saved?.worldSeed || 12345;
        g.createPlanet(seed, 'planet');
    });
    await page.waitForTimeout(400);
    log('climate', { profiles: climateProfiles, worlds: climateWorlds, lockedCloudState });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: ciTimeout(60000) });
    await waitForGame();
    await page.waitForTimeout(800);
    await validateScene('post-stress-restore');

    await setPhase('final');
    finalState = await state('final');
    const negativeResources = Object.entries(finalState.resources || {}).filter(([, value]) => Number(value) < -0.000001);
    assert(negativeResources.length === 0, 'resource stockpiles never cross below zero under accelerated workload', negativeResources);
    await page.setViewportSize({ width: 1440, height: 900 });
    await screenshot('final');

    assert(consoleErrors.length === 0, 'no application console errors across full workload', consoleErrors);
    assert(pageErrors.length === 0, 'no page errors across full workload', pageErrors);
    assert(firstPartyFailures.length === 0, 'no failed first-party responses across full workload', firstPartyFailures);
    assert(appWarnings.length === 0, 'no application warnings across full workload', appWarnings);
} catch (error) {
    failed = true;
    fatalMessage = error?.stack || String(error);
    log('fatal', { message: String(error), stack: error?.stack || '', phase });
    if (page) {
        try { await page.screenshot({ path: path.join(screenshotsDir, 'FAILURE.png'), fullPage: false }); } catch { }
        try { finalState = await state('failure'); } catch { }
    }
} finally {
    if (context) {
        try { await context.tracing.stop({ path: tracePath }); } catch (error) { log('trace-error', { message: String(error) }); }
    }
    if (headed && page && !page.isClosed()) await sleep(1800);
    if (browser) await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));

    const summary = {
        runId, pid: process.pid, startedHeaded: headed, completedAt: nowIso(),
        pass: !failed && issues.length === 0 && consoleErrors.length === 0 && appWarnings.length === 0 && pageErrors.length === 0 && firstPartyFailures.length === 0,
        fatalMessage, phase, baseUrl,
        files: { jsonl: path.relative(repoRoot, jsonlPath), trace: path.relative(repoRoot, tracePath), screenshots: path.relative(repoRoot, screenshotsDir) },
        metrics: { freshWorld: perfStart, colony: perfColony }, responsive, sceneValidation, finalState,
        counts: {
            assertions: assertions.length, assertionFailures: assertions.filter((x) => !x.pass).length,
            issues: issues.length, consoleErrors: consoleErrors.length, appWarnings: appWarnings.length,
            browserDiagnostics: browserDiagnostics.length, pageErrors: pageErrors.length,
            requestFailures: requestFailures.length, firstPartyFailures: firstPartyFailures.length,
            screenshots: milestones.length
        },
        issues, consoleErrors, appWarnings, browserDiagnostics, pageErrors, requestFailures, firstPartyFailures, assertions, milestones
    };
    await fsp.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    log('summary', { pass: summary.pass, counts: summary.counts, summaryPath: path.relative(repoRoot, summaryPath) });
    await writeStatus(summary.pass ? 'passed' : 'failed', { phase, pid: process.pid, summary: path.relative(repoRoot, summaryPath), counts: summary.counts });
    eventStream.end();
    if (!summary.pass) process.exitCode = 1;
}
