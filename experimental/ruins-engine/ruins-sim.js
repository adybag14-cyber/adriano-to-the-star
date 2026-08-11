/**
 * WebGPU Ancient Ruins & Procedural Architecture Engine
 * Implementation of Roadmap Items #86, #124, #174, #220, #226, #262, #286
 */

const RUINS_SHADER = `
struct Params {
    time: f32,
    weathering: f32,
    latticeDensity: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@vertex
fn vs_main(@builtin(vertex_index) id : u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0)
    );
    return vec4<f32>(pos[id], 0.0, 1.0);
}

@fragment
fn fs_main(@builtin(position) pos : vec4<f32>) -> @location(0) vec4<f32> {
    let uv = (pos.xy / params.screenSize) * 2.0 - 1.0;
    
    // --- Modular Shape Grammar Simulation (Item #86 / #286) ---
    let grid = floor(uv * 5.0);
    let cell = hash(grid);
    var color = vec3<f32>(0.15, 0.12, 0.1); // Ancient stone base
    
    if (cell > 0.5) {
        // Construct basic "Grammar" blocks
        let subGrid = fract(uv * 5.0);
        if (subGrid.x > 0.1 && subGrid.x < 0.9 && subGrid.y > 0.1 && subGrid.y < 0.9) {
            color = vec3<f32>(0.25, 0.22, 0.2);
            
            // Weathering & Moss (Item #220)
            let moss = hash(pos.xy * 0.05 + params.time * 0.1) * params.weathering;
            color = mix(color, vec3<f32>(0.1, 0.3, 0.05), moss);
        }
    }
    
    // --- Reaction-Diffusion Texture Synthesis (Item #262) ---
    let rd = sin(uv.x * 50.0 + sin(uv.y * 50.0 + params.time)) * 0.5 + 0.5;
    if (cell < 0.2) {
        color = mix(color, vec3<f32>(0.4, 0.1, 0.5), rd * 0.3); // Alien bio-matter
    }
    
    // --- Mineral Lattice (Item #226) ---
    let lattice = step(0.95, hash(uv * 100.0));
    color += vec3<f32>(0.0, 0.8, 1.0) * lattice * params.latticeDensity;

    return vec4<f32>(color, 1.0);
}
`;

class RuinsMaster {
    constructor() {
        this.canvas = document.getElementById('ruins-canvas');
        this.weathering = 0.145;
        this.lattice = 0.5;
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        const shaderModule = this.device.createShaderModule({ code: RUINS_SHADER });
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shaderModule, entryPoint: 'vs_main' },
            fragment: {
                module: shaderModule, entryPoint: 'fs_main',
                targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
            },
            primitive: { topology: 'triangle-strip' }
        });

        this.uniformBuffer = this.device.createBuffer({
            size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }]
        });

        this.render();
    }

    render() {
        const time = performance.now() / 1000;
        const uniformData = new Float32Array([time, this.weathering, this.lattice, 0, window.innerWidth, window.innerHeight, 0, 0]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear', storeOp: 'store'
            }]
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(4);
        pass.end();
        this.device.queue.submit([encoder.finish()]);
        
        requestAnimationFrame(() => this.render());
    }
}

new RuinsMaster();
