/**
 * WebGPU Gravitational Lensing Simulation
 * Roadmap Item #40 Implementation
 */

const SHADER_CODE = `
struct Params {
    camPos: vec3<f32>,
    mass: f32,
    time: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;

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
    let aspect = params.screenSize.x / params.screenSize.y;
    
    // Ray Setup
    var ro = vec3<f32>(0.0, 0.0, -10.0); // Camera
    var rd = normalize(vec3<f32>(uv.x * aspect, uv.y, 2.0));
    
    // Black Hole at Origin
    let bhPos = vec3<f32>(0.0);
    let rs = params.mass * 0.1; // Schwarzschild radius
    
    // Integration Setup (Ray Marching in Curved Space)
    var currPos = ro;
    var currDir = rd;
    let dt = 0.1;
    var hitEventHorizon = false;
    
    for (var i: i32 = 0; i < 128; i++) {
        let r = length(currPos - bhPos);
        if (r < rs) {
            hitEventHorizon = true;
            break;
        }
        
        // Bending force
        let forceDir = normalize(bhPos - currPos);
        let forceMag = (1.5 * rs) / (r * r);
        
        currDir = normalize(currDir + forceDir * forceMag * dt);
        currPos += currDir * dt;
        
        if (length(currPos) > 20.0) { break; }
    }
    
    if (hitEventHorizon) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0); // Black hole core
    }
    
    // Distorted Starfield Background
    let finalDir = currDir;
    let star = pow(max(0.0, sin(finalDir.x * 20.0) * cos(finalDir.y * 20.0) * sin(finalDir.z * 20.0)), 100.0);
    let color = vec3<f32>(star * 2.0);
    
    return vec4<f32>(color + vec3<f32>(0.01, 0.01, 0.05), 1.0);
}
`;

class LensingSim {
    constructor() {
        this.canvas = document.getElementById('lensing-canvas');
        this.mass = 10.0;
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat()
        });

        const shaderModule = this.device.createShaderModule({ code: SHADER_CODE });
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: shaderModule, entryPoint: 'vs_main' },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
            },
            primitive: { topology: 'triangle-strip' }
        });

        this.uniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }]
        });

        document.getElementById('mass-slider').addEventListener('input', (e) => {
            this.mass = parseFloat(e.target.value);
        });

        this.render();
    }

    render() {
        const uniformData = new Float32Array([0, 0, -10, this.mass, performance.now()/1000, 0, window.innerWidth, window.innerHeight]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
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

new LensingSim();
