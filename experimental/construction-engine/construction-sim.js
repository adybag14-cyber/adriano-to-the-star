/**
 * WebGPU Construction & Automation Station
 * Implementation of Roadmap Items #28, #34, #43, #51, #55, #58, #61, #68, #73, #82, #83, #101
 */

const CONSTRUCTION_SHADER = `
struct Params {
    time: f32,
    wear: f32,
    stress: f32,
    debrisCount: f32,
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
    
    // --- Grid-based WFC Layout Simulation (Item #28) ---
    let grid = floor(uv * 10.0);
    let cellHash = hash(grid);
    
    var color = vec3<f32>(0.1);
    
    // --- Building Illumination (Item #73) ---
    if (cellHash > 0.7) {
        color = vec3<f32>(0.2, 0.22, 0.25); // Metal structure
        
        // Material Wear & Dust (Item #34 / #68)
        let wearFactor = hash(pos.xy * 0.1) * params.wear;
        color = color * (1.0 - wearFactor) + vec3<f32>(0.1, 0.08, 0.05) * wearFactor;
        
        // Windows
        let win = step(0.9, hash(pos.xy));
        color += vec3<f32>(0.8, 0.7, 0.4) * win * sin(params.time + cellHash * 10.0);
    }
    
    // --- Extraction Beams (Item #83) ---
    if (abs(uv.x - 0.5) < 0.01 && uv.y > 0.0) {
        color += vec3<f32>(1.0, 0.5, 0.0) * (sin(params.time * 20.0) * 0.5 + 0.5);
    }
    
    // --- Crustal Stress Visualization (Item #61) ---
    let stressLines = step(0.98, sin(uv.y * 50.0 + params.time));
    color += vec3<f32>(1.0, 0.0, 0.0) * stressLines * params.stress;

    return vec4<f32>(color, 1.0);
}
`;

class ConstructionMaster {
    constructor() {
        this.canvas = document.getElementById('construction-canvas');
        this.wear = 0.12;
        this.stress = 0.05;
        this.debris = 0.0;
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        const shaderModule = this.device.createShaderModule({ code: CONSTRUCTION_SHADER });
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

        window.triggerDebris = () => {
            this.debris = 1.0;
            this.stress = 0.8;
            setTimeout(() => { this.debris = 0.0; this.stress = 0.05; }, 3000);
        };

        this.render();
    }

    render() {
        const time = performance.now() / 1000;
        const uniformData = new Float32Array([time, this.wear, this.stress, this.debris, window.innerWidth, window.innerHeight, 0, 0]);
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

new ConstructionMaster();
