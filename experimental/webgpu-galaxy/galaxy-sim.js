/**
 * WebGPU Galaxy Particle Simulation
 * 
 * Uses compute shaders for a softened galactic potential and pointer attraction
 * for up to 500,000 particles in real-time, with bounded spectral telemetry.
 */

// --- Configuration ---
const CONFIG = {
    initialParticleCount: 50000,
    maxParticleCount: 500000,
    workgroupSize: 64,
};

// --- WGSL Shaders ---

const COMPUTE_SHADER_CODE = `
struct Params {
    deltaTime: f32,
    gravity: f32,
    damping: f32,
    mousePos: vec2<f32>,
    mouseActive: u32,
    time: f32,
};

struct Particle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    mass: f32,
    color: f32, // packed color
};

struct Particles {
    particles: array<Particle>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> inputParticles : Particles;
@group(0) @binding(2) var<storage, read_write> outputParticles : Particles;

// Simple pseudo-random for initial burst
fn rand(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(${CONFIG.workgroupSize})
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let index = GlobalInvocationID.x;
    if (index >= arrayLength(&inputParticles.particles)) {
        return;
    }

    var p = inputParticles.particles[index];

    // --- Physics Calculation ---
    
    // 1. Center attraction (Galaxy Core)
    let center = vec2<f32>(0.0, 0.0);
    let toCenter = center - p.pos;
    let distToCenter = max(length(toCenter), 0.001);
    let dirToCenter = toCenter / distToCenter;
    
    // Softened galactic potential. Orbital velocity supplies rotation; adding
    // continuous tangential acceleration ejects the disk out of the camera.
    let softened = distToCenter * distToCenter + 0.16;
    var force = toCenter * (3.0 / (softened * sqrt(softened))) * params.gravity;

    // 2. Mouse Interaction (Black Hole effect)
    if (params.mouseActive > 0u) {
        let toMouse = params.mousePos - p.pos;
        let distMouse = length(toMouse);
        if (distMouse < 2.0 && distMouse > 0.000001) {
            let mouseSoftened = distMouse * distMouse + 0.16;
            force = force + toMouse * (8.0 / (mouseSoftened * sqrt(mouseSoftened)));
        }
    }

    // 3. Integration (Euler)
    p.vel = p.vel + force * params.deltaTime;
    p.vel = p.vel * params.damping; // Friction
    p.pos = p.pos + p.vel * params.deltaTime;

    // 4. Color Update based on velocity
    let speed = length(p.vel);
    // Map speed to color (simple heat map logic)
    // In shader we store color as float, fragment shader unpacks it? 
    // Simplified: Just update position/velocity here.

    outputParticles.particles[index] = p;
}
`;

const DRAW_SHADER_CODE = `
struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) color : vec4<f32>,
    @location(1) uv : vec2<f32>,
};

struct Particle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    mass: f32,
    color: f32,
};

struct Particles {
    particles: array<Particle>,
};

struct Params {
    deltaTime: f32,
    gravity: f32,
    damping: f32,
    mousePos: vec2<f32>,
    mouseActive: u32,
    time: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> particles : Particles;

@vertex
fn vs_main(
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex : u32
) -> VertexOutput {
    let p = particles.particles[instanceIndex];

    // Billboard quad vertices
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );
    
    let quadPos = pos[vertexIndex];
    let particleSize = 0.003 * max(0.5, p.mass); // Scale by mass

    // Aspect ratio correction
    let aspect = params.screenSize.x / params.screenSize.y;
    let finalPos = vec2<f32>(
        p.pos.x / 5.5 + quadPos.x * particleSize / aspect,
        p.pos.y / 5.5 + quadPos.y * particleSize
    );
    
    // Fix Aspect Ratio: we want -1..1 logic.
    // Let's assume simulation is in -1..1 space essentially, but camera can zoom.
    // For now, simpler mapping:
    var glPos = vec4<f32>(finalPos, 0.0, 1.0);
    // Correct aspect on global position
    if (params.screenSize.x > params.screenSize.y) {
        glPos = vec4<f32>(finalPos.x / (params.screenSize.x / params.screenSize.y), finalPos.y, 0.0, 1.0);
    } else {
         glPos = vec4<f32>(finalPos.x, finalPos.y * (params.screenSize.x / params.screenSize.y), 0.0, 1.0);
    }

    var output : VertexOutput;
    output.Position = glPos;
    output.uv = quadPos; // -1 to 1

    // Color based on velocity/distance
    let speed = length(p.vel);
    let dist = length(p.pos) / 5.5;
    
    // Core color (warm/white) -> Edge color (blue/purple)
    var col = vec3<f32>(1.0, 0.8, 0.6); // Default core star
    if (dist > 0.3) { col = vec3<f32>(0.6, 0.8, 1.0); } // Blue giants
    if (dist > 0.6) { col = vec3<f32>(0.8, 0.4, 0.8); } // Outer rim dust
    
    output.color = vec4<f32>(col, 1.0);
    return output;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>, @location(1) uv : vec2<f32>) -> @location(0) vec4<f32> {
    // Circle SDF
    let dist = length(uv);
    let alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    if (dist > 1.0) { discard; }
    
    // Glowy center
    let glow = exp(-dist * 3.0);
    return vec4<f32>(color.rgb * 1.5, alpha * glow);
}
`;

// --- Main Class ---

class GalaxySim {
    constructor() {
        this.canvas = document.getElementById('galaxy-canvas');
        this.adapter = null;
        this.device = null;
        this.context = null;

        // Simulation State
        this.particleCount = CONFIG.initialParticleCount;
        this.isPlaying = true;
        this.params = {
            gravity: 1.0,
            damping: 1.0,
            mouseActive: 0,
            mousePos: [0, 0],
            time: 0,
            timeScale: 1.0,
            screenSize: [window.innerWidth, window.innerHeight]
        };

        // WebGPU Objects
        this.particleBuffers = []; // [bufferA, bufferB] (Pong-Ping)
        this.uniformBuffer = null;
        this.computePipeline = null;
        this.renderPipeline = null;
        this.bindGroups = []; // [computeGroupA, computeGroupB]
        this.renderBindGroup = null; // Only needs uniforms?

        this.step = 0; // 0 or 1 for ping-pong variables
        this.frameTimes = [];
        this.lastFrameAt = performance.now();
        this.lastTelemetryAt = 0;
        this.animationFrame = null;

        this.init();
    }

    async init() {
        try {
            if (!navigator.gpu) throw new Error('WebGPU is not exposed by this browser');
            this.adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
                || await navigator.gpu.requestAdapter();
            if (!this.adapter) throw new Error('No GPU adapter found');

            // Check for limits (optional, but good for heavy sims)
            // const limits = this.adapter.limits;

            this.device = await this.adapter.requestDevice();
            this.device.lost.then(info => {
                if (!this.softwareWorker) this.startSoftware(`GPU device lost: ${info.message || info.reason}`);
            });

            this.context = this.canvas.getContext('webgpu');
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: format,
                alphaMode: 'premultiplied',
            });
            this.resizeCanvas();

            this.device.pushErrorScope('validation');
            this.initParticles();
            this.initPipelines(format);
            const validationError = await this.device.popErrorScope();
            if (validationError) throw new Error(validationError.message);
            if (this.softwareWorker) return;
            this.setupUI();
            this.canvas.dataset.renderer = 'webgpu';

            document.getElementById('gpu-status').textContent = 'ONLINE';
            document.getElementById('gpu-status').style.color = '#00ff00';
            document.getElementById('gpu-status').style.background = 'rgba(0, 255, 0, 0.2)';

            this.animate();

        } catch (e) {
            this.startSoftware(e?.message || String(e));
        }
    }

    startSoftware(reason) {
        if (this.softwareWorker) return;
        cancelAnimationFrame(this.animationFrame);
        // A canvas already configured for WebGPU cannot acquire a 2D context.
        const replacement = this.canvas.cloneNode(false);
        this.canvas.replaceWith(replacement);
        this.canvas = replacement;
        try {
            const workerUrl = new URL('galaxy-software-worker.js', import.meta.url);
            workerUrl.search = new URL(import.meta.url).search;
            this.softwareWorker = new Worker(workerUrl);
            const offscreen = this.canvas.transferControlToOffscreen();
            this.softwareWorker.postMessage({ type: 'init', canvas: offscreen,
                count: this.particleCount, params: this.params, playing: this.isPlaying }, [offscreen]);
            this.particleBuffers.forEach(buffer => buffer?.destroy());
            this.particleBuffers = [];
            this.uniformBuffer?.destroy();
            this.device?.destroy();
            this.canvas.dataset.renderer = 'cpu-worker';
            this.resizeCanvas();
            this.setupUI();
            const status = document.getElementById('gpu-status');
            status.textContent = 'CPU ONLINE';
            status.title = `${reason}. Same particle count and simulation, rendered in a dedicated CPU worker.`;
            status.style.color = '#67e8f9';
            status.style.background = 'rgba(103,232,249,.12)';
            document.getElementById('error-overlay').style.display = 'none';
            document.getElementById('renderer-label').textContent = 'CPU worker particles';
            document.getElementById('renderer-work-label').textContent = 'CPU work';
            this.canvas.setAttribute('aria-label', 'Interactive galaxy particle simulation using the CPU renderer');
            this.softwareWorker.onmessage = ({ data }) => {
                if (data.type !== 'telemetry') return;
                this.params.time = data.time;
                this.frameTimes = data.frameTimes;
                document.getElementById('particle-count').textContent = data.count.toLocaleString();
                document.getElementById('fps-counter').textContent = Math.round(data.fps).toString();
                document.getElementById('compute-time').textContent = `${data.workMs.toFixed(2)}ms CPU`;
                document.getElementById('sim-speed').textContent = `${this.params.timeScale.toFixed(1)}x`;
                this.canvas.dataset.frames = String(data.frames);
                this.renderSpectrum();
            };
            this.softwareWorker.onerror = () => this.showRendererError('The CPU renderer could not start. Please reload this page.');
        } catch (error) {
            this.showRendererError(`Neither GPU nor offscreen CPU rendering is available: ${error.message}`);
        }
    }

    showRendererError(message) {
        this.softwareWorker?.terminate();
        this.softwareWorker = null;
        document.getElementById('error-overlay').style.display = 'block';
        document.getElementById('error-overlay').querySelector('p').textContent = message;
        document.getElementById('gpu-status').textContent = 'UNAVAILABLE';
        for (const id of ['pause-simulation', 'star-count-slider', 'gravity-slider', 'time-slider']) {
            document.getElementById(id).disabled = true;
        }
    }

    initParticles() {
        this.particleBuffers.forEach(buffer => buffer?.destroy());
        this.uniformBuffer?.destroy();
        // Particle Struct: vec2 pos, vec2 vel, f32 mass, f32 color => 6 floats = 24 bytes
        // Align to 32 bytes for safety? No, storage buffer stride just needs to match WGSL.
        // WGSL struct alignment rules... vec2 is 8 bytes.
        // pos(8), vel(8), mass(4), color(4) = 24 bytes.
        // Padded to 32 bytes usually? Let's check.
        // vec2<f32> alignment is 8.
        // offset 0: pos
        // offset 8: vel
        // offset 16: mass
        // offset 20: color
        // size: 24.

        const particleSize = 6 * 4; // 6 floats
        const totalSize = this.particleCount * particleSize;

        const data = new Float32Array(this.particleCount * 6);

        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 6;

            // Initial position: Spiral Galaxy Distribution
            // Random radial distance; arm assignment is deterministic by particle index.
            const dist = Math.random(); // 0 to 1

            // Actually, simpler spiral:
            // angle = dist * factor
            const spiralAngle = dist * 10.0 + (i % 3) * (Math.PI * 2 / 3) + (Math.random() - .5) * .28;

            const r = dist * 5.0; // Spread particles across larger radius
            data[idx] = Math.cos(spiralAngle) * r; // x
            data[idx + 1] = Math.sin(spiralAngle) * r;

            // Velocity: Tangential for orbit
            // v = sqrt(GM/r) roughly
            const speed = Math.sqrt(3 * r * r / Math.pow(r * r + .16, 1.5));
            data[idx + 2] = -Math.sin(spiralAngle) * speed; // vx
            data[idx + 3] = Math.cos(spiralAngle) * speed; // vy

            data[idx + 4] = Math.random() * 0.5 + 0.5; // mass
            data[idx + 5] = Math.random(); // color seed
        }

        // Create TWO buffers for Ping-Pong simulation
        this.particleBuffers = [
            this.device.createBuffer({
                size: totalSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            }),
            this.device.createBuffer({
                size: totalSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
        ];

        new Float32Array(this.particleBuffers[0].getMappedRange()).set(data);
        this.particleBuffers[0].unmap();

        // Uniform Buffer
        // Params struct: 
        // deltaTime(4), gravity(4), damping(4), mousePos(8), mouseActive(4), time(4), screenSize(8)
        // Layout:
        // 0: deltaTime (f32)
        // 4: gravity (f32)
        // 8: damping (f32)
        // 12: padding? vec2 alignment is 8. So next is 16.
        // 16: mousePos (vec2)
        // 24: mouseActive (u32)
        // 28: time (f32)
        // 32: screenSize (vec2)
        // Total: 40 bytes. Padded to 48?

        const uniformSize = 48; // Safe bet
        this.uniformBuffer = this.device.createBuffer({
            size: uniformSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Initial Uniform Upload
        this.updateUniforms(0.016);
    }

    updateUniforms(dt) {
        const uniformData = new ArrayBuffer(48);
        const view = new DataView(uniformData);

        // deltaTime
        view.setFloat32(0, dt, true);
        // gravity
        view.setFloat32(4, this.params.gravity, true);
        // damping
        view.setFloat32(8, this.params.damping, true);

        // mousePos (alignment 8 -> offset 16?)
        // Let's verify strict WGSL layout rules.
        // float, float, float -> 12 bytes.
        // vec2 requires 8-byte alignment. So next available is 16. Correct.
        const pointerScale = Math.min(this.canvas.clientWidth, this.canvas.clientHeight) / 2;
        view.setFloat32(16, (this.params.mousePos[0] - this.canvas.clientWidth / 2) / Math.max(1, pointerScale) * 5.5, true);
        view.setFloat32(20, (this.canvas.clientHeight / 2 - this.params.mousePos[1]) / Math.max(1, pointerScale) * 5.5, true);

        // mouseActive (offset 24)
        view.setUint32(24, this.params.mouseActive, true);
        // time (offset 28)
        view.setFloat32(28, this.params.time, true);
        // screenSize (offset 32)
        view.setFloat32(32, this.canvas.width, true);
        view.setFloat32(36, this.canvas.height, true);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    initPipelines(format) {
        // --- Compute Pipeline ---
        const computeModule = this.device.createShaderModule({ code: COMPUTE_SHADER_CODE });

        this.computeBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }
            ]
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.computeBindGroupLayout] }),
            compute: { module: computeModule, entryPoint: 'main' }
        });

        // Initialize Bind Groups (One for A->B, One for B->A)
        this.bindGroups = [
            this.device.createBindGroup({
                layout: this.computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                layout: this.computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[0] } }
                ]
            })
        ];

        // --- Render Pipeline ---
        const drawModule = this.device.createShaderModule({ code: DRAW_SHADER_CODE });

        const renderBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }
            ]
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
            vertex: { module: drawModule, entryPoint: 'vs_main' },
            fragment: {
                module: drawModule, entryPoint: 'fs_main', targets: [{
                    format, blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, // Additive blending
                        alpha: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }
                    }
                }]
            },
            primitive: { topology: 'triangle-list' }
        });

        // Create Bind Groups for Rendering (Needs to know WHICH buffer is current source)
        // We actually need TWO render bind groups too, depending on which buffer holds the latest positions
        this.renderBindGroups = [
            this.device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } }
                ]
            }),
            this.device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } }
                ]
            })
        ];
    }

    setupUI() {
        // The worker takeover may follow device loss; remove old canvas and UI listeners.
        this.uiAbort?.abort();
        this.uiAbort = new AbortController();
        const listen = (target, name, handler) => target?.addEventListener(name, handler, { signal: this.uiAbort.signal });
        // Sliders
        const gravitySlider = document.getElementById('gravity-slider');
        const gravityLabel = document.getElementById('gravity-label');

        if (gravitySlider && gravityLabel) {
            listen(gravitySlider, 'input', (e) => {
                this.params.gravity = parseFloat(e.target.value);
                gravityLabel.textContent = this.params.gravity.toFixed(1);
                this.softwareWorker?.postMessage({ type: 'params', params: this.params });
            });
        }

        // Star Count (Requires Reset)
        const starCountSlider = document.getElementById('star-count-slider');
        const starCountLabel = document.getElementById('star-count-label');
        listen(starCountSlider, 'change', (e) => {
            const val = Math.min(CONFIG.maxParticleCount, parseInt(e.target.value, 10));
            starCountLabel.textContent = val.toLocaleString();
            this.particleCount = val;
            if (this.softwareWorker) {
                this.softwareWorker.postMessage({ type: 'count', count: val });
                return;
            }
            this.initParticles(); // Re-init
            // Re-create bind groups because particleBuffers changed
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.initPipelines(format);
        });
        listen(starCountSlider, 'input', (e) => {
            starCountLabel.textContent = parseInt(e.target.value, 10).toLocaleString();
        });

        // Time Dilation
        const timeSlider = document.getElementById('time-slider');
        const timeLabel = document.getElementById('time-label');
        listen(timeSlider, 'input', (e) => {
            // We pass deltaTime to shader via uniforms. 
            // We can just scale dt in animate() or send a timeScale uniform.
            // Shader has 'deltaTime', let's scale what we send to updateUniforms.
            // But updateUniforms takes 'dt' as arg.
            // So we'll store timeScale in params.
            this.params.timeScale = parseFloat(e.target.value);
            timeLabel.textContent = this.params.timeScale.toFixed(1);
            this.softwareWorker?.postMessage({ type: 'params', params: this.params });
        });

        const pauseButton = document.getElementById('pause-simulation');
        listen(pauseButton, 'click', () => {
            this.isPlaying = !this.isPlaying;
            pauseButton.setAttribute('aria-pressed', String(!this.isPlaying));
            pauseButton.textContent = this.isPlaying ? 'Pause simulation' : 'Resume simulation';
            this.lastFrameAt = performance.now();
            this.softwareWorker?.postMessage({ type: 'playing', playing: this.isPlaying });
        });

        // Pointer interaction is scoped to the simulation canvas.
        listen(this.canvas, 'pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.params.mousePos = [e.clientX - rect.left, e.clientY - rect.top];
            this.syncSoftwarePointer();
        });
        listen(this.canvas, 'pointerdown', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.params.mousePos = [e.clientX - rect.left, e.clientY - rect.top];
            this.params.mouseActive = 1;
            this.canvas.setPointerCapture(e.pointerId);
            this.syncSoftwarePointer();
        });
        listen(window, 'pointerup', () => { this.params.mouseActive = 0; this.syncSoftwarePointer(); });
        listen(window, 'pointercancel', () => { this.params.mouseActive = 0; this.syncSoftwarePointer(); });

        // Resize
        listen(window, 'resize', () => {
            this.resizeCanvas();
        });
        listen(document, 'visibilitychange', () => {
            this.lastFrameAt = performance.now();
            this.softwareWorker?.postMessage({ type: 'visibility', hidden: document.hidden });
        });
        listen(window, 'pagehide', () => this.softwareWorker?.postMessage({ type: 'visibility', hidden: true }));
        listen(window, 'pageshow', () => this.softwareWorker?.postMessage({ type: 'visibility', hidden: document.hidden }));
    }

    syncSoftwarePointer() {
        const scale = Math.min(this.canvas.clientWidth, this.canvas.clientHeight) / 2;
        this.softwareWorker?.postMessage({ type: 'pointer', active: this.params.mouseActive,
            x: (this.params.mousePos[0] - this.canvas.clientWidth / 2) / Math.max(1, scale) * 5.5,
            y: (this.canvas.clientHeight / 2 - this.params.mousePos[1]) / Math.max(1, scale) * 5.5 });
    }

    resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
        const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
        if (this.softwareWorker) {
            this.softwareWorker.postMessage({ type: 'resize', width, height });
            this.params.screenSize = [width, height];
            return;
        }
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.params.screenSize = [width, height];
    }

    renderSpectrum() {
        const canvas = document.getElementById('spectrum-canvas');
        if (!canvas || this.frameTimes.length < 16) return;
        const context = canvas.getContext('2d');
        const samples = this.frameTimes.slice(-64);
        const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        const bins = Math.min(24, Math.floor(samples.length / 2));
        const spectrum = [];
        for (let frequency = 1; frequency <= bins; frequency++) {
            let real = 0, imaginary = 0;
            for (let index = 0; index < samples.length; index++) {
                const angle = 2 * Math.PI * frequency * index / samples.length;
                const centered = samples[index] - mean;
                real += centered * Math.cos(angle);
                imaginary -= centered * Math.sin(angle);
            }
            spectrum.push(Math.hypot(real, imaginary) / samples.length);
        }
        const peak = Math.max(...spectrum, 0.001);
        context.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#67e8f9');
        gradient.addColorStop(1, '#8b5cf6');
        context.fillStyle = gradient;
        const gap = 2;
        const width = canvas.width / bins;
        spectrum.forEach((value, index) => {
            const height = Math.max(2, value / peak * (canvas.height - 6));
            context.fillRect(index * width, canvas.height - height, Math.max(1, width - gap), height);
        });
    }

    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());
        if (!this.isPlaying || document.hidden || !this.device) return;

        const now = performance.now();
        const rawFrameTime = Math.min(50, Math.max(1, now - this.lastFrameAt));
        this.lastFrameAt = now;
        this.frameTimes.push(rawFrameTime);
        if (this.frameTimes.length > 64) this.frameTimes.shift();
        const dt = Math.min(0.033, rawFrameTime / 1000) * (this.params.timeScale || 1.0);
        this.params.time += dt;

        // Update Uniforms
        this.updateUniforms(dt);

        const commandEncoder = this.device.createCommandEncoder();

        // 1. Compute Pass
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.bindGroups[this.step]);
        computePass.dispatchWorkgroups(Math.ceil(this.particleCount / CONFIG.workgroupSize));
        computePass.end();

        // 2. Render Pass
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.renderPipeline);
        // Render the buffer we just computed INTO (destination of compute pass is valid for reading in next frame usually, but here...
        // Wait, Compute writes to outputParticles. That is bindGroup[step] binding 2.
        // Binding 2 in bindGroup[0] is particleBuffers[1].
        // So step 0 writes to Buffer 1.
        // We want to render Buffer 1.
        // renderBindGroups[0] binds Buffer 0. renderBindGroups[1] binds Buffer 1.
        // So we use renderBindGroups[1] if step was 0?
        // Let's trace:
        // Step 0: Input Buf0 -> Output Buf1.
        // We should draw Buf1? Or Buf0 (old frame)?
        // Drawing Buf1 (new frame) is better latency.
        // So if step 0, we draw Buf1 (which is renderBindGroups[1]).

        renderPass.setBindGroup(0, this.renderBindGroups[(this.step + 1) % 2]); // Use the OUTPUT buffer of current step
        renderPass.draw(6, this.particleCount, 0, 0); // 6 vertices per instance (quad), N instances
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        // Swap ping-pong step
        this.step = (this.step + 1) % 2;

        // UI Stats
        if (now - this.lastTelemetryAt > 250) {
            const average = this.frameTimes.reduce((sum, value) => sum + value, 0) / Math.max(1, this.frameTimes.length);
            document.getElementById('particle-count').textContent = this.particleCount.toLocaleString();
            document.getElementById('fps-counter').textContent = Math.round(1000 / average).toString();
            document.getElementById('compute-time').textContent = `${(performance.now() - now).toFixed(2)}ms encode`;
            document.getElementById('sim-speed').textContent = `${this.params.timeScale.toFixed(1)}x`;
            this.renderSpectrum();
            this.lastTelemetryAt = now;
        }
    }
}

// Start
window.galaxySim = new GalaxySim();
