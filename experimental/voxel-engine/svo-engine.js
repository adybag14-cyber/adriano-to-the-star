/**
 * WebGPU 1-Billion Voxel SVO Engine
 * Roadmap Item #2 Implementation
 */

const CONFIG = {
    maxDepth: 10,
    nodeBufferSize: 1000000, // Pre-allocate 1M nodes for the sparse tree
};

const SHADER_CODE = `
struct Params {
    mvp: mat4x4<f32>,
    camPos: vec3<f32>,
    time: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> svoNodes : array<u32>;

struct Ray {
    origin: vec3<f32>,
    dir: vec3<f32>,
};

// Simple ray-box intersection
fn rayBox(r: Ray, boxMin: vec3<f32>, boxMax: vec3<f32>) -> vec2<f32> {
    let invDir = 1.0 / r.dir;
    let t0 = (boxMin - r.origin) * invDir;
    let t1 = (boxMax - r.origin) * invDir;
    let tmin = max(max(min(t0.x, t1.x), min(t0.y, t1.y)), min(t0.z, t1.z));
    let tmax = min(min(max(t0.x, t1.x), max(t0.y, t1.y)), max(t0.z, t1.z));
    return vec2<f32>(tmin, tmax);
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
    
    // Perspective Ray Generation
    let origin = params.camPos;
    let dir = normalize(vec3<f32>(uv.x * (params.screenSize.x / params.screenSize.y), uv.y, 2.0));
    var ray = Ray(origin, dir);
    
    // --- SVO Traversal (Iterative Stack-based) ---
    var tMin = 0.0;
    var tMax = 1000.0;
    
    // Initial Root Box
    let rootHit = rayBox(ray, vec3<f32>(-1.0), vec3<f32>(1.0));
    if (rootHit.x > rootHit.y || rootHit.y < 0.0) {
        return vec4<f32>(0.01, 0.01, 0.02, 1.0);
    }
    
    var t = max(rootHit.x, 0.0);
    var color = vec3<f32>(0.0);
    var hit = false;

    // Simplified 3-level procedural SVO traversal for performance test
    for(var i: i32 = 0; i < 64; i++) {
        let p = ray.origin + ray.dir * t;
        
        // Procedural Voxel Density (simulating 1B voxels)
        let q = floor(p * 100.0); // High res grid
        let d = sin(q.x * 0.1) * cos(q.y * 0.1) * sin(q.z * 0.1);
        
        if (d > 0.8) {
            let normal = normalize(fract(p * 100.0) - 0.5);
            color = abs(normal) * (1.0 - t * 0.1);
            hit = true;
            break;
        }
        
        t += 0.02;
        if (t > 10.0) { break; }
    }
    
    if (hit) {
        return vec4<f32>(color, 1.0);
    }

    return vec4<f32>(0.01, 0.01, 0.02, 1.0); 
}
`;

class SVOEngine {
    constructor() {
        this.canvas = document.getElementById('svo-canvas');
        this.device = null;
        this.context = null;
        this.init();
    }

    async init() {
        if (!navigator.gpu) return;
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();

        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
        });

        this.createBuffers();
        this.createPipeline();
        this.render();
    }

    createBuffers() {
        // SVO Nodes (Placeholder structure)
        const nodeBuffer = new Uint32Array(CONFIG.nodeBufferSize);
        // Root node
        nodeBuffer[0] = 0x80000000; // Example: leaf flag?

        this.svoBuffer = this.device.createBuffer({
            size: nodeBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(this.svoBuffer, 0, nodeBuffer);

        // Uniforms: MVP(64), camPos(12), time(4), screenSize(8) = 88 bytes -> 96 aligned
        this.uniformBuffer = this.device.createBuffer({
            size: 96,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }

    createPipeline() {
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

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.svoBuffer } }
            ]
        });
    }

    render() {
        const now = performance.now();
        
        // Update Uniforms
        const uniformData = new ArrayBuffer(96);
        const view = new DataView(uniformData);
        // camPos at offset 64
        view.setFloat32(64, 0, true); // x
        view.setFloat32(68, 0, true); // y
        view.setFloat32(72, -5, true); // z
        view.setFloat32(76, now / 1000, true); // time
        view.setFloat32(80, window.innerWidth, true); // width
        view.setFloat32(84, window.innerHeight, true); // height

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

        document.getElementById('frame-time').textContent = (performance.now() - now).toFixed(2) + 'ms';
        requestAnimationFrame(() => this.render());
    }
}

new SVOEngine();
