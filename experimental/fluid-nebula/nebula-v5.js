import { vertex, shaders } from './nebula-shaders.js';
import { isSoftwareWebGL } from '../../renderer-capabilities.js';
const QUALITY = {
    balanced: { size: 384, iterations: 18, steps: 24 },
    high: { size: 512, iterations: 28, steps: 32 },
    ultra: { size: 768, iterations: 44, steps: 48 },
};
class FluidNebulaV5 {
    constructor() {
        this.canvas = document.getElementById('nebula');
        this.status = document.getElementById('nebula-status');
        this.params = {
            turbulence: 1.4,
            density: 1.4,
            exposure: 1.6,
            timeScale: 1,
            palette: 1,
            quality: 'high',
            seed: 618,
        };
        this.playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.frameId = 0;
        this.time = 0;
        this.previous = 0;
        this.frames = 0;
        this.lastStats = 0;
        this.splats = [];
        this.bindControls();
        this.syncPauseControl();
        try {
            this.initialize();
        } catch (error) {
            this.fallback(error);
        }
    }
    shader(type, source) {
        const g = this.gl,
            s = g.createShader(type);
        g.shaderSource(s, source);
        g.compileShader(s);
        if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
            const message = g.getShaderInfoLog(s);
            g.deleteShader(s);
            throw new Error(message);
        }
        return s;
    }
    program(source) {
        const g = this.gl,
            p = g.createProgram(),
            v = this.shader(g.VERTEX_SHADER, vertex),
            f = this.shader(g.FRAGMENT_SHADER, source);
        g.attachShader(p, v);
        g.attachShader(p, f);
        g.linkProgram(p);
        g.deleteShader(v);
        g.deleteShader(f);
        if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p));
        const locations = new Map();
        return {
            p,
            location: (name) => {
                if (!locations.has(name)) locations.set(name, g.getUniformLocation(p, name));
                return locations.get(name);
            },
        };
    }
    texture(width, height) {
        const g = this.gl,
            texture = g.createTexture();
        g.bindTexture(g.TEXTURE_2D, texture);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA32F, width, height, 0, g.RGBA, g.FLOAT, null);
        const framebuffer = g.createFramebuffer();
        g.bindFramebuffer(g.FRAMEBUFFER, framebuffer);
        g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
        if (g.checkFramebufferStatus(g.FRAMEBUFFER) !== g.FRAMEBUFFER_COMPLETE)
            throw new Error('Floating-point fluid framebuffer unavailable');
        g.clearColor(0, 0, 0, 0);
        g.clear(g.COLOR_BUFFER_BIT);
        return { texture, framebuffer, width, height };
    }
    pair(w, h) {
        const a = this.texture(w, h),
            b = this.texture(w, h);
        return {
            read: a,
            write: b,
            swap() {
                [this.read, this.write] = [this.write, this.read];
            },
        };
    }
    initialize() {
        this.gl = this.canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
        });
        const g = this.gl;
        if (g && isSoftwareWebGL(g)) throw new Error('WebGL2 is software-rendered in this browser');
        if (
            !g ||
            !g.getExtension('EXT_color_buffer_float') ||
            !g.getExtension('OES_texture_float_linear')
        )
            throw new Error('WebGL2 linear 32-bit floating-point rendering unavailable');
        this.programs = Object.fromEntries(
            Object.entries(shaders).map(([name, source]) => [name, this.program(source)])
        );
        this.noise = g.createTexture();
        g.bindTexture(g.TEXTURE_3D, this.noise);
        const data = new Uint8Array(64 * 64 * 64);
        let seed = 87321;
        for (let i = 0; i < data.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            data[i] = seed >>> 24;
        }
        g.texImage3D(g.TEXTURE_3D, 0, g.R8, 64, 64, 64, 0, g.RED, g.UNSIGNED_BYTE, data);
        g.generateMipmap(g.TEXTURE_3D);
        for (const axis of [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T, g.TEXTURE_WRAP_R])
            g.texParameteri(g.TEXTURE_3D, axis, g.REPEAT);
        g.texParameteri(g.TEXTURE_3D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
        g.texParameteri(g.TEXTURE_3D, g.TEXTURE_MAG_FILTER, g.LINEAR);
        this.mode = 'webgl2';
        this.canvas.dataset.renderer = 'webgl2-fluid-v5';
        this.resize();
        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            if (this.mode === 'cpu') return;
            cancelAnimationFrame(this.frameId);
            this.frameId = 0;
            this.fallback(new Error('GPU context lost'));
        });
        this.status.textContent =
            'V5 ready · pressure projection, vorticity confinement, corrected advection and volume-integrated dust.';
        this.request();
    }
    draw(name, target, textures = {}, values = {}) {
        const g = this.gl,
            p = this.programs[name];
        g.useProgram(p.p);
        g.bindFramebuffer(g.FRAMEBUFFER, target?.framebuffer || null);
        g.viewport(0, 0, target?.width || this.canvas.width, target?.height || this.canvas.height);
        g.uniform2f(p.location('uTexel'), 1 / this.width, 1 / this.height);
        let unit = 0;
        for (const [key, value] of Object.entries(textures)) {
            g.activeTexture(g.TEXTURE0 + unit);
            g.bindTexture(g.TEXTURE_2D, value.texture);
            g.uniform1i(p.location(key), unit++);
        }
        g.activeTexture(g.TEXTURE0 + 7);
        g.bindTexture(g.TEXTURE_3D, this.noise);
        g.uniform1i(p.location('uNoise'), 7);
        for (const [key, value] of Object.entries(values)) {
            const location = p.location(key);
            if (location === null) continue;
            if (Array.isArray(value)) g.uniform2fv(location, value);
            else g.uniform1f(location, value);
        }
        g.drawArrays(g.TRIANGLES, 0, 3);
    }
    createBuffers() {
        const old = this.buffers;
        this.velocity = this.pair(this.width, this.height);
        this.dye = this.pair(this.width, this.height);
        this.pressure = this.pair(this.width, this.height);
        this.curl = this.texture(this.width, this.height);
        this.divergence = this.texture(this.width, this.height);
        this.forward = this.texture(this.width, this.height);
        this.backward = this.texture(this.width, this.height);
        this.buffers = [
            this.velocity.read,
            this.velocity.write,
            this.dye.read,
            this.dye.write,
            this.pressure.read,
            this.pressure.write,
            this.curl,
            this.divergence,
            this.forward,
            this.backward,
        ];
        this.reset();
        if (old)
            for (const buffer of old) {
                this.gl.deleteTexture(buffer.texture);
                this.gl.deleteFramebuffer(buffer.framebuffer);
            }
    }
    resize() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        const width = Math.max(1, Math.round(innerWidth * dpr)),
            height = Math.max(1, Math.round(innerHeight * dpr));
        if (this.worker) {
            this.worker.postMessage({ type: 'resize', width, height });
            return;
        }
        this.canvas.width = width;
        this.canvas.height = height;
        const size = QUALITY[this.params.quality].size;
        this.width = size;
        this.height = Math.max(128, Math.round((size * innerHeight) / innerWidth));
        this.createBuffers();
        this.request();
    }
    reset() {
        this.time = 0;
        this.previous = 0;
        if (this.worker) {
            this.worker.postMessage({ type: 'reset', seed: this.params.seed });
            return;
        }
        for (const buffer of [this.pressure.read, this.pressure.write]) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer.framebuffer);
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
        this.draw(
            'initialize',
            this.velocity.read,
            {},
            { uSeed: this.params.seed, uVelocityMode: 1, uAspect: innerWidth / innerHeight }
        );
        this.draw(
            'initialize',
            this.dye.read,
            {},
            { uSeed: this.params.seed, uVelocityMode: 0, uAspect: innerWidth / innerHeight }
        );
        this.request();
    }
    step(dt) {
        this.draw(
            'advect',
            this.velocity.write,
            { uVelocity: this.velocity.read, uSource: this.velocity.read },
            { uDt: dt, uDecay: 0 }
        );
        this.velocity.swap();
        this.draw('curl', this.curl, { uVelocity: this.velocity.read });
        this.draw(
            'forces',
            this.velocity.write,
            { uVelocity: this.velocity.read, uCurl: this.curl, uDye: this.dye.read },
            { uDt: dt, uTurbulence: this.params.turbulence }
        );
        this.velocity.swap();
        for (const splat of this.splats.splice(0, 16)) {
            const values = {
                uPoint: [splat.x, splat.y],
                uImpulse: [splat.dx * 2, splat.dy * 2],
                uRadius: 0.0015,
                uAspect: innerWidth / innerHeight,
                uDyeMode: 0,
            };
            this.draw('splat', this.velocity.write, { uSource: this.velocity.read }, values);
            this.velocity.swap();
            this.draw(
                'splat',
                this.dye.write,
                { uSource: this.dye.read },
                { ...values, uDyeMode: 1 }
            );
            this.dye.swap();
        }
        this.draw('divergence', this.divergence, { uVelocity: this.velocity.read });
        for (let i = 0; i < QUALITY[this.params.quality].iterations; i++) {
            this.draw('pressure', this.pressure.write, {
                uPressure: this.pressure.read,
                uDivergence: this.divergence,
            });
            this.pressure.swap();
        }
        this.draw('project', this.velocity.write, {
            uVelocity: this.velocity.read,
            uPressure: this.pressure.read,
        });
        this.velocity.swap();
        this.draw(
            'advect',
            this.forward,
            { uVelocity: this.velocity.read, uSource: this.dye.read },
            { uDt: dt, uDecay: 0 }
        );
        this.draw(
            'advect',
            this.backward,
            { uVelocity: this.velocity.read, uSource: this.forward },
            { uDt: -dt, uDecay: 0 }
        );
        this.draw(
            'correct',
            this.dye.write,
            {
                uVelocity: this.velocity.read,
                uSource: this.forward,
                uOriginal: this.dye.read,
                uBackward: this.backward,
            },
            { uDt: dt, uDecay: 0.002 }
        );
        this.dye.swap();
    }
    render() {
        this.draw(
            'render',
            null,
            { uDye: this.dye.read },
            {
                uTime: this.time,
                uAspect: innerWidth / innerHeight,
                uDensity: this.params.density,
                uExposure: this.params.exposure,
                uSteps: QUALITY[this.params.quality].steps,
                uPalette: this.params.palette,
                uSeed: this.params.seed,
            }
        );
    }
    request() {
        if (this.worker || this.frameId || document.hidden) return;
        this.frameId = requestAnimationFrame((time) => this.frame(time));
    }
    frame(now) {
        this.frameId = 0;
        if (document.hidden || this.mode !== 'webgl2') return;
        const elapsed = this.previous ? now - this.previous : 16.7;
        this.previous = now;
        if (this.playing) {
            const dt = Math.min(0.033, elapsed / 1000) * this.params.timeScale;
            this.time += dt;
            this.step(dt);
        } else if (this.splats.length) this.step(0);
        this.render();
        this.frames++;
        if (now - this.lastStats > 500 || !this.playing) {
            this.canvas.dataset.frames = String(this.frames);
            this.canvas.dataset.simulationTime = this.time.toFixed(3);
            document.getElementById('nebula-telemetry').textContent =
                `WebGL2 · ${this.width} × ${this.height} fluid grid · ${QUALITY[this.params.quality].iterations} pressure passes · ${QUALITY[this.params.quality].steps} volume samples · ${elapsed.toFixed(1)} ms frame`;
            this.lastStats = now;
        }
        if (this.playing) this.request();
    }
    sync() {
        this.worker?.postMessage({ type: 'params', params: this.params, playing: this.playing });
        this.request();
    }
    bindControls() {
        for (const [id, key] of [
            ['turbulence', 'turbulence'],
            ['density', 'density'],
            ['exposure', 'exposure'],
            ['time-scale', 'timeScale'],
        ])
            document.getElementById(id).addEventListener('input', (e) => {
                this.params[key] = Number(e.target.value);
                document.getElementById(`${id}-value`).textContent = this.params[key].toFixed(1);
                this.sync();
            });
        document.getElementById('palette').addEventListener('change', (e) => {
            this.params.palette = Number(e.target.value);
            this.sync();
        });
        document.getElementById('quality').addEventListener('change', (e) => {
            this.params.quality = e.target.value;
            this.resize();
            this.sync();
            this.status.textContent =
                'Solver resolution changed; the same seeded field was restarted.';
        });
        document.getElementById('pause-nebula').addEventListener('click', (e) => {
            this.playing = !this.playing;
            this.previous = 0;
            e.target.setAttribute('aria-pressed', String(!this.playing));
            e.target.textContent = this.playing ? 'Pause simulation' : 'Resume simulation';
            this.sync();
        });
        document.getElementById('reset-nebula').addEventListener('click', () => this.reset());
        document.getElementById('new-nebula').addEventListener('click', () => {
            this.params.seed = Math.floor(Math.random() * 100000);
            this.reset();
        });
        this.bindPointer();
        addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => {
            this.previous = 0;
            this.worker?.postMessage({ type: 'visibility', hidden: document.hidden });
            if (document.hidden) {
                cancelAnimationFrame(this.frameId);
                this.frameId = 0;
            } else this.request();
        });
        matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.playing = !e.matches;
            this.syncPauseControl();
            this.sync();
        });
    }
    syncPauseControl() {
        const button = document.getElementById('pause-nebula');
        button.setAttribute('aria-pressed', String(!this.playing));
        button.textContent = this.playing ? 'Pause simulation' : 'Resume simulation';
    }
    bindPointer() {
        let dragging = false,
            last = null;
        const point = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) / rect.width,
                y: 1 - (e.clientY - rect.top) / rect.height,
            };
        };
        this.canvas.addEventListener('pointerdown', (e) => {
            dragging = true;
            last = point(e);
            this.canvas.setPointerCapture(e.pointerId);
        });
        this.canvas.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const p = point(e),
                splat = { ...p, dx: p.x - last.x, dy: p.y - last.y };
            last = p;
            if (this.worker) this.worker.postMessage({ type: 'splat', splat });
            else this.splats.push(splat);
            this.request();
        });
        this.canvas.addEventListener('pointerup', () => {
            dragging = false;
        });
        this.canvas.addEventListener('pointercancel', () => {
            dragging = false;
        });
    }
    fallback(error) {
        if (this.mode === 'cpu') return;
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
        const replacement = this.canvas.cloneNode(false);
        this.canvas.replaceWith(replacement);
        this.canvas = replacement;
        this.mode = 'cpu';
        this.canvas.dataset.renderer = 'cpu-fluid-v5';
        this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
        this.bindPointer();
        if (
            typeof Worker !== 'function' ||
            typeof this.canvas.transferControlToOffscreen !== 'function'
        ) {
            this.status.textContent =
                'This browser cannot run either renderer. Please use a browser with WebGL2 or OffscreenCanvas workers.';
            for (const control of document.querySelectorAll('button,input,select'))
                control.disabled = true;
            return;
        }
        this.worker = new Worker(new URL('./nebula-cpu-worker.js', import.meta.url));
        const canvas = this.canvas.transferControlToOffscreen();
        this.worker.postMessage(
            { type: 'init', canvas, params: this.params, playing: this.playing },
            [canvas]
        );
        this.resize();
        this.status.textContent = `CPU fluid compatibility mode · ${error.message}. Volumetric GPU reconstruction is unavailable.`;
        document.getElementById('nebula-telemetry').textContent = 'CPU worker · pressure-solved fluid compatibility mode';
        this.worker.onmessage = ({ data }) => {
            if (data.type === 'stats') {
                this.time = data.time;
                this.canvas.dataset.frames = String(data.frames);
                this.canvas.dataset.simulationTime = data.time.toFixed(3);
                document.getElementById('nebula-telemetry').textContent =
                    `CPU worker · ${data.width} × ${data.height} pressure-solved fluid grid`;
            }
        };
        this.worker.onerror = () => {
            this.worker.terminate();
            this.status.textContent =
                'The CPU fluid worker could not start. Reload the page or enable WebGL2.';
        };
    }
    diagnostics() {
        if (this.mode !== 'webgl2') return { mode: this.mode, time: this.time };
        const g = this.gl,
            previous = g.getParameter(g.FRAMEBUFFER_BINDING),
            result = {
                mode: this.mode,
                time: this.time,
                grid: [this.width, this.height],
                statePrecision: 32,
            };
        for (const [name, buffer, channel] of [
            ['density', this.dye.read, 3],
            ['velocity', this.velocity.read, 0],
        ]) {
            g.bindFramebuffer(g.FRAMEBUFFER, buffer.framebuffer);
            const values = new Float32Array(buffer.width * buffer.height * 4);
            g.readPixels(0, 0, buffer.width, buffer.height, g.RGBA, g.FLOAT, values);
            let max = 0,
                sum = 0,
                invalid = 0;
            for (let i = 0; i < values.length; i += 4) {
                const value =
                    name === 'velocity'
                        ? Math.hypot(values[i], values[i + 1])
                        : values[i + channel];
                if (!Number.isFinite(value)) invalid++;
                max = Math.max(max, value);
                sum += value;
            }
            result[name] = { max, mean: sum / (values.length / 4), invalid };
        }
        g.bindFramebuffer(g.FRAMEBUFFER, previous);
        return result;
    }
}
window.fluidNebulaV5 = new FluidNebulaV5();
