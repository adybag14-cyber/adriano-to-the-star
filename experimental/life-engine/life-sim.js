/**
 * WebGPU Integrated Biological & Life Engine
 * Implementation of Roadmap Items #49, #77, #84, #93, #119, #131, #136
 */

const CONFIG = {
    workgroupSize: 64,
};

const COMPUTE_SHADER = `
struct Params {
    pulseSpeed: f32,
    time: f32,
    density: f32,
    screenSize: vec2<f32>,
};

struct Agent {
    pos: vec2<f32>,
    vel: vec2<f32>,
    color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> inputAgents : array<Agent>;
@group(0) @binding(2) var<storage, read_write> outputAgents : array<Agent>;

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(${CONFIG.workgroupSize})
fn main(@builtin(global_invocation_id) id : vec3<u32>) {
    let idx = id.x;
    if (idx >= u32(params.density)) { return; }

    var agent = inputAgents[idx];
    
    // --- Flocking AI (Item #77 / #119) ---
    // Simplified Boids approximation for real-time WebGPU performance
    let noise = vec2<f32>(
        hash(agent.pos + params.time),
        hash(agent.pos + params.time + 1.0)
    ) * 2.0 - 1.0;
    
    let center = vec2<f32>(0.0, 0.0);
    let toCenter = normalize(center - agent.pos) * 0.01;
    
    agent.vel = normalize(agent.vel + noise * 0.05 + toCenter);
    agent.pos += agent.vel * 0.01;
    
    // --- Synced Bioluminescent Pulse (Item #136 / #93) ---
    let pulse = sin(params.time * params.pulseSpeed + hash(vec2<f32>(f32(idx)))) * 0.5 + 0.5;
    agent.color = vec4<f32>(0.0, 1.0, 0.6, pulse); // Cyan bioluminescence
    
    // Boundary check
    if (length(agent.pos) > 1.5) {
        agent.pos = -agent.pos * 0.9;
    }

    outputAgents[idx] = agent;
}
`;

const RENDER_SHADER = `
struct VertexOutput {
    @builtin(position) pos : vec4<f32>,
    @location(0) color : vec4<f32>,
};

struct Agent {
    pos: vec2<f32>,
    vel: vec2<f32>,
    color: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> agents : array<Agent>;

@vertex
fn vs_main(@builtin(instance_index) iIdx : u32, @builtin(vertex_index) vIdx : u32) -> VertexOutput {
    let agent = agents[iIdx];
    
    // Tiny triangle for each agent
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.01),
        vec2<f32>(-0.005, -0.01),
        vec2<f32>(0.005, -0.01)
    );
    
    let angle = atan2(agent.vel.y, agent.vel.x) - 1.5708;
    let c = cos(angle);
    let s = sin(angle);
    let rotated = vec2<f32>(pos[vIdx].x * c - pos[vIdx].y * s, pos[vIdx].x * s + pos[vIdx].y * c);
    
    var out : VertexOutput;
    out.pos = vec4<f32>(agent.pos + rotated, 0.0, 1.0);
    out.color = agent.color;
    return out;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    // Subsurface Scattering Approximation (Item #84)
    let glow = color.rgb * color.a * 2.0;
    return vec4<f32>(glow, color.a);
}
`;

class LifeSim {
    constructor() {
        this.canvas = document.getElementById('life-canvas');
        this.density = 10000;
        this.pulse = 1.0;
        this.step = 0;
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        this.createBuffers();
        this.createPipelines();
        this.setupControls();
        this.render();
    }

    createBuffers() {
        const agentSize = 32; // 8 floats
        const data = new Float32Array(50000 * 8);
        for (let i = 0; i < 50000; i++) {
            data[i * 8 + 0] = (Math.random() * 2 - 1);
            data[i * 8 + 1] = (Math.random() * 2 - 1);
            data[i * 8 + 2] = (Math.random() * 2 - 1);
            data[i * 8 + 3] = (Math.random() * 2 - 1);
        }

        this.agentBuffers = [
            this.device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }),
            this.device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
        ];
        this.device.queue.writeBuffer(this.agentBuffers[0], 0, data);

        this.uniformBuffer = this.device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    }

    createPipelines() {
        const computeModule = this.device.createShaderModule({ code: COMPUTE_SHADER });
        const renderModule = this.device.createShaderModule({ code: RENDER_SHADER });

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto', compute: { module: computeModule, entryPoint: 'main' }
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: renderModule, entryPoint: 'vs_main' },
            fragment: {
                module: renderModule, entryPoint: 'fs_main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
                    }
                }]
            },
            primitive: { topology: 'triangle-list' }
        });

        this.computeBindGroups = [
            this.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.agentBuffers[0] } },
                    { binding: 2, resource: { buffer: this.agentBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.agentBuffers[1] } },
                    { binding: 2, resource: { buffer: this.agentBuffers[0] } }
                ]
            })
        ];

        this.renderBindGroups = [
            this.device.createBindGroup({
                layout: this.renderPipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: this.agentBuffers[0] } }]
            }),
            this.device.createBindGroup({
                layout: this.renderPipeline.getBindGroupLayout(0),
                entries: [{ binding: 0, resource: { buffer: this.agentBuffers[1] } }]
            })
        ];
    }

    setupControls() {
        document.getElementById('density').addEventListener('input', e => this.density = parseInt(e.target.value));
        document.getElementById('pulse').addEventListener('input', e => this.pulse = parseFloat(e.target.value));
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    render() {
        const uniformData = new Float32Array([this.pulse, performance.now() / 1000, this.density, 0, window.innerWidth, window.innerHeight, 0, 0]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindGroups[this.step]);
        computePass.dispatchWorkgroups(Math.ceil(this.density / CONFIG.workgroupSize));
        computePass.end();

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear', storeOp: 'store'
            }]
        });
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroups[(this.step + 1) % 2]);
        renderPass.draw(3, this.density);
        renderPass.end();

        this.device.queue.submit([encoder.finish()]);
        this.step = (this.step + 1) % 2;
        requestAnimationFrame(() => this.render());
    }
}

new LifeSim();
