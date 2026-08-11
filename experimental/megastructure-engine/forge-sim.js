/**
 * Type IV Civilization & Megastructure Forge
 * Implementation of Roadmap Items #4001 - #4100
 */

const FORGE_SHADER = `
struct Params {
    time: f32,
    shellProgress: f32,
    beamCharge: f32,
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
    let dist = length(uv);
    
    // --- Stellar Engine Core (#4001) ---
    var color = vec3<f32>(1.0, 0.8, 0.4) * (1.0 / (dist * 10.0 + 0.1));
    
    // --- Dyson Shell Segments (#4002) ---
    let grid = floor(uv * 20.0);
    let cell = hash(grid);
    if (dist > 0.5 && dist < 0.7 && cell < params.shellProgress) {
        color = vec3<f32>(0.2, 0.25, 0.3) * (dot(normalize(vec3<f32>(uv, 0.5)), vec3<f32>(1.0)) + 0.2);
    }
    
    // --- Nicoll-Dyson Beam Charge (#4005) ---
    if (params.beamCharge > 0.1 && abs(uv.x) < 0.05 * params.beamCharge) {
        color += vec3<f32>(1.0, 1.0, 1.0) * params.beamCharge;
    }

    return vec4<f32>(color, 1.0);
}
`;

class ForgeStation {
    constructor() {
        this.canvas = document.getElementById('forge-canvas');
        this.log = document.getElementById('forge-log');
        this.charge = 0.0;
        this.init();
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({ device: this.device, format: navigator.gpu.getPreferredCanvasFormat() });

        const shaderModule = this.device.createShaderModule({ code: FORGE_SHADER });
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

        window.fireBeam = () => {
            this.addLog("CHARGING NICOLL-DYSON BEAM (#4005)...");
            let interval = setInterval(() => {
                this.charge += 0.1;
                if (this.charge >= 1.0) {
                    clearInterval(interval);
                    this.addLog("BEAM FIRED: Target system desintegrated.");
                    setTimeout(() => this.charge = 0.0, 1000);
                }
            }, 100);
        };

        this.startTelemetry();
        this.render();
    }

    addLog(msg) {
        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        this.log.prepend(div);
    }

    startTelemetry() {
        setInterval(() => {
            const ms = ["Dyson Shell", "Ringworld", "Topopolis", "Space Elevator"][Math.floor(Math.random()*4)];
            this.addLog(`MAINTENANCE: ${ms} integrity check passed (#4032).`);
        }, 5000);
    }

    render() {
        const uniformData = new Float32Array([performance.now() / 1000, 0.84, this.charge, 0, window.innerWidth, window.innerHeight, 0, 0]);
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

new ForgeStation();
