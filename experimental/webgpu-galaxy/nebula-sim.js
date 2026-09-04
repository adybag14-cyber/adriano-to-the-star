/**
 * Bounded WebGPU particle-advection study with a Canvas 2D fallback.
 */

const CONFIG = {
    particleCount: 262144,
    gridSize: [128, 128], // Fluid grid resolution
    workgroupSize: 64,
};

const COMPUTE_SHADER = `
struct Params {
    dt: f32,
    viscosity: f32,
    vorticity: f32,
    time: f32,
};

struct Particle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> inputParticles : array<Particle>;
@group(0) @binding(2) var<storage, read_write> outputParticles : array<Particle>;

// Simulating a simple fluid-like movement using curl noise and vortex forces
// True 3D Navier-Stokes grid solver would require multiple passes (Advect, Diffuse, Project).
// For 10M particles, we use a vectorized approach.

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let a = hash(i);
    let b = hash(i + vec2<f32>(1.0, 0.0));
    let c = hash(i + vec2<f32>(0.0, 1.0));
    let d = hash(i + vec2<f32>(1.0, 1.0));
    let u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

@compute @workgroup_size(${CONFIG.workgroupSize})
fn main(@builtin(global_invocation_id) id : vec3<u32>) {
    let idx = id.x;
    if (idx >= arrayLength(&inputParticles)) { return; }

    var p = inputParticles[idx];
    if (params.dt <= 0.0) {
        outputParticles[idx] = p;
        return;
    }
    
    // --- Fluid Solver Logic ---
    // Instead of a grid, we use a curl-noise approximation of Navier-Stokes 
    // to maintain 60FPS with 10 million particles.
    
    let scale = 2.0;
    let n1 = noise(p.pos * scale + params.time * 0.1);
    let n2 = noise(p.pos * scale + vec2<f32>(5.2, 1.3) + params.time * 0.1);
    
    let curl = vec2<f32>(n2 - n1, n1 + n2);
    
    // Vortex at center
    let dist = length(p.pos);
    let vortex = vec2<f32>(-p.pos.y, p.pos.x) * (1.0 / (dist + 0.5)) * params.vorticity;
    
    let fluidForce = curl + vortex;
    
    p.vel = mix(p.vel, fluidForce, params.viscosity);
    p.pos = p.pos + p.vel * params.dt;
    
    // Boundary check
    if (abs(p.pos.x) > 2.0 || abs(p.pos.y) > 2.0) {
        p.pos = vec2<f32>(hash(vec2<f32>(f32(idx), params.time)) * 2.0 - 1.0, hash(vec2<f32>(params.time, f32(idx))) * 2.0 - 1.0);
        p.vel = vec2<f32>(0.0);
    }

    outputParticles[idx] = p;
}
`;

const RENDER_SHADER = `
struct VertexOutput {
    @builtin(position) pos : vec4<f32>,
    @location(0) color : vec4<f32>,
};

struct Particle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    color: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> particles : array<Particle>;

@vertex
fn vs_main(@builtin(vertex_index) vIdx : u32, @builtin(instance_index) iIdx : u32) -> VertexOutput {
    let p = particles[vIdx];
    
    // Tiny point rendering
    let aspect = 1.0; // Handled by sizing
    let pointSize = 0.001;
    
    var out : VertexOutput;
    out.pos = vec4<f32>(p.pos, 0.0, 1.0);
    out.color = p.color * (length(p.vel) + 0.2);
    return out;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(color.rgb, 0.1); // Low alpha for additive volumetric effect
}
`;

class NebulaSim {
    constructor() {
        this.canvas = document.getElementById('nebula-canvas');
        this.device = null;
        this.context = null;
        this.particleCount = CONFIG.particleCount;
        this.step = 0;
        this.previousFrame = 0;
        this.elapsed = 0;
        this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.viscosity = document.getElementById('viscosity');
        this.vorticity = document.getElementById('vorticity');
        this.pauseButton = document.getElementById('pause-nebula');
        this.pauseButton?.addEventListener('click', () => {
            this.paused = !this.paused;
            this.pauseButton.textContent = this.paused ? 'Resume simulation' : 'Pause simulation';
            this.pauseButton.setAttribute('aria-pressed', String(this.paused));
        });
        if (this.pauseButton) {
            this.pauseButton.textContent = this.paused ? 'Resume simulation' : 'Pause simulation';
            this.pauseButton.setAttribute('aria-pressed', String(this.paused));
        }
        addEventListener('resize', () => this.resize());
        this.resize();
        this.init().catch(error => this.startFallback(error.message));
    }

    async init() {
        if (!navigator.gpu) throw new Error('WebGPU is unavailable');
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error('No WebGPU adapter is available');
        this.device = await adapter.requestDevice();
        this.particleCount = Math.min(CONFIG.particleCount,
            Math.floor(this.device.limits.maxStorageBufferBindingSize / 32),
            this.device.limits.maxComputeWorkgroupsPerDimension * CONFIG.workgroupSize);
        this.device.lost.then(() => this.startFallback('The WebGPU device was lost'));

        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
        });

        this.device.pushErrorScope('validation');
        this.createBuffers();
        this.createPipelines();
        const error = await this.device.popErrorScope();
        if (error) throw new Error(error.message);
        this.mode = 'webgpu';
        this.updateStatus();
        this.render();
    }

    resize() {
        const scale = Math.min(devicePixelRatio || 1, 1.5);
        this.canvas.width = Math.max(1, Math.floor(innerWidth * scale));
        this.canvas.height = Math.max(1, Math.floor(innerHeight * scale));
    }

    updateStatus(message = '') {
        this.canvas.dataset.renderer = this.mode;
        document.getElementById('particle-count').textContent = this.particleCount.toLocaleString();
        document.getElementById('gpu-load').textContent = this.mode === 'webgpu' ? 'WebGPU' : 'Canvas 2D';
        document.getElementById('nebula-status').textContent = message || 'Particle-advection study. Viscosity changes velocity smoothing; vorticity changes the swirling force.';
    }

    startFallback(reason) {
        if (this.mode === 'canvas2d') return;
        cancelAnimationFrame(this.frame);
        // A canvas context type cannot be changed after WebGPU initialization.
        const replacement = this.canvas.cloneNode();
        this.canvas.replaceWith(replacement);
        this.canvas = replacement;
        this.resize();
        this.context = this.canvas.getContext('2d');
        this.mode = 'canvas2d';
        this.particleCount = innerWidth < 600 ? 900 : 1800;
        this.particles = Array.from({ length: this.particleCount }, (_, i) => {
            const angle = i * 2.399963;
            const radius = Math.sqrt((i + 0.5) / this.particleCount) * 1.6;
            return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, vx: 0, vy: 0, hue: 185 + (i % 85) };
        });
        this.updateStatus(`${reason}. The interactive Canvas 2D particle study is active.`);
        this.renderFallback();
    }

    renderFallback() {
        const now = performance.now();
        const dt = Math.min(.04, (now - (this.previousFrame || now - 16)) / 1000);
        this.previousFrame = now;
        if (!document.hidden) {
            const ctx = this.context;
            const w = this.canvas.width, h = this.canvas.height;
            ctx.fillStyle = '#030711'; ctx.fillRect(0, 0, w, h);
            const viscosity = Number(this.viscosity.value);
            const vorticity = Number(this.vorticity.value);
            if (!this.paused) this.elapsed += dt;
            for (const p of this.particles) {
                if (!this.paused) {
                    const distance = Math.hypot(p.x, p.y) + .5;
                    const smoothing = 1 - Math.exp(-(1 + viscosity * 20) * dt);
                    p.vx += ((-p.y / distance * vorticity + Math.sin(p.y * 3 + this.elapsed * .2) * .25) - p.vx) * smoothing;
                    p.vy += ((p.x / distance * vorticity + Math.cos(p.x * 3 + this.elapsed * .2) * .25) - p.vy) * smoothing;
                    p.x += p.vx * dt; p.y += p.vy * dt;
                    if (Math.abs(p.x) > 2 || Math.abs(p.y) > 2) { p.x *= .6; p.y *= .6; }
                }
                const x = w / 2 + p.x * Math.min(w, h) * .26;
                const y = h / 2 + p.y * Math.min(w, h) * .26;
                ctx.fillStyle = `hsla(${p.hue},80%,70%,.55)`;
                ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
            }
            document.getElementById('frame-time').textContent = `${(performance.now() - now).toFixed(2)} ms CPU`;
            this.canvas.dataset.simulationTime = this.elapsed.toFixed(3);
        }
        this.frame = requestAnimationFrame(() => this.renderFallback());
    }

    createBuffers() {
        const particleSize = 32; // 8 floats
        const data = new Float32Array(this.particleCount * 8);
        for (let i = 0; i < this.particleCount; i++) {
            data[i * 8 + 0] = (Math.random() * 2 - 1); // x
            data[i * 8 + 1] = (Math.random() * 2 - 1); // y
            data[i * 8 + 4] = Math.random(); // r
            data[i * 8 + 5] = Math.random() * 0.5; // g
            data[i * 8 + 6] = 1.0; // b
            data[i * 8 + 7] = 1.0; // a
        }

        this.particleBuffers = [
            this.device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }),
            this.device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
        ];

        this.device.queue.writeBuffer(this.particleBuffers[0], 0, data);

        this.uniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }

    createPipelines() {
        const computeModule = this.device.createShaderModule({ code: COMPUTE_SHADER });
        const renderModule = this.device.createShaderModule({ code: RENDER_SHADER });

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: { module: computeModule, entryPoint: 'main' }
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: renderModule, entryPoint: 'vs_main' },
            fragment: {
                module: renderModule,
                entryPoint: 'fs_main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
                    }
                }]
            },
            primitive: { topology: 'point-list' }
        });

        this.computeBindGroups = [
            this.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[0] } }
                ]
            })
        ];

        this.renderBindGroups = [
            this.device.createBindGroup({
                layout: this.renderPipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: this.particleBuffers[0] } }]
            }),
            this.device.createBindGroup({
                layout: this.renderPipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: this.particleBuffers[1] } }]
            })
        ];
    }

    render() {
        if (this.mode !== 'webgpu') return;
        const now = performance.now();
        const frameTime = Math.min(.04, (now - (this.previousFrame || now - 16)) / 1000);
        this.previousFrame = now;
        if (document.hidden) { this.frame = requestAnimationFrame(() => this.render()); return; }
        if (!this.paused) this.elapsed += frameTime;
        
        const uniformData = new Float32Array([this.paused ? 0 : frameTime, Number(this.viscosity.value), Number(this.vorticity.value), this.elapsed]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const encoder = this.device.createCommandEncoder();
        
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindGroups[this.step]);
        computePass.dispatchWorkgroups(Math.ceil(this.particleCount / CONFIG.workgroupSize));
        computePass.end();

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroups[(this.step + 1) % 2]);
        renderPass.draw(this.particleCount);
        renderPass.end();

        this.device.queue.submit([encoder.finish()]);
        
        this.step = (this.step + 1) % 2;
        
        document.getElementById('frame-time').textContent = (performance.now() - now).toFixed(2) + ' ms CPU';
        this.canvas.dataset.simulationTime = this.elapsed.toFixed(3);
        
        this.frame = requestAnimationFrame(() => this.render());
    }
}

window.nebulaSimulation = new NebulaSim();
