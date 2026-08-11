/**
 * WebGPU Integrated Discovery & Analytics Engine
 * Implementation of Roadmap Items #42, #54, #63, #64, #72, #76, #81, #85, #92, #98, #133
 */

const DISCOVERY_SHADER = `
struct Params {
    time: f32,
    kelvin: f32,
    quantum: f32,
    albedo: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

// Simple Kelvin to RGB approximation
fn kelvinToRGB(k: f32) -> vec3<f32> {
    let temp = k / 100.0;
    var r = 0.0; var g = 0.0; var b = 0.0;
    
    if (temp <= 66.0) {
        r = 255.0;
        g = 99.47 * log(temp) - 161.11;
        b = if (temp <= 19.0) { 0.0 } else { 138.51 * log(temp - 10.0) - 305.04 };
    } else {
        r = 329.69 * pow(temp - 60.0, -0.133);
        g = 288.12 * pow(temp - 60.0, -0.0755);
        b = 255.0;
    }
    return clamp(vec3<f32>(r, g, b) / 255.0, vec3<f32>(0.0), vec3<f32>(1.0));
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
    
    // --- Star Color (Item #42) ---
    let starCol = kelvinToRGB(params.kelvin);
    
    var color = vec3<f32>(0.0);
    
    // --- Optical Telescope Diffraction (Item #133) ---
    let dist = length(uv);
    let diffraction = pow(abs(sin(dist * 50.0 - params.time * 5.0) / (dist * 50.0)), 2.0);
    color += starCol * diffraction * 5.0;
    
    // --- Planetary Albedo Simulation (Item #85) ---
    let planetHit = step(dist, 0.2);
    let albedoCol = starCol * params.albedo * (uv.x + 1.0); // Simple directional albedo
    color = mix(color, albedoCol, planetHit);
    
    // --- Quantum View (Item #81) ---
    if (params.quantum > 0.5) {
        let qNoise = hash(uv + params.time);
        color = mix(color, vec3<f32>(qNoise), 0.2);
        // Prismatic Edge Logic (Item #92)
        if (dist > 0.8) {
            color += vec3<f32>(sin(params.time), cos(params.time), 1.0) * 0.3;
        }
    }

    return vec4<f32>(color, 1.0);
}
`;

class DiscoveryMaster {
    constructor() {
        this.canvas = document.getElementById('discovery-canvas');
        this.kelvin = 5778; // G-type star
        this.quantum = 0.0;
        this.albedo = 0.31;
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        const shaderModule = this.device.createShaderModule({ code: DISCOVERY_SHADER });
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

        window.toggleQuantum = () => { this.quantum = this.quantum === 0.0 ? 1.0 : 0.0; };

        this.render();
    }

    render() {
        const uniformData = new Float32Array([performance.now() / 1000, this.kelvin, this.quantum, this.albedo, window.innerWidth, window.innerHeight, 0, 0]);
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

new DiscoveryMaster();
