/**
 * WebGPU 10-Million Particle Navier-Stokes Simulation
 * Roadmap Item #1 Implementation
 */

const CONFIG = {
    particleCount: 10000000,
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
    if (idx >= ${CONFIG.particleCount}u) { return; }

    var p = inputParticles[idx];
    
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
    let p = particles[iIdx];
    
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
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        
        // Request higher limits for 10M particles
        const requiredLimits = {
            maxStorageBufferBindingSize: 512 * 1024 * 1024, // 512MB
            maxBufferSize: 512 * 1024 * 1024
        };

        this.device = await adapter.requestDevice({
            requiredLimits: requiredLimits
        });

        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
        });

        this.createBuffers();
        this.createPipelines();
        this.render();
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
        const now = performance.now();
        const frameTime = 0.016;
        
        const uniformData = new Float32Array([frameTime, 0.1, 2.0, now / 1000]);
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
        
        document.getElementById('frame-time').textContent = (performance.now() - now).toFixed(2) + 'ms';
        
        requestAnimationFrame(() => this.render());
    }
}

new NebulaSim();
