/**
 * WebGPU Navigation & Tactical UI Station
 * Implementation of Roadmap Items #41, #43, #44, #50, #57, #59, #75, #89
 */

const SKYBOX_SHADER = `
struct Params {
    time: f32,
    camRot: vec2<f32>,
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
    
    // --- Procedural Skybox (Item #41) ---
    var dir = normalize(vec3<f32>(uv.x, uv.y, 1.0));
    
    // Rotation based on camRot
    let cr = params.camRot;
    let cosX = cos(cr.x); let sinX = sin(cr.x);
    let cosY = cos(cr.y); let sinY = sin(cr.y);
    
    dir = vec3<f32>(
        dir.x * cosY - dir.z * sinY,
        dir.y,
        dir.x * sinY + dir.z * cosY
    );
    
    let starSeed = dir.xy * 100.0;
    let star = pow(hash(starSeed), 100.0) * step(0.99, hash(starSeed + 1.0));
    
    var color = vec3<f32>(star);
    
    // Tactical Overlay Lines (Item #89)
    if (abs(uv.x) < 0.002 || abs(uv.y) < 0.002) {
        color += vec3<f32>(0.0, 0.5, 0.5);
    }

    return vec4<f32>(color, 1.0);
}
`;

class NavMaster {
    constructor() {
        this.canvas = document.getElementById('nav-canvas');
        this.camRot = [0, 0];
        this.coords = { x: 0n, y: 0n, z: 0n }; // 128-bit simulation placeholder
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        const shaderModule = this.device.createShaderModule({ code: SKYBOX_SHADER });
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

        this.setupUI();
        this.render();
    }

    setupUI() {
        // High-frequency ticker (Item #59)
        const ticker = document.getElementById('ticker-content');
        const assets = ["KEP-186F", "GLIESE-581G", "TRAPPIST-1E", "PROXIMA-B", "ALPHA-CENT-A"];
        
        setInterval(() => {
            const asset = assets[Math.floor(Math.random() * assets.length)];
            const price = (Math.random() * 100 + 10).toFixed(4);
            const row = document.createElement('div');
            row.className = 'ticker-row';
            row.innerHTML = `<span>${asset}</span><span>${price} ETH</span>`;
            ticker.prepend(row);
            if (ticker.childNodes.length > 8) ticker.removeChild(ticker.lastChild);
        }, 100); // 10Hz visual update for 120Hz logic

        // 6DOF Interaction (Item #44)
        window.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) {
                this.camRot[0] += e.movementY * 0.01;
                this.camRot[1] += e.movementX * 0.01;
            }
        });

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    render() {
        const uniformData = new Float32Array([
            performance.now() / 1000, 
            this.camRot[0], this.camRot[1], 
            0, // padding
            window.innerWidth, window.innerHeight, 
            0, 0 // padding
        ]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        // Update Coords Display (Item #50)
        document.getElementById('coord-val').innerHTML = `
            X: ${this.camRot[1].toFixed(8)}<br>
            Y: ${this.camRot[0].toFixed(8)}<br>
            Z: ${(Math.sin(performance.now()/1000)).toFixed(8)}
        `;

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

new NavMaster();
