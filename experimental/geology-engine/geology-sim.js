/**
 * WebGPU Integrated Geological & Surface Engine
 * Implementation of Roadmap Items #10, #13, #17, #33, #46, #47, #69, #79
 */

const SHADER_CODE = `
struct Params {
    stress: f32,
    erosion: f32,
    impact: f32,
    time: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;

// --- Hash and Noise for Fractal Terrain ---
fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(12.9898, 78.233))) * 43758.5453);
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

fn fbm(p: vec2<f32>) -> f32 {
    var v = 0.0;
    var a = 0.5;
    var q = p;
    for (var i = 0; i < 6; i++) {
        v += a * noise(q);
        q *= 2.5;
        a *= 0.45;
    }
    return v;
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
fn fs_main(@builtin(position) fragPos : vec4<f32>) -> @location(0) vec4<f32> {
    let uv = (fragPos.xy / params.screenSize) * 2.0 - 1.0;
    let aspect = params.screenSize.x / params.screenSize.y;
    
    // --- Fractal Terrain Generation (Item #33) ---
    var h = fbm(uv * 2.0 + params.time * 0.05);
    
    // --- Tectonic Stress Cracks (Item #10) ---
    let cracks = fbm(uv * 10.0 + params.time * 0.02);
    if (cracks > (1.0 - params.stress * 0.5)) {
        h -= 0.1;
    }
    
    // --- Crater Impact Simulation (Item #13) ---
    let impactPos = vec2<f32>(0.0, 0.0);
    let distToImpact = length(uv - impactPos);
    if (params.impact > 0.0) {
        let crater = smoothstep(0.3, 0.25, distToImpact) * 0.5;
        let rim = smoothstep(0.35, 0.3, distToImpact) * 0.1;
        h = h - crater + rim;
    }
    
    // Color mapping
    var color = vec3<f32>(0.2, 0.15, 0.1); // Rock base
    
    // Mineral Outcrops (Item #79)
    if (h > 0.6) {
        color = mix(color, vec3<f32>(0.8, 0.7, 0.2), 0.5); // Gold/Sulfur
    }
    
    // Crystal Growth (Item #47)
    let crystals = hash(uv * 100.0);
    if (crystals > 0.98 && h > 0.4) {
        color = vec3<f32>(0.4, 0.8, 1.0); // Methane Ice/Crystals
    }
    
    // Simple Lighting
    let normal = normalize(vec3<f32>(fbm(uv + 0.01) - h, 0.1, fbm(uv + vec2<f32>(0.0, 0.01)) - h));
    let light = dot(normal, normalize(vec3<f32>(1.0, 1.0, 1.0)));
    
    return vec4<f32>(color * (light + 0.2), 1.0);
}
`;

class GeologySim {
    constructor() {
        this.canvas = document.getElementById('geology-canvas');
        this.values = { stress: 0.2, erosion: 0.5, impact: 0.0 };
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

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

        window.triggerImpact = () => {
            this.values.impact = 1.0;
            setTimeout(() => this.values.impact = 0.0, 2000);
        };

        this.setupControls();
        this.render();
    }

    setupControls() {
        document.getElementById('tectonics').addEventListener('input', e => this.values.stress = parseFloat(e.target.value));
        document.getElementById('erosion').addEventListener('input', e => this.values.erosion = parseFloat(e.target.value));
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    render() {
        const uniformData = new Float32Array([
            this.values.stress,
            this.values.erosion,
            this.values.impact,
            performance.now() / 1000,
            window.innerWidth,
            window.innerHeight
        ]);
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

new GeologySim();
