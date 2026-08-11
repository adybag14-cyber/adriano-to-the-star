/**
 * Star System Builder (3D)
 * Interactive physics simulation where users build stable solar systems.
 * Upgraded with improved visuals and UI.
 */
class StarSystemBuilder {
    constructor(containerOrId) {
        if (typeof containerOrId === 'string') {
            this.container = document.getElementById(containerOrId);
        } else {
            this.container = containerOrId;
        }

        // Settings
        this.timeScale = 1.0;
        this.paused = false;

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.plane = null; // Invisible cursor plane

        // Game state
        this.bodies = [];
        this.isRunning = false;
        this.animationId = null;
        this.years = 0;
        this.G = 0.5;
        this.selectedType = 'planet-rocky';

        this.init();
    }

    init() {
        if (!this.container) return;

        // Ensure relative positioning
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';

        // 3D Setup
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 500;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.001);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
        this.camera.position.set(0, 300, 400);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2.1; // Don't allow going below ground
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Sun Light (Central point)
        const sunLight = new THREE.PointLight(0xffaa33, 2, 2000);
        sunLight.position.set(0, 0, 0);
        this.scene.add(sunLight);

        // Background Stars
        this.createStarfield();

        // Input Plane (y=0)
        const planeGeo = new THREE.PlaneGeometry(2000, 2000);
        planeGeo.rotateX(-Math.PI / 2);
        const planeMat = new THREE.MeshBasicMaterial({ visible: false });
        this.plane = new THREE.Mesh(planeGeo, planeMat);
        this.scene.add(this.plane);

        // Grid (Subtle)
        const grid = new THREE.GridHelper(1000, 50, 0x333333, 0x111111);
        grid.material.transparent = true;
        grid.material.opacity = 0.3;
        this.scene.add(grid);

        // Initial Star
        this.resetSystem();

        // UI
        this.createUI();

        // Events
        this.renderer.domElement.addEventListener('pointerdown', (e) => this.handleCanvasClick(e));

        // Resize
        const resizeObserver = new ResizeObserver(() => this.handleResize());
        resizeObserver.observe(this.container);

        this.start();
    }

    createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 3000;
        const posArray = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 1500;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMat = new THREE.PointsMaterial({
            size: 1.5,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        const stars = new THREE.Points(starGeo, starMat);
        this.scene.add(stars);
    }

    createUI() {
        const existingUi = this.container.querySelector('#ssb-ui');
        if (existingUi) existingUi.remove();

        const ui = document.createElement('div');
        ui.id = 'ssb-ui';
        ui.innerHTML = `
            <div class="ssb-panel ssb-header">
                <h3 class="ssb-title">Star System Architect</h3>
                <p class="ssb-instructions">
                    Place bodies in orbit. Maintain stability.<br>
                    <span style="font-size:0.8rem; color:#888;">Drag to rotate camera. Scroll to zoom.</span>
                </p>
                
                <div class="ssb-controls">
                    <select id="ssb-body-type" class="ssb-select">
                        <option value="planet-rocky">🪨 Rocky Planet</option>
                        <option value="planet-gas">🟠 Gas Giant</option>
                        <option value="planet-ice">❄️ Ice Giant</option>
                        <option value="star-dwarf">✨ Dwarf Star</option>
                    </select>
                    
                    <button id="ssb-pause" class="ssb-btn ssb-btn-action">⏸️ Pause</button>
                    <button id="ssb-reset" class="ssb-btn ssb-btn-danger">↺ Reset</button>
                </div>
            </div>

            <div class="ssb-stats-bar">
                <div class="ssb-stat-item">
                    <span>System Age</span>
                    <span class="ssb-stat-value" id="ssb-age">0 years</span>
                </div>
                <div class="ssb-stat-item">
                    <span>Objects</span>
                    <span class="ssb-stat-value" id="ssb-count">1</span>
                </div>
            </div>

            <div class="ssb-hint">Tip: Click anywhere on the grid to place objects!</div>
        `;

        this.container.appendChild(ui);

        // Bind events
        this.container.querySelector('#ssb-body-type').addEventListener('change', (e) => {
            this.selectedType = e.target.value;
        });

        this.container.querySelector('#ssb-reset').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent placement
            this.resetSystem();
        });

        this.container.querySelector('#ssb-pause').addEventListener('click', (e) => {
            e.stopPropagation();
            this.paused = !this.paused;
            e.target.textContent = this.paused ? '▶️ Resume' : '⏸️ Pause';
        });

        // Prevent click-through on UI panels
        ui.querySelectorAll('.ssb-panel').forEach(panel => {
            panel.addEventListener('pointerdown', e => e.stopPropagation());
        });
    }

    resetSystem() {
        // Clear bodies
        this.bodies.forEach(b => {
            this.scene.remove(b.mesh);
            if (b.trail) this.scene.remove(b.trail);

            b.mesh.geometry.dispose();
            b.mesh.material.dispose();
        });
        this.bodies = [];
        this.years = 0;

        // Central Star
        this.addBody({
            x: 0, z: 0,
            vx: 0, vz: 0,
            mass: 1000,
            radius: 15,
            color: 0xffaa33,
            type: 'star',
            fixed: true,
            emissive: 2.0
        });

        // Add glow sprite for sun
        if (!this.sunGlow) {
            const spriteMat = new THREE.SpriteMaterial({
                color: 0xffaa33,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            this.sunGlow = new THREE.Sprite(spriteMat);
            this.sunGlow.scale.set(60, 60, 1);
            this.scene.add(this.sunGlow);
        }

        this.updateStats();
    }

    addBody(props) {
        let geometry, material;

        if (props.type === 'star') {
            geometry = new THREE.SphereGeometry(props.radius, 32, 32);
            material = new THREE.MeshBasicMaterial({ color: props.color });
        } else {
            geometry = new THREE.SphereGeometry(props.radius, 32, 32);
            material = new THREE.MeshStandardMaterial({
                color: props.color,
                roughness: 0.8,
                metalness: 0.1
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(props.x, 0, props.z);
        mesh.userData = { id: Math.random() }; // for raycasting
        this.scene.add(mesh);

        // Trail
        const trailGeo = new THREE.BufferGeometry();
        // pre-allocate max trail length
        const maxPoints = 500;
        const positions = new Float32Array(maxPoints * 3);
        trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeo.setDrawRange(0, 0);

        const trailMat = new THREE.LineBasicMaterial({
            color: props.color,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const trail = new THREE.Line(trailGeo, trailMat);
        this.scene.add(trail);

        const body = {
            mesh: mesh,
            trail: trail,
            trailPoints: [],
            trailIdx: 0,
            x: props.x,
            z: props.z,
            vx: props.vx,
            vz: props.vz,
            mass: props.mass,
            radius: props.radius,
            fixed: props.fixed
        };
        this.bodies.push(body);

        this.updateStats();
        return body;
    }

    handleCanvasClick(e) {
        if (!this.isRunning) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.plane);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            // Auto-calculate orbital velocity
            const center = this.bodies.find(b => b.fixed);
            let vx = 0, vz = 0;

            if (center) {
                const dx = point.x - center.x;
                const dz = point.z - center.z;
                const r = Math.sqrt(dx * dx + dz * dz);
                const v = Math.sqrt((this.G * center.mass) / r);

                // Perpendicular vector for circular orbit
                vx = (dz / r) * v;
                vz = -(dx / r) * v;

                // Randomize direction slightly for fun
                // vz *= (Math.random() > 0.5 ? 1 : -1); 
                // Wait, solar system usually goes one way
            }

            const props = {
                x: point.x, z: point.z,
                vx: vx, vz: vz,
                fixed: false
            };

            switch (this.selectedType) {
                case 'planet-rocky':
                    props.mass = 15;
                    props.radius = 4;
                    props.color = 0x94a3b8;
                    break;
                case 'planet-gas':
                    props.mass = 80;
                    props.radius = 10;
                    props.color = 0xd97706;
                    break;
                case 'planet-ice':
                    props.mass = 40;
                    props.radius = 8;
                    props.color = 0x60a5fa;
                    break;
                case 'star-dwarf':
                    props.mass = 300;
                    props.radius = 12;
                    props.color = 0xef4444;
                    break;
            }

            this.addBody(props);
        }
    }

    updateStats() {
        const countEl = this.container.querySelector('#ssb-count');
        if (countEl) countEl.textContent = this.bodies.length;
    }

    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight || 500;

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }

    loop() {
        if (!this.isRunning || !this.renderer) return;

        this.update();
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);

        this.animationId = requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.paused) return;

        // Physics step (XZ plane)
        // Sub-step for better stability
        const steps = 2;
        const dt = 1.0 / steps;

        for (let s = 0; s < steps; s++) {
            for (let i = 0; i < this.bodies.length; i++) {
                const bodyA = this.bodies[i];
                if (bodyA.fixed) continue;

                for (let j = 0; j < this.bodies.length; j++) {
                    if (i === j) continue;
                    const bodyB = this.bodies[j];

                    const dx = bodyB.x - bodyA.x;
                    const dz = bodyB.z - bodyA.z;
                    const distSq = dx * dx + dz * dz;
                    const dist = Math.sqrt(distSq);

                    if (dist < 5) continue; // Minimal distance clamp

                    const force = (this.G * bodyA.mass * bodyB.mass) / distSq;
                    const ax = (force * dx / dist) / bodyA.mass;
                    const az = (force * dz / dist) / bodyA.mass;

                    bodyA.vx += ax * dt;
                    bodyA.vz += az * dt;
                }
            }

            // Move
            for (let i = 0; i < this.bodies.length; i++) {
                const b = this.bodies[i];
                if (!b.fixed) {
                    b.x += b.vx * dt;
                    b.z += b.vz * dt;
                }
            }
        }

        // Visual Sync
        this.bodies.forEach(b => {
            b.mesh.position.x = b.x;
            b.mesh.position.z = b.z;

            // Trail update (every few frames)
            if (!b.fixed && Math.floor(this.years * 100) % 5 === 0) {
                this.updateTrail(b);
            }
        });

        // Update Stats
        this.years += 0.05 * this.timeScale;
        const ageEl = this.container.querySelector('#ssb-age');
        if (ageEl && Math.floor(this.years) % 1 === 0) {
            ageEl.textContent = `${Math.floor(this.years)} years`;
        }
    }

    updateTrail(body) {
        const positions = body.trail.geometry.attributes.position.array;

        // Shift old points
        for (let i = positions.length - 1; i >= 3; i--) {
            positions[i] = positions[i - 3];
        }

        positions[0] = body.x;
        positions[1] = 0;
        positions[2] = body.z;

        // Ensure userData exists
        if (!body.userData) body.userData = {};

        let drawCount = body.userData.drawCount || 1;
        drawCount = Math.min(drawCount + 1, 500);
        body.userData.drawCount = drawCount;

        body.trail.geometry.setDrawRange(0, drawCount);
        body.trail.geometry.attributes.position.needsUpdate = true;
    }
}

// Global Export
window.StarSystemBuilder = StarSystemBuilder;
