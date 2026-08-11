/**
 * WebGPU Galaxy N-Body Simulation
 * 
 * Uses Compute Shaders to calculate gravitational N-Body interactions 
 * for up to 1,000,000 particles in real-time.
 */

// --- Configuration ---
const CONFIG = {
    initialParticleCount: 50000,
    maxParticleCount: 1000000,
    workgroupSize: 64,
};

// --- WGSL Shaders ---

const COMPUTE_SHADER_CODE = `
struct Params {
    deltaTime: f32,
    gravity: f32,
    damping: f32,
    mousePos: vec2<f32>,
    mouseActive: u32,
    time: f32,
};

struct Particle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    mass: f32,
    color: f32, // packed color
};

struct Particles {
    particles: array<Particle>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> inputParticles : Particles;
@group(0) @binding(2) var<storage, read_write> outputParticles : Particles;

// Simple pseudo-random for initial burst
fn rand(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(${CONFIG.workgroupSize})
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let index = GlobalInvocationID.x;
    if (index >= arrayLength(&inputParticles.particles)) {
        return;
    }

    var p = inputParticles.particles[index];

    // --- Physics Calculation ---
    
    // 1. Center attraction (Galaxy Core)
    let center = vec2<f32>(0.0, 0.0);
    let toCenter = center - p.pos;
    let distToCenter = length(toCenter);
    let dirToCenter = normalize(toCenter);
    
    // Spiral Galaxy Force (Tangential)
    let tangent = vec2<f32>(-dirToCenter.y, dirToCenter.x);
    
    // Force accumulation
    var force = dirToCenter * (1000.0 / (distToCenter * distToCenter + 100.0)) * params.gravity;
    
    // Rotation force (makes it spiral)
    if (distToCenter > 0.1) {
        force = force + tangent * (50.0 / (distToCenter + 1.0)) * params.gravity;
    }

    // 2. Mouse Interaction (Black Hole effect)
    if (params.mouseActive > 0u) {
        let toMouse = params.mousePos - p.pos;
        let distMouse = length(toMouse);
        if (distMouse < 0.5) {
            force = force + normalize(toMouse) * (5000.0 / (distMouse * distMouse + 0.01));
        }
    }

    // 3. Integration (Euler)
    p.vel = p.vel + force * params.deltaTime;
    p.vel = p.vel * params.damping; // Friction
    p.pos = p.pos + p.vel * params.deltaTime;

    // 4. Color Update based on velocity
    let speed = length(p.vel);
    // Map speed to color (simple heat map logic)
    // In shader we store color as float, fragment shader unpacks it? 
    // Simplified: Just update position/velocity here.

    outputParticles.particles[index] = p;
}
`;

const DRAW_SHADER_CODE = `
struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) color : vec4<f32>,
    @location(1) uv : vec2<f32>,
};

struct Particle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    mass: f32,
    color: f32,
};

struct Particles {
    particles: array<Particle>,
};

struct Params {
    deltaTime: f32,
    gravity: f32,
    damping: f32,
    mousePos: vec2<f32>,
    mouseActive: u32,
    time: f32,
    screenSize: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params : Params;
@group(0) @binding(1) var<storage, read> particles : Particles;

@vertex
fn vs_main(
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex : u32
) -> VertexOutput {
    let p = particles.particles[instanceIndex];

    // Billboard quad vertices
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );
    
    let quadPos = pos[vertexIndex];
    let particleSize = 0.003 * max(0.5, p.mass); // Scale by mass

    // Aspect ratio correction
    let aspect = params.screenSize.x / params.screenSize.y;
    let finalPos = vec2<f32>(
        p.pos.x + quadPos.x * particleSize / aspect, // X correction? No, usually divide Y by input aspect.
        p.pos.y + quadPos.y * particleSize 
    );
    
    // Fix Aspect Ratio: we want -1..1 logic.
    // Let's assume simulation is in -1..1 space essentially, but camera can zoom.
    // For now, simpler mapping:
    var glPos = vec4<f32>(finalPos, 0.0, 1.0);
    // Correct aspect on global position
    if (params.screenSize.x > params.screenSize.y) {
        glPos = vec4<f32>(finalPos.x / (params.screenSize.x / params.screenSize.y), finalPos.y, 0.0, 1.0);
    } else {
         glPos = vec4<f32>(finalPos.x, finalPos.y * (params.screenSize.x / params.screenSize.y), 0.0, 1.0);
    }

    var output : VertexOutput;
    output.Position = glPos;
    output.uv = quadPos; // -1 to 1

    // Color based on velocity/distance
    let speed = length(p.vel);
    let dist = length(p.pos);
    
    // Core color (warm/white) -> Edge color (blue/purple)
    var col = vec3<f32>(1.0, 0.8, 0.6); // Default core star
    if (dist > 0.3) { col = vec3<f32>(0.6, 0.8, 1.0); } // Blue giants
    if (dist > 0.6) { col = vec3<f32>(0.8, 0.4, 0.8); } // Outer rim dust
    
    output.color = vec4<f32>(col, 1.0);
    return output;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>, @location(1) uv : vec2<f32>) -> @location(0) vec4<f32> {
    // Circle SDF
    let dist = length(uv);
    let alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    if (dist > 1.0) { discard; }
    
    // Glowy center
    let glow = exp(-dist * 3.0);
    return vec4<f32>(color.rgb * 1.5, alpha * glow);
}
`;

// --- Main Class ---

class GalaxySim {
    constructor() {
        this.canvas = document.getElementById('galaxy-canvas');
        this.adapter = null;
        this.device = null;
        this.context = null;

        // Simulation State
        this.particleCount = CONFIG.initialParticleCount;
        this.isPlaying = true;
        this.params = {
            gravity: 1.0,
            damping: 0.99,
            mouseActive: 0,
            mousePos: [0, 0],
            time: 0,
            timeScale: 1.0,
            screenSize: [window.innerWidth, window.innerHeight]
        };

        // WebGPU Objects
        this.particleBuffers = []; // [bufferA, bufferB] (Pong-Ping)
        this.uniformBuffer = null;
        this.computePipeline = null;
        this.renderPipeline = null;
        this.bindGroups = []; // [computeGroupA, computeGroupB]
        this.renderBindGroup = null; // Only needs uniforms?

        this.step = 0; // 0 or 1 for ping-pong variables

        this.init();
    }

    async init() {
        if (!navigator.gpu) {
            document.getElementById('error-overlay').style.display = 'block';
            return;
        }

        try {
            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter) throw new Error('No GPU adapter found');

            // Check for limits (optional, but good for heavy sims)
            // const limits = this.adapter.limits;

            this.device = await this.adapter.requestDevice();

            this.context = this.canvas.getContext('webgpu');
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: format,
                alphaMode: 'premultiplied',
            });

            this.initParticles();
            this.initPipelines(format);
            this.setupUI();

            document.getElementById('gpu-status').textContent = 'ONLINE';
            document.getElementById('gpu-status').style.color = '#00ff00';
            document.getElementById('gpu-status').style.background = 'rgba(0, 255, 0, 0.2)';

            this.animate();

        } catch (e) {
            console.error('WebGPU Init Failed:', e);
            document.getElementById('error-overlay').style.display = 'block';
            document.getElementById('error-overlay').querySelector('p').textContent = e.message;
        }
    }

    initParticles() {
        // Particle Struct: vec2 pos, vec2 vel, f32 mass, f32 color => 6 floats = 24 bytes
        // Align to 32 bytes for safety? No, storage buffer stride just needs to match WGSL.
        // WGSL struct alignment rules... vec2 is 8 bytes.
        // pos(8), vel(8), mass(4), color(4) = 24 bytes.
        // Padded to 32 bytes usually? Let's check.
        // vec2<f32> alignment is 8.
        // offset 0: pos
        // offset 8: vel
        // offset 16: mass
        // offset 20: color
        // size: 24.

        const particleSize = 6 * 4; // 6 floats
        const totalSize = this.particleCount * particleSize;

        const data = new Float32Array(this.particleCount * 6);

        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 6;

            // Initial position: Spiral Galaxy Distribution
            // Random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const armOffset = Math.random() * 0.5; // Spread of arms
            const dist = Math.random(); // 0 to 1

            // 3 Arms
            const arm = Math.floor(Math.random() * 3);
            const finalAngle = angle + (arm * (Math.PI * 2 / 3)); // ?

            // Actually, simpler spiral:
            // angle = dist * factor
            const spiralAngle = dist * 10.0 + (i % 3) * (Math.PI * 2 / 3);

            const r = dist * 5.0; // Spread particles across larger radius
            data[idx] = Math.cos(spiralAngle) * r; // x
            data[idx + 1] = Math.sin(spiralAngle) * r * 0.5; // y (flatter) but logic fixes aspect

            // Velocity: Tangential for orbit
            // v = sqrt(GM/r) roughly
            const speed = 0.5 / (Math.sqrt(r) + 0.1);
            data[idx + 2] = -Math.sin(spiralAngle) * speed; // vx
            data[idx + 3] = Math.cos(spiralAngle) * speed; // vy

            data[idx + 4] = Math.random() * 0.5 + 0.5; // mass
            data[idx + 5] = Math.random(); // color seed
        }

        // Create TWO buffers for Ping-Pong simulation
        this.particleBuffers = [
            this.device.createBuffer({
                size: totalSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            }),
            this.device.createBuffer({
                size: totalSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
        ];

        new Float32Array(this.particleBuffers[0].getMappedRange()).set(data);
        this.particleBuffers[0].unmap();

        // Uniform Buffer
        // Params struct: 
        // deltaTime(4), gravity(4), damping(4), mousePos(8), mouseActive(4), time(4), screenSize(8)
        // Layout:
        // 0: deltaTime (f32)
        // 4: gravity (f32)
        // 8: damping (f32)
        // 12: padding? vec2 alignment is 8. So next is 16.
        // 16: mousePos (vec2)
        // 24: mouseActive (u32)
        // 28: time (f32)
        // 32: screenSize (vec2)
        // Total: 40 bytes. Padded to 48?

        const uniformSize = 48; // Safe bet
        this.uniformBuffer = this.device.createBuffer({
            size: uniformSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Initial Uniform Upload
        this.updateUniforms(0.016);
    }

    updateUniforms(dt) {
        const uniformData = new ArrayBuffer(48);
        const view = new DataView(uniformData);

        // deltaTime
        view.setFloat32(0, dt, true);
        // gravity
        view.setFloat32(4, this.params.gravity, true);
        // damping
        view.setFloat32(8, this.params.damping, true);

        // mousePos (alignment 8 -> offset 16?)
        // Let's verify strict WGSL layout rules.
        // float, float, float -> 12 bytes.
        // vec2 requires 8-byte alignment. So next available is 16. Correct.
        view.setFloat32(16, (this.params.mousePos[0] / window.innerWidth) * 2 - 1, true);
        view.setFloat32(20, -(this.params.mousePos[1] / window.innerHeight) * 2 + 1, true); // Flip Y

        // mouseActive (offset 24)
        view.setUint32(24, this.params.mouseActive, true);
        // time (offset 28)
        view.setFloat32(28, this.params.time, true);
        // screenSize (offset 32)
        view.setFloat32(32, window.innerWidth, true);
        view.setFloat32(36, window.innerHeight, true);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    initPipelines(format) {
        // --- Compute Pipeline ---
        const computeModule = this.device.createShaderModule({ code: COMPUTE_SHADER_CODE });

        this.computeBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }
            ]
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.computeBindGroupLayout] }),
            compute: { module: computeModule, entryPoint: 'main' }
        });

        // Initialize Bind Groups (One for A->B, One for B->A)
        this.bindGroups = [
            this.device.createBindGroup({
                layout: this.computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                layout: this.computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[0] } }
                ]
            })
        ];

        // --- Render Pipeline ---
        const drawModule = this.device.createShaderModule({ code: DRAW_SHADER_CODE });

        const renderBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }
            ]
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
            vertex: { module: drawModule, entryPoint: 'vs_main' },
            fragment: {
                module: drawModule, entryPoint: 'fs_main', targets: [{
                    format, blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, // Additive blending
                        alpha: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }
                    }
                }]
            },
            primitive: { topology: 'triangle-list' }
        });

        // Create Bind Groups for Rendering (Needs to know WHICH buffer is current source)
        // We actually need TWO render bind groups too, depending on which buffer holds the latest positions
        this.renderBindGroups = [
            this.device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } }
                ]
            }),
            this.device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } }
                ]
            })
        ];
    }

    setupUI() {
        // Sliders
        const gravitySlider = document.getElementById('gravity-slider');
        const gravityLabel = document.getElementById('gravity-label');

        if (gravitySlider && gravityLabel) {
            gravitySlider.addEventListener('input', (e) => {
                this.params.gravity = parseFloat(e.target.value);
                gravityLabel.textContent = this.params.gravity.toFixed(1);
            });
        }

        // Star Count (Requires Reset)
        const starCountSlider = document.getElementById('star-count-slider');
        const starCountLabel = document.getElementById('star-count-label');
        starCountSlider.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            starCountLabel.textContent = val.toLocaleString();
            this.particleCount = val;
            this.initParticles(); // Re-init
            // Re-create bind groups because particleBuffers changed
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.initPipelines(format);
        });
        starCountSlider.addEventListener('input', (e) => {
            starCountLabel.textContent = parseInt(e.target.value).toLocaleString();
        });

        // Time Dilation
        const timeSlider = document.getElementById('time-slider');
        const timeLabel = document.getElementById('time-label');
        timeSlider.addEventListener('input', (e) => {
            // We pass deltaTime to shader via uniforms. 
            // We can just scale dt in animate() or send a timeScale uniform.
            // Shader has 'deltaTime', let's scale what we send to updateUniforms.
            // But updateUniforms takes 'dt' as arg.
            // So we'll store timeScale in params.
            this.params.timeScale = parseFloat(e.target.value);
            timeLabel.textContent = this.params.timeScale.toFixed(1);
        });

        // Mouse interaction
        window.addEventListener('mousemove', (e) => {
            this.params.mousePos = [e.clientX, e.clientY];
        });
        window.addEventListener('mousedown', () => { this.params.mouseActive = 1; });
        window.addEventListener('mouseup', () => { this.params.mouseActive = 0; });

        // Resize
        window.addEventListener('resize', () => {
            this.params.screenSize = [window.innerWidth, window.innerHeight];
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // Need to recreate depth texture if used, but we don't use it.
            // Just update uniform.
        });
    }

    animate() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const dt = 0.016 * (this.params.timeScale || 1.0); // Apply Time Dilation
        this.params.time += dt;

        // Update Uniforms
        this.updateUniforms(dt);

        const commandEncoder = this.device.createCommandEncoder();

        // 1. Compute Pass
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.bindGroups[this.step]);
        computePass.dispatchWorkgroups(Math.ceil(this.particleCount / CONFIG.workgroupSize));
        computePass.end();

        // 2. Render Pass
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.renderPipeline);
        // Render the buffer we just computed INTO (destination of compute pass is valid for reading in next frame usually, but here...
        // Wait, Compute writes to outputParticles. That is bindGroup[step] binding 2.
        // Binding 2 in bindGroup[0] is particleBuffers[1].
        // So step 0 writes to Buffer 1.
        // We want to render Buffer 1.
        // renderBindGroups[0] binds Buffer 0. renderBindGroups[1] binds Buffer 1.
        // So we use renderBindGroups[1] if step was 0?
        // Let's trace:
        // Step 0: Input Buf0 -> Output Buf1.
        // We should draw Buf1? Or Buf0 (old frame)?
        // Drawing Buf1 (new frame) is better latency.
        // So if step 0, we draw Buf1 (which is renderBindGroups[1]).

        renderPass.setBindGroup(0, this.renderBindGroups[(this.step + 1) % 2]); // Use the OUTPUT buffer of current step
        renderPass.draw(6, this.particleCount, 0, 0); // 6 vertices per instance (quad), N instances
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        // Swap ping-pong step
        this.step = (this.step + 1) % 2;

        // UI Stats
        document.getElementById('particle-count').textContent = this.particleCount.toLocaleString();
        document.getElementById('compute-time').textContent = (performance.now() - now).toFixed(2) + 'ms';

        requestAnimationFrame(() => this.animate());
    }
}

// Start
new GalaxySim();
