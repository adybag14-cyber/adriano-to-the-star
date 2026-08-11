/**
 * WebGPU Raytracer Core - Phase 23 Upgrade
 * Features: Path Tracing, Dielectrics, Temporal Accumulation, DOF, WASD Camera
 */
class Raytracer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.pipeline = null;

        // Accumulation Buffers (Ping-Pong)
        this.textures = []; // [Texture A, Texture B]
        this.bindGroups = []; // [BindGroup A->B, BindGroup B->A]
        this.frameIndex = 0; // Current accumulation frame

        this.uniformBuffer = null;
        this.sphereBuffer = null;
        this.animId = null;
        this.startTime = Date.now();
        this.frameCount = 0; // Total render frames
        this.isRunning = true;
        this.isBenchmark = false;

        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };

        // Camera State - Position to see the solar system
        this.camera = {
            pos: { x: 25, y: 8, z: 15 }, // Elevated view looking towards the system
            yaw: -Math.PI * 0.75, // Looking towards Sun and planets
            pitch: -0.15 // Slight downward angle
        };

        // Params - Adjusted for space scene
        this.params = {
            bounces: 4,  // More bounces for better glass planet reflections
            samples: 1,
            light: 1.5,  // Slightly lower since sun is bright
            fov: 70,     // Wider FOV to see more of the scene
            aperture: 0.02, // Slight DOF for cinematic feel
            focusDist: 30.0,
            speed: 0.5,   // Faster movement for larger scene
            dayMode: 0,   // 0 = Space (dark), 1 = Daytime (bright sky)
            beastMode: false // High-quality path tracing mode
        };

        this.init().catch(e => {
            console.error('Critical Init Error:', e);
            const loader = document.getElementById('loader');
            if (loader) loader.textContent = `CRITICAL ERROR: ${e.message}`;
        });
        this.setupUI();
        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('mousedown', e => {
            this.mouse.down = true;
            this.canvas.requestPointerLock();
        });

        document.addEventListener('mouseup', () => this.mouse.down = false);

        document.addEventListener('mousemove', e => {
            if (document.pointerLockElement === this.canvas) {
                const sensitivity = 0.002;
                this.camera.yaw += e.movementX * sensitivity;
                this.camera.pitch -= e.movementY * sensitivity;
                // Clamp pitch
                this.camera.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.camera.pitch));
                this.resetAccumulation();
            }
        });
    }

    async init() {
        try {
            if (!navigator.gpu) {
                throw new Error("WebGPU is not supported in this browser.");
            }

            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter) {
                throw new Error("No appropriate GPU adapter found.");
            }

            this.device = await this.adapter.requestDevice();

            this.device.lost.then((info) => {
                console.error(`WebGPU device was lost: ${info.message}`);
                this.isRunning = false;
            });

            this.context = this.canvas.getContext('webgpu');
            this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

            this.context.configure({
                device: this.device,
                format: 'rgba8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
            });

            // Load Shader
            // Load Shader with cache busting
            const response = await fetch(`raytracer.wgsl?v=${Date.now()}`);
            if (!response.ok) throw new Error(`Failed to load shader: ${response.statusText}`);
            const shaderCode = await response.text();

            const shaderModule = this.device.createShaderModule({ code: shaderCode });

            // Compilation check
            const info = await shaderModule.getCompilationInfo();
            if (info.messages.some(msg => msg.type === 'error')) {
                const errors = info.messages.filter(msg => msg.type === 'error').map(msg => msg.message).join('\n');
                console.error(errors);
                // Display error in loader
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.style.display = 'block';
                    loader.innerText = "SHADER ERROR:\n" + errors;
                }
                throw new Error("Shader compilation error: " + errors);
            }

            // Create Ping-Pong Textures for Accumulation
            // We need storage capability for writing, texture binding for reading
            const texDesc = {
                size: [this.canvas.width, this.canvas.height],
                format: 'rgba32float',
                usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
            };

            this.textures = [
                this.device.createTexture(texDesc),
                this.device.createTexture(texDesc)
            ];

            // Scene setup - ADRIANO TO THE STAR: Solar System Theme
            // Structure: Center(3), Radius(1) | Color(3), Mat(1) | Roughness(1), Pad(3)
            // Stride: 12 floats (48 bytes)
            // Materials: 0=Lambert, 1=Metal, 2=Emissive, 3=Dielectric
            const sphereFloats = [
                // ===================== THE SUN =====================
                // Giant emissive golden sun at center
                0, 0, -25, 8.0,  // Center, radius
                15.0, 12.0, 4.0, 2 /*Emissive*/, 0.0, 0, 0, 0,

                // ===================== INNER PLANETS =====================
                // Mercury - Small rocky metal planet
                12, 1, -20, 0.4,
                0.6, 0.55, 0.5, 1 /*Metal*/, 0.2, 0, 0, 0,

                // Venus - Hot cloudy planet (yellowish reflection)
                15, -0.5, -15, 0.9,
                0.95, 0.8, 0.5, 0 /*Lambert*/, 0.0, 0, 0, 0,

                // EARTH - Our beautiful blue marble with oceans (glass-like atmosphere)
                18, 0, -8, 1.0,
                0.2, 0.5, 0.9, 3 /*Dielectric - glass atmosphere*/, 0.0, 0, 0, 0,

                // Earth's Moon - Orbiting Earth
                19.5, 0.8, -6.5, 0.27,
                0.85, 0.85, 0.85, 0 /*Lambert*/, 0.0, 0, 0, 0,

                // Mars - The Red Planet (rusty metal)
                22, -0.3, -2, 0.6,
                0.9, 0.3, 0.15, 1 /*Metal*/, 0.4, 0, 0, 0,

                // Phobos (Mars moon)
                23, 0.5, -1.5, 0.1,
                0.5, 0.4, 0.35, 0 /*Lambert*/, 0.0, 0, 0, 0,

                // ===================== ASTEROID BELT (scattered small spheres) =====================
                25, 0.2, 2, 0.08, 0.4, 0.35, 0.3, 0, 0.5, 0, 0, 0,
                26, -0.1, 3, 0.06, 0.5, 0.45, 0.4, 0, 0.5, 0, 0, 0,
                24, 0.3, 4, 0.1, 0.45, 0.4, 0.35, 1, 0.8, 0, 0, 0,
                27, -0.2, 2.5, 0.07, 0.55, 0.5, 0.45, 0, 0.5, 0, 0, 0,

                // ===================== GAS GIANTS =====================
                // Jupiter - Giant orange/brown bands (metallic reflective)
                35, 0.5, 12, 4.0,
                0.85, 0.6, 0.4, 1 /*Metal*/, 0.1, 0, 0, 0,

                // Io (Jupiter moon - volcanic)
                38, 2, 10, 0.3,
                0.95, 0.85, 0.3, 2 /*Emissive - volcanic*/, 0.0, 0, 0, 0,

                // Europa (Jupiter moon - icy)
                33, -1.5, 14, 0.25,
                0.9, 0.95, 1.0, 3 /*Dielectric - icy*/, 0.0, 0, 0, 0,

                // Saturn - Gorgeous ringed planet (golden metal)
                48, -1, 25, 3.5,
                0.95, 0.85, 0.55, 1 /*Metal*/, 0.05, 0, 0, 0,

                // Saturn's ring particles (simulated)
                48, -1.05, 21, 0.15, 0.8, 0.75, 0.6, 1, 0.6, 0, 0, 0,
                48, -0.95, 29, 0.12, 0.85, 0.8, 0.65, 1, 0.6, 0, 0, 0,
                44, -1.0, 25, 0.1, 0.75, 0.7, 0.55, 1, 0.6, 0, 0, 0,
                52, -1.0, 25, 0.13, 0.9, 0.85, 0.7, 1, 0.6, 0, 0, 0,

                // Titan (Saturn moon - hazy orange)
                52, 0.5, 28, 0.5,
                0.9, 0.6, 0.3, 0 /*Lambert - hazy*/, 0.0, 0, 0, 0,

                // ===================== ICE GIANTS =====================
                // Uranus - Blue-green ice giant
                60, 2, 40, 2.0,
                0.5, 0.8, 0.85, 3 /*Dielectric*/, 0.0, 0, 0, 0,

                // Neptune - Deep blue
                70, -3, 55, 1.8,
                0.2, 0.3, 0.9, 3 /*Dielectric*/, 0.0, 0, 0, 0,

                // Triton (Neptune moon)
                72, -1.5, 53, 0.25,
                0.85, 0.9, 0.95, 1 /*Metal - icy*/, 0.3, 0, 0, 0,

                // ===================== DISTANT STARS (small emissive) =====================
                // Background stars scattered around
                -50, 30, -80, 0.5, 10, 10, 12, 2, 0, 0, 0, 0,  // Blue star
                40, 45, -100, 0.4, 12, 8, 4, 2, 0, 0, 0, 0,   // Orange star
                -30, -25, -90, 0.3, 12, 12, 10, 2, 0, 0, 0, 0, // White star
                60, 35, -85, 0.35, 14, 6, 6, 2, 0, 0, 0, 0,   // Red star
                -45, 50, -95, 0.45, 8, 10, 14, 2, 0, 0, 0, 0,  // Blue star
                55, -40, -88, 0.25, 15, 15, 12, 2, 0, 0, 0, 0, // Bright white
                -60, -35, -92, 0.3, 10, 12, 14, 2, 0, 0, 0, 0, // Bluish
                70, 25, -78, 0.28, 14, 10, 6, 2, 0, 0, 0, 0,  // Yellow star

                // ===================== NEBULA PARTICLES (colored gas clouds) =====================
                -20, 15, -50, 1.5, 0.3, 0.1, 0.4, 0 /*Lambert nebula*/, 0.0, 0, 0, 0,
                -25, 18, -55, 1.2, 0.4, 0.15, 0.5, 0, 0.0, 0, 0, 0,
                15, -20, -60, 1.8, 0.5, 0.2, 0.3, 0, 0.0, 0, 0, 0,

                // ===================== COMET (glass with bright tail) =====================
                -8, 5, 5, 0.3,
                0.9, 0.95, 1.0, 3 /*Dielectric - icy comet*/, 0.0, 0, 0, 0,
                // Comet tail particles
                -9, 5.3, 6, 0.08, 8, 8, 10, 2 /*Emissive tail*/, 0, 0, 0, 0,
                -10, 5.5, 7, 0.06, 6, 6, 8, 2, 0, 0, 0, 0,
                -11, 5.7, 8, 0.04, 4, 4, 6, 2, 0, 0, 0, 0,
            ];

            // Add random distant stars
            for (let i = 0; i < 25; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI - Math.PI / 2;
                const dist = 70 + Math.random() * 40;
                const x = Math.cos(theta) * Math.cos(phi) * dist;
                const y = Math.sin(phi) * dist * 0.3 + (Math.random() - 0.5) * 20;
                const z = Math.sin(theta) * Math.cos(phi) * dist - 80;
                const r = Math.random() * 0.2 + 0.1;
                // Star colors: blue, white, yellow, orange, red
                const starColors = [
                    [10, 12, 15], // Blue
                    [14, 14, 14], // White
                    [15, 14, 8],  // Yellow
                    [15, 10, 5],  // Orange
                    [15, 6, 6],   // Red
                ];
                const col = starColors[Math.floor(Math.random() * starColors.length)];
                sphereFloats.push(
                    x, y, z, r,
                    col[0], col[1], col[2],
                    2, // Emissive
                    0.0,
                    0, 0, 0
                );
            }

            // Create Buffer with correct types
            const bufferSize = sphereFloats.length * 4;
            this.sphereBuffer = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });

            const mappedRange = this.sphereBuffer.getMappedRange();
            const floatView = new Float32Array(mappedRange);
            const uintView = new Uint32Array(mappedRange);

            // Fill data
            for (let i = 0; i < sphereFloats.length; i++) {
                // Sphere struct: Indices 7, 19, 31... are MaterialType (u32)
                if ((i % 12) === 7) {
                    uintView[i] = Math.round(sphereFloats[i]);
                } else {
                    floatView[i] = sphereFloats[i];
                }
            }
            this.sphereBuffer.unmap();

            // Uniform Buffer
            // Size must be 16-byte aligned.
            // floats: res(2), time(1), pad(1) -> 16
            // vec3 camPos(3), pad(1) -> 16
            // vec3 camDir(3), pad(1) -> 16
            // u32: bounces, samples, light, fov -> 16
            // f32 seed, u32 frame, f32 aperture, f32 focusDist -> 16 
            // Total: 80 bytes
            this.uniformBuffer = this.device.createBuffer({
                size: 176, // Safety margin for dayMode uniform
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });

            // Pipeline Layout
            const bindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float' } }, // Float Acc
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },

                ]
            });

            // Save layout for render loop dynamic binding
            this.bindGroupLayout = bindGroupLayout;

            // --- Presentation Pipeline (Tone Mapping) ---
            const presentResponse = await fetch(`present.wgsl?v=${Date.now()}`);
            if (!presentResponse.ok) throw new Error("Failed to load present shader");
            const presentCode = await presentResponse.text();
            const presentModule = this.device.createShaderModule({ code: presentCode });

            const presentBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } },
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } }
                ]
            });
            this.presentBGLayout = presentBindGroupLayout;

            this.presentPipeline = this.device.createRenderPipeline({
                layout: this.device.createPipelineLayout({ bindGroupLayouts: [presentBindGroupLayout] }),
                vertex: { module: presentModule, entryPoint: 'vs_main' },
                fragment: { module: presentModule, entryPoint: 'fs_main', targets: [{ format: 'rgba8unorm' }] },
                primitive: { topology: 'triangle-list' }
            });

            this.sampler = this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest' });

            this.sampler = this.device.createSampler({ magFilter: 'nearest', minFilter: 'nearest' });

            // DEBUG: Capture Validation Errors
            this.device.pushErrorScope('validation');

            this.pipeline = this.device.createComputePipeline({
                layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
                compute: { module: shaderModule, entryPoint: 'main' }
            });

            this.device.popErrorScope().then((error) => {
                if (error) {
                    console.error("COMPUTE PIPELINE VALIDATION ERROR:", error.message);
                    const loader = document.getElementById('loader');
                    if (loader) loader.textContent = "Pipeline Error: " + error.message;
                } else {
                    console.log("Compute Pipeline Validated Successfully.");
                }
            });

            // Bind Groups are now created dynamically in render() to capture current canvas texture
            // this.bindGroups = ... removed

            // Hide loader on success
            const loader = document.getElementById('loader');
            if (loader) loader.style.display = 'none';

            this.render();

        } catch (e) {
            console.error("Initialization failed:", e);
            const loader = document.getElementById('loader');
            if (loader) {
                loader.textContent = "Error: " + e.message;
                loader.style.color = '#ef4444';
            }
        }
    }

    resetAccumulation() {
        this.frameIndex = 0;
    }

    updateCamera() {
        // WASD Movement
        const speed = this.params.speed;
        let moved = false;

        const forward = {
            x: Math.cos(this.camera.yaw) * Math.cos(this.camera.pitch),
            y: Math.sin(this.camera.pitch),
            z: Math.sin(this.camera.yaw) * Math.cos(this.camera.pitch)
        };

        const right = {
            x: Math.cos(this.camera.yaw - Math.PI / 2),
            y: 0,
            z: Math.sin(this.camera.yaw - Math.PI / 2)
        };

        if (this.keys['w']) {
            this.camera.pos.x += forward.x * speed;
            this.camera.pos.y += forward.y * speed;
            this.camera.pos.z += forward.z * speed;
            moved = true;
        }
        if (this.keys['s']) {
            this.camera.pos.x -= forward.x * speed;
            this.camera.pos.y -= forward.y * speed;
            this.camera.pos.z -= forward.z * speed;
            moved = true;
        }
        if (this.keys['a']) {
            this.camera.pos.x -= right.x * speed;
            this.camera.pos.z -= right.z * speed;
            moved = true;
        }
        if (this.keys['d']) {
            this.camera.pos.x += right.x * speed;
            this.camera.pos.z += right.z * speed;
            moved = true;
        }
        if (this.keys['q']) { this.camera.pos.y -= speed; moved = true; }
        if (this.keys['e']) { this.camera.pos.y += speed; moved = true; }

        if (moved) this.resetAccumulation();

        return forward;
    }

    render() {
        if (!this.isRunning) return;

        const forward = this.updateCamera();

        // Update Uniforms
        const uniformData = new Float32Array(44); // Extra space for dayMode
        uniformData[0] = this.canvas.width;
        uniformData[1] = this.canvas.height;
        uniformData[2] = (Date.now() - this.startTime) / 1000;
        // Pad

        uniformData[4] = this.camera.pos.x;
        uniformData[5] = this.camera.pos.y;
        uniformData[6] = this.camera.pos.z;
        // Pad

        uniformData[8] = forward.x;
        uniformData[9] = forward.y;
        uniformData[10] = forward.z;
        // Pad

        // u32 params as float bits
        const u32View = new Uint32Array(uniformData.buffer);

        // Apply beast mode overrides
        const effectiveBounces = this.params.beastMode ? Math.max(this.params.bounces, 8) : this.params.bounces;
        const effectiveSamples = this.params.beastMode ? Math.max(this.params.samples, 4) : this.params.samples;

        u32View[12] = effectiveBounces;
        u32View[13] = effectiveSamples;

        uniformData[14] = this.params.light;
        uniformData[15] = this.params.fov;

        uniformData[16] = Math.random();
        u32View[17] = this.frameIndex;
        uniformData[18] = this.params.aperture;
        uniformData[19] = this.params.focusDist;

        // dayMode at index 20 (needs to align to u32)
        u32View[20] = this.params.dayMode;

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        // Ping Pong Logic
        const bgIndex = this.frameIndex % 2;
        const targetTexture = this.textures[bgIndex];     // Write Target (Float)
        const sourceTexture = this.textures[(bgIndex + 1) % 2]; // Read Source (Float)

        const commandEncoder = this.device.createCommandEncoder();

        // 1. Compute Pass (Raytracing)
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.pipeline);

        // Bind Group for Compute
        const computeBindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                { binding: 0, resource: targetTexture.createView() },
                { binding: 1, resource: { buffer: this.uniformBuffer } },
                { binding: 2, resource: { buffer: this.sphereBuffer } },
                { binding: 3, resource: sourceTexture.createView() }
            ]
        });

        computePass.setBindGroup(0, computeBindGroup);
        computePass.dispatchWorkgroups(Math.ceil(this.canvas.width / 8), Math.ceil(this.canvas.height / 8));
        computePass.end();

        // 2. Render Pass (Presentation / Tone Mapping)
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: 'clear',
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.presentPipeline);

        // Bind Group for Present (Accum Texture + Sampler)
        const presentBindGroup = this.device.createBindGroup({
            layout: this.presentBGLayout,
            entries: [
                { binding: 0, resource: targetTexture.createView() },
                { binding: 1, resource: this.sampler }
            ]
        });

        renderPass.setBindGroup(0, presentBindGroup);
        renderPass.draw(3, 1, 0, 0); // Full Screen Tri
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        this.frameIndex++;
        this.frameCount++;

        // Update stats
        const fps = Math.round(1000 / (performance.now() - this.lastFrameTime || 1));
        this.lastFrameTime = performance.now();
        if (this.frameCount % 10 === 0) {
            document.getElementById('fps-counter').textContent = 'FPS: ' + fps;
            document.getElementById('sample-counter').textContent = (this.frameIndex * this.params.samples) + " samples";
        }

        this.animId = requestAnimationFrame(() => this.render());
    }

    setupUI() {
        const bind = (id, param, needsReset = true) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    this.params[param] = parseFloat(e.target.value);
                    if (document.getElementById('val-' + param)) {
                        document.getElementById('val-' + param).textContent = e.target.value;
                    }
                    if (needsReset) this.resetAccumulation();
                });
            }
        };
        bind('rays-bounces', 'bounces');
        bind('rays-samples', 'samples');
        bind('light-intensity', 'light');
        bind('camera-fov', 'fov');

        bind('cam-aperture', 'aperture');
        bind('cam-focus', 'focusDist');
        bind('cam-speed', 'speed', false); // Speed doesn't reset accum

        // Button Listeners
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportImage());
        }

        const btnBenchmark = document.getElementById('btn-benchmark');
        if (btnBenchmark) {
            btnBenchmark.addEventListener('click', () => this.runBenchmark());
        }

        const btnPause = document.getElementById('btn-toggle-anim');
        if (btnPause) {
            btnPause.addEventListener('click', () => this.togglePause(btnPause));
        }

        // Sky Mode Toggle Buttons
        const btnSpaceMode = document.getElementById('btn-space-mode');
        const btnDayMode = document.getElementById('btn-day-mode');

        if (btnSpaceMode) {
            btnSpaceMode.addEventListener('click', () => {
                this.params.dayMode = 0;
                btnSpaceMode.classList.add('primary');
                if (btnDayMode) btnDayMode.classList.remove('primary');
                this.resetAccumulation();
            });
        }

        if (btnDayMode) {
            btnDayMode.addEventListener('click', () => {
                this.params.dayMode = 1;
                btnDayMode.classList.add('primary');
                if (btnSpaceMode) btnSpaceMode.classList.remove('primary');
                this.resetAccumulation();
            });
        }

        // Beast Mode Toggle
        const btnBeastMode = document.getElementById('btn-beast-mode');
        const beastStatus = document.getElementById('beast-status');

        if (btnBeastMode) {
            btnBeastMode.addEventListener('click', () => {
                this.params.beastMode = !this.params.beastMode;

                if (this.params.beastMode) {
                    btnBeastMode.style.background = 'linear-gradient(135deg, #ff0000, #ff6b35)';
                    btnBeastMode.style.boxShadow = '0 0 20px rgba(255, 100, 50, 0.8)';
                    btnBeastMode.textContent = '🔥 BEAST MODE ACTIVE 🔥';
                    if (beastStatus) beastStatus.textContent = 'ON - 8 bounces, 4 samples per frame';
                    if (beastStatus) beastStatus.style.color = '#ff6b35';
                } else {
                    btnBeastMode.style.background = 'linear-gradient(135deg, #ff6b35, #f7931e)';
                    btnBeastMode.style.boxShadow = 'none';
                    btnBeastMode.textContent = '🔥 BEAST MODE (Path Tracing)';
                    if (beastStatus) beastStatus.textContent = 'Off - Click to enable 8 bounces, 4 samples';
                    if (beastStatus) beastStatus.style.color = '#666';
                }

                this.resetAccumulation();
            });
        }
    }

    togglePause(btn) {
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            btn.textContent = "PAUSE ANIMATION";
            this.lastFrameTime = performance.now();
            this.render();
        } else {
            btn.textContent = "RESUME ANIMATION";
            if (this.animId) cancelAnimationFrame(this.animId);
        }
    }

    async exportImage() {
        // WebGPU requires reading back from a texture via a staging buffer
        // toDataURL() does NOT work with WebGPU canvases
        try {
            const width = this.canvas.width;
            const height = this.canvas.height;

            // Create a buffer to read the texture into
            const bytesPerRow = Math.ceil(width * 4 / 256) * 256; // Align to 256 bytes
            const bufferSize = bytesPerRow * height;

            const readBuffer = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });

            // Copy the current texture to the read buffer
            const commandEncoder = this.device.createCommandEncoder();

            // Use the current display texture (the last one written to)
            const bgIndex = this.frameIndex % 2;
            const sourceTexture = this.textures[bgIndex];

            commandEncoder.copyTextureToBuffer(
                { texture: sourceTexture },
                { buffer: readBuffer, bytesPerRow: bytesPerRow },
                { width, height }
            );

            this.device.queue.submit([commandEncoder.finish()]);

            // Map and read the buffer
            await readBuffer.mapAsync(GPUMapMode.READ);
            const data = new Uint8Array(readBuffer.getMappedRange());

            // Create a 2D canvas to draw the image
            const canvas2D = document.createElement('canvas');
            canvas2D.width = width;
            canvas2D.height = height;
            const ctx = canvas2D.getContext('2d');

            const imageData = ctx.createImageData(width, height);

            // Copy data row by row (accounting for alignment padding)
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const srcIdx = y * bytesPerRow + x * 4;
                    const dstIdx = (y * width + x) * 4;
                    imageData.data[dstIdx] = data[srcIdx];     // R
                    imageData.data[dstIdx + 1] = data[srcIdx + 1]; // G
                    imageData.data[dstIdx + 2] = data[srcIdx + 2]; // B
                    imageData.data[dstIdx + 3] = data[srcIdx + 3]; // A
                }
            }

            ctx.putImageData(imageData, 0, 0);
            readBuffer.unmap();
            readBuffer.destroy();

            // Export as PNG
            const link = document.createElement('a');
            link.download = `raytrace-${Date.now()}.png`;
            link.href = canvas2D.toDataURL('image/png');
            link.click();

        } catch (e) {
            console.error("Export failed:", e);
            alert("Export failed: " + e.message);
        }
    }

    async runBenchmark() {
        if (this.isBenchmark) return;
        this.isBenchmark = true;
        this.isRunning = false; // Stop normal loop
        if (this.animId) cancelAnimationFrame(this.animId);

        const overlay = document.getElementById('benchmark-ui');
        if (overlay) overlay.style.display = 'block';

        // Reset
        this.frameIndex = 0;

        // Run specific number of frames (e.g., 60)
        // We can't use requestAnimationFrame for a blocking benchmark, but async loops are okay
        const totalFrames = 100;
        const start = performance.now();

        // Force parameters for standard benchmark
        const oldParams = { ...this.params };
        this.params.samples = 1;
        this.params.bounces = 5;
        this.params.fov = 60;

        // Custom Render Loop
        // We need to wait for GPU to finish each frame to be accurate?
        // Actually, just submit 100 frames to queue.

        for (let i = 0; i < totalFrames; i++) {
            await this.renderSingleFrameForBenchmark();
        }

        // Wait for queue to finish? WebGPU queue is asynchronous.
        await this.device.queue.onSubmittedWorkDone();

        const end = performance.now();
        const duration = (end - start) / 1000;
        const raysPerSec = (this.canvas.width * this.canvas.height * this.params.samples * this.params.bounces * totalFrames) / duration;
        const score = Math.round(raysPerSec / 1000); // K-Rays

        document.getElementById('bench-rays').textContent = Math.round(raysPerSec).toLocaleString();
        document.getElementById('bench-score').textContent = score.toLocaleString();

        this.params = oldParams;
        this.isBenchmark = false;

        // Don't auto resume, let user close
    }

    async renderSingleFrameForBenchmark() {
        // Stripped down version of render without UI updates
        // ... (Similar to render but just encoding)
        // For simplicity, we just call the logic block:

        const uniformData = new Float32Array(40);
        uniformData[0] = this.canvas.width;
        uniformData[1] = this.canvas.height;
        uniformData[2] = 0; // Fixed time
        uniformData[4] = this.camera.pos.x;
        uniformData[5] = this.camera.pos.y;
        uniformData[6] = this.camera.pos.z;
        uniformData[8] = 0; uniformData[9] = 0; uniformData[10] = -1; // Fixed look

        const u32View = new Uint32Array(uniformData.buffer);
        u32View[12] = this.params.bounces;
        u32View[13] = this.params.samples;
        uniformData[14] = 2.0; uniformData[15] = 60;
        uniformData[16] = Math.random();
        u32View[17] = this.frameIndex;
        uniformData[18] = 0; uniformData[19] = 10;

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        const bgIndex = this.frameIndex % 2;
        const currentBindGroup = this.bindGroups[bgIndex];

        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, currentBindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(this.canvas.width / 8), Math.ceil(this.canvas.height / 8));
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
        this.frameIndex++;
    }

}

window.startRaytracer = () => {
    window.raytracer = new Raytracer();
};

window.addEventListener('load', window.startRaytracer);
