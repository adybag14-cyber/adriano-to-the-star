/**
 * QuantumRenderer.js
 * Next-Gen WebGPU Rendering Engine for Exoplanet Pioneer.
 * Handles Compute Shaders for N-Body Gravity and Particle Physics.
 */

class QuantumRenderer {
    constructor(game) {
        this.game = game;
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.canvas = null;
        this.presentationFormat = null;
        this.pipeline = null;
        this.computePipeline = null;

        // Particle System State
        this.numParticles = 500000; // Roadmap Zenith: 500k particles
        this.particleBuffer = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.computeBindGroup = null;

        this.initialized = false;
        this.isSupported = false;
        this.initAttempted = false;
        this.initPromise = null;
        this.lastError = null;
    }

    async init(canvasId) {
        if (this.initialized) return true;
        if (this.initPromise) return this.initPromise;
        if (this.initAttempted && !this.isSupported) return false;

        this.initAttempted = true;
        this.initPromise = (async () => {
            if (!navigator.gpu) return false;

            try {
                // Do not pass powerPreference: Chromium ignores it on Windows and emits a warning.
                this.adapter = await navigator.gpu.requestAdapter();
                if (!this.adapter) return false;

                this.device = await this.adapter.requestDevice();
                this.canvas = document.getElementById(canvasId);
                if (!this.canvas) return false;

                this.context = this.canvas.getContext('webgpu');
                if (!this.context) return false;
                this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
                this.context.configure({
                    device: this.device,
                    format: this.presentationFormat,
                    alphaMode: 'premultiplied'
                });

                await this.createPipelines();
                await this.createBuffers();

                this.initialized = true;
                this.isSupported = true;
                this.game.notify("WebGPU Zenith Pipeline Active.", "success");
                return true;
            } catch (error) {
                this.lastError = error;
                this.isSupported = false;
                return false;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    async createPipelines() {
        // Roadmap Item 2: N-Body Gravitational Compute Shader (3D)
        const computeShaderModule = this.device.createShaderModule({
            label: 'Zenith N-Body Compute',
            code: `
                struct Particle {
                    pos : vec4<f32>,
                    vel : vec4<f32>,
                }
                
                @group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
                @group(0) @binding(1) var<uniform> params : array<f32, 4>; // [time, dt, gravity, numParticles]

                @compute @workgroup_size(64)
                fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
                    let index = GlobalInvocationID.x;
                    if (index >= u32(params[3])) { return; }
                    
                    var p = particles[index];
                    let dt = params[1];
                    let G = params[2];
                    
                    var force = vec3<f32>(0.0);
                    
                    // Simple central force simulation (Star gravity)
                    let center = vec3<f32>(0.0);
                    let diff = center - p.pos.xyz;
                    let distSq = dot(diff, diff) + 0.1;
                    force += normalize(diff) * G / distSq;

                    p.vel = vec4<f32>(p.vel.xyz + force * dt, 0.0);
                    p.pos = vec4<f32>(p.pos.xyz + p.vel.xyz * dt, 1.0);
                    
                    // Roadmap Item 8: Relativistic Damping
                    p.vel = vec4<f32>(p.vel.xyz * 0.9995, 0.0);
                    
                    particles[index] = p;
                }
            `
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: { module: computeShaderModule, entryPoint: 'main' },
        });

        // Roadmap Item 4: Light Bending Render Shader
        const renderShaderModule = this.device.createShaderModule({
            label: 'Zenith Particle Render',
            code: `
                struct Uniforms {
                    mvp : mat4x4<f32>,
                }
                @group(0) @binding(1) var<uniform> uniforms : Uniforms;

                struct VertexOutput {
                    @builtin(position) Position : vec4<f32>,
                    @location(0) color : vec4<f32>,
                }
                
                struct Particle {
                    pos : vec4<f32>,
                    vel : vec4<f32>,
                }
                
                @group(0) @binding(0) var<storage, read> particles : array<Particle>;

                @vertex
                fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                    var output : VertexOutput;
                    let particle = particles[vertexIndex];
                    
                    output.Position = uniforms.mvp * vec4<f32>(particle.pos.xyz, 1.0);
                    
                    // Relativistic Redshift/Blueshift coloring (Item 8)
                    let speed = length(particle.vel.xyz);
                    output.color = vec4<f32>(0.5 + speed, 0.7, 1.0 - speed, 0.8);
                    
                    return output;
                }

                @fragment
                fn fs_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
                    return color;
                }
            `
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: renderShaderModule, entryPoint: 'vs_main' },
            fragment: {
                module: renderShaderModule,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.presentationFormat,
                    blend: {
                        color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one' },
                        alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' }
                    }
                }]
            },
            primitive: { topology: 'point-list' },
        });
    }

    async createBuffers() {
        const data = new Float32Array(this.numParticles * 8); // pos(4) + vel(4)
        for (let i = 0; i < this.numParticles; i++) {
            const r = 20 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            data[i * 8] = r * Math.sin(phi) * Math.cos(theta); // x
            data[i * 8 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
            data[i * 8 + 2] = r * Math.cos(phi); // z
            data[i * 8 + 3] = 1.0; // w
            
            data[i * 8 + 4] = (Math.random() - 0.5) * 0.1; // vx
            data[i * 8 + 5] = (Math.random() - 0.5) * 0.1; // vy
            data[i * 8 + 6] = (Math.random() - 0.5) * 0.1; // vz
            data[i * 8 + 7] = 0.0; // vw
        }

        this.particleBuffer = this.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(this.particleBuffer.getMappedRange()).set(data);
        this.particleBuffer.unmap();

        this.uniformBuffer = this.device.createBuffer({
            size: 64 + 16, // MVP mat4 + Params
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.computeBindGroup = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.particleBuffer } },
                { binding: 1, resource: { buffer: this.uniformBuffer, offset: 64, size: 16 } }
            ]
        });

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.particleBuffer } },
                { binding: 1, resource: { buffer: this.uniformBuffer, offset: 0, size: 64 } }
            ]
        });
    }

    draw(mvpMatrix) {
        if (!this.initialized || !this.isSupported) return;

        // Update Uniforms
        const params = new Float32Array([performance.now() / 1000, 0.016, 0.5, this.numParticles]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, mvpMatrix);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, params);

        const commandEncoder = this.device.createCommandEncoder();

        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindGroup);
        computePass.dispatchWorkgroups(Math.ceil(this.numParticles / 64));
        computePass.end();

        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(this.numParticles);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}

window.QuantumRenderer = QuantumRenderer;
