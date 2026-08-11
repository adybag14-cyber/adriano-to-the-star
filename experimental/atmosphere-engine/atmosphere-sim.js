/**
 * WebGPU Integrated Atmospheric & Volumetric System
 * Implementation of Roadmap Items #4, #35, #45, #60, #94, #105
 */

const SHADER_CODE = `
struct Params {
    cloudDensity: f32,
    scattering: f32,
    aurora: f32,
    time: f32,
    camPos: vec3<f32>,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;

// --- Noise Functions for Volumetrics ---
fn hash(p: vec3<f32>) -> f32 {
    let q = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
    let r = q + dot(q, q.yzx + 33.33);
    return fract((r.x + r.y) * r.z);
}

fn noise(p: vec3<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3<f32>(0,0,0)), hash(i + vec3<f32>(1,0,0)), u.x),
                   mix(hash(i + vec3<f32>(0,1,0)), hash(i + vec3<f32>(1,1,0)), u.x), u.y),
               mix(mix(hash(i + vec3<f32>(0,0,1)), hash(i + vec3<f32>(1,0,1)), u.x),
                   mix(hash(i + vec3<f32>(0,1,1)), hash(i + vec3<f32>(1,1,1)), u.x), u.y), u.z);
}

fn fbm(p: vec3<f32>) -> f32 {
    var v = 0.0;
    var a = 0.5;
    var q = p;
    for (var i = 0; i < 4; i++) {
        v += a * noise(q);
        q *= 2.0;
        a *= 0.5;
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
    
    let ro = params.camPos;
    let rd = normalize(vec3<f32>(uv.x * aspect, uv.y, 1.5));
    
    var color = vec3<f32>(0.01, 0.02, 0.05); // Deep space base
    
    // --- Volumetric Ray Marching ---
    var t = 0.0;
    var density = 0.0;
    let steps = 64;
    let stepSize = 0.2;
    
    for (var i = 0; i < steps; i++) {
        let p = ro + rd * t;
        
        // 1. Clouds (Item #4)
        let c = fbm(p * 0.5 + params.time * 0.1);
        if (c > (1.0 - params.cloudDensity)) {
            let d = (c - (1.0 - params.cloudDensity)) * stepSize;
            density += d;
            
            // 2. Solar Scattering / God Rays (Item #35)
            let lightDir = normalize(vec3<f32>(1.0, 1.0, -1.0));
            let shadow = fbm(p * 0.5 + lightDir * 0.5);
            let scattering = exp(-t * 0.1) * params.scattering;
            color += vec3<f32>(1.0, 0.9, 0.8) * d * scattering * shadow;
        }
        
        // 3. Aurora (Item #45)
        if (p.y > 2.0 && p.y < 5.0) {
            let a = fbm(p * vec3<f32>(0.1, 1.0, 0.1) + params.time * 0.2);
            if (a > 0.6) {
                let auroraCol = mix(vec3<f32>(0.0, 1.0, 0.5), vec3<f32>(0.5, 0.0, 1.0), noise(p * 0.1));
                color += auroraCol * (a - 0.6) * params.aurora * exp(-t * 0.05);
            }
        }
        
        t += stepSize;
        if (density >= 1.0) { break; }
    }
    
    // 4. Haze & Fog (Items #94, #105)
    color = mix(color, vec3<f32>(0.5, 0.6, 0.7), min(1.0, t * 0.02));
    
    return vec4<f32>(color, 1.0);
}
`;

class AtmosphereSim {
    constructor() {
        this.canvas = document.getElementById('atmosphere-canvas');
        this.values = { density: 0.5, scattering: 1.2, aurora: 0.3 };
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
            size: 64, // Padded
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }]
        });

        this.setupControls();
        this.render();
    }

    setupControls() {
        const get = id => document.getElementById(id);
        get('cloud-density').addEventListener('input', e => this.values.density = parseFloat(e.target.value));
        get('scattering').addEventListener('input', e => this.values.scattering = parseFloat(e.target.value));
        get('aurora').addEventListener('input', e => this.values.aurora = parseFloat(e.target.value));
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    render() {
        const uniformData = new Float32Array([
            this.values.density, 
            this.values.scattering, 
            this.values.aurora, 
            performance.now() / 1000,
            0, 0, -5, 0, // camPos (vec3 + padding)
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

new AtmosphereSim();
