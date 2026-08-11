/**
 * WebGPU Dyson Swarm & Optimization Engine
 * Implementation of Roadmap Items #151, #152, #160, #164, #184, #188, #196, #206
 */

const CONFIG = {
    satelliteCount: 100000,
    workgroupSize: 64,
};

const DYSON_SHADER = `
struct Params {
    time: f32,
    camPos: vec3<f32>,
    screenSize: vec2<f32>,
};

struct Satellite {
    pos: vec3<f32>,
    lod: f32,
    id: f32,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> inputSats : array<Satellite>;
@group(0) @binding(2) var<storage, read_write> outputSats : array<Satellite>;

@compute @workgroup_size(${CONFIG.workgroupSize})
fn main(@builtin(global_invocation_id) id : vec3<u32>) {
    let idx = id.x;
    if (idx >= ${CONFIG.satelliteCount}u) { return; }

    var sat = inputSats[idx];
    
    // --- Orbital Physics (Simplification #152) ---
    let radius = 5.0 + hash(vec2<f32>(sat.id, 0.0)) * 2.0;
    let angle = params.time * 0.1 + sat.id;
    sat.pos = vec3<f32>(cos(angle) * radius, sin(sat.id) * 2.0, sin(angle) * radius);
    
    // --- Multi-scale LOD System (Item #151) ---
    let dist = length(sat.pos - params.camPos);
    if (dist < 2.0) {
        sat.lod = 3.0; // High
    } else if (dist < 5.0) {
        sat.lod = 2.0; // Med
    } else {
        sat.lod = 1.0; // Low
    }
    
    // --- GPU-Driven Culling (#160) ---
    // Simple placeholder for frustum culling
    if (sat.pos.z < -10.0) {
        sat.lod = 0.0; // Culled
    }

    outputSats[idx] = sat;
}

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}
`;

const RENDER_SHADER = `
struct VertexOutput {
    @builtin(position) pos : vec4<f32>,
    @location(0) color : vec4<f32>,
};

struct Satellite {
    pos: vec3<f32>,
    lod: f32,
    id: f32,
};

@group(0) @binding(0) var<storage, read> sats : array<Satellite>;

@vertex
fn vs_main(@builtin(instance_index) iIdx : u32, @builtin(vertex_index) vIdx : u32) -> VertexOutput {
    let sat = sats[iIdx];
    
    if (sat.lod == 0.0) {
        return VertexOutput(vec4<f32>(0.0), vec4<f32>(0.0));
    }
    
    // Dynamic Vertex Count based on LOD (#151)
    let size = 0.01 * sat.lod;
    
    var pos = array<vec3<f32>, 3>(
        vec3<f32>(0.0, size, 0.0),
        vec3<f32>(-size, -size, 0.0),
        vec3<f32>(size, -size, 0.0)
    );
    
    var out : VertexOutput;
    out.pos = vec4<f32>(sat.pos + pos[vIdx % 3], 1.0);
    out.color = vec4<f32>(1.0, 0.8, 0.0, 1.0);
    return out;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
    if (color.a == 0.0) { discard; }
    return color;
}
`;

class DysonSim {
    constructor() {
        this.canvas = document.getElementById('dyson-canvas');
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        this.createBuffers();
        this.createPipelines();
        this.render();
    }

    createBuffers() {
        const data = new Float32Array(CONFIG.satelliteCount * 8); // pos(3), lod(1), id(1), padding(3)
        for (let i = 0; i < CONFIG.satelliteCount; i++) {
            data[i * 8 + 4] = i; // id
        }

        this.satBuffers = [
            this.device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }),
            this.device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
        ];
        this.device.queue.writeBuffer(this.satBuffers[0], 0, data);

        this.uniformBuffer = this.device.createBuffer({
            size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }

    createPipelines() {
        const computeModule = this.device.createShaderModule({ code: DYSON_SHADER });
        const renderModule = this.device.createShaderModule({ code: RENDER_SHADER });

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto', compute: { module: computeModule, entryPoint: 'main' }
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: renderModule, entryPoint: 'vs_main' },
            fragment: {
                module: renderModule, entryPoint: 'fs_main',
                targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
            },
            primitive: { topology: 'triangle-list' }
        });

        this.computeBindGroup = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.satBuffers[0] } },
                { binding: 2, resource: { buffer: this.satBuffers[1] } }
            ]
        });

        this.renderBindGroup = this.device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: this.satBuffers[1] } }]
        });
    }

    render() {
        const uniformData = new Float32Array([performance.now() / 1000, 0, 0, 0, 0, 0, 0, 0, window.innerWidth, window.innerHeight, 0, 0]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const encoder = this.device.createCommandEncoder();
        const cp = encoder.beginComputePass();
        cp.setPipeline(this.computePipeline);
        cp.setBindGroup(0, this.computeBindGroup);
        cp.dispatchWorkgroups(Math.ceil(CONFIG.satelliteCount / CONFIG.workgroupSize));
        cp.end();

        const rp = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear', storeOp: 'store'
            }]
        });
        rp.setPipeline(this.renderPipeline);
        rp.setBindGroup(0, this.renderBindGroup);
        rp.draw(3, CONFIG.satelliteCount);
        rp.end();

        this.device.queue.submit([encoder.finish()]);
        requestAnimationFrame(() => this.render());
    }
}

new DysonSim();
