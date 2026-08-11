
console.log("SPACE COMBAT JS LOADED - VERSION 18");

// --- Asset Management ---
const SPACE_COMBAT_ASSET_VERSION = (() => {
    try {
        const current = document.currentScript?.src || Array.from(document.scripts).find((script) => script.src.includes('/space-combat.js'))?.src || '';
        return new URL(current, window.location.href).searchParams.get('v') || '2026_V126_ULTIMATE_FIX';
    } catch (_) {
        return '2026_V126_ULTIMATE_FIX';
    }
})();

class AssetManager {
    constructor() {
        this.assets = {};
        this.loading = {};
        this.loader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader() : null;
        this.loaderPromise = null;
    }

    ensureLoader() {
        if (this.loader) return Promise.resolve(this.loader);
        if (typeof THREE.GLTFLoader !== 'undefined') {
            this.loader = new THREE.GLTFLoader();
            return Promise.resolve(this.loader);
        }
        if (this.loaderPromise) return this.loaderPromise;

        this.loaderPromise = new Promise((resolve, reject) => {
            const existing = Array.from(document.scripts).find((script) => {
                try {
                    return new URL(script.src, window.location.href).pathname.endsWith('/GLTFLoader-r128.js');
                } catch (_) {
                    return false;
                }
            });
            const finish = () => {
                if (typeof THREE.GLTFLoader === 'undefined') {
                    reject(new Error('GLTFLoader script loaded without exposing THREE.GLTFLoader'));
                    return;
                }
                this.loader = new THREE.GLTFLoader();
                resolve(this.loader);
            };
            if (existing) {
                if (typeof THREE.GLTFLoader !== 'undefined') return finish();
                existing.addEventListener('load', finish, { once: true });
                existing.addEventListener('error', () => reject(new Error('Failed to load GLTFLoader-r128.js')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = `GLTFLoader-r128.js?v=${encodeURIComponent(SPACE_COMBAT_ASSET_VERSION)}`;
            script.async = true;
            script.dataset.cfasync = 'false';
            script.onload = finish;
            script.onerror = () => reject(new Error('Failed to load GLTFLoader-r128.js'));
            document.head.appendChild(script);
        }).catch((error) => {
            this.loaderPromise = null;
            throw error;
        });
        return this.loaderPromise;
    }

    load(name, url, callback) {
        if (this.assets[name]) {
            if (callback) callback(this.assets[name].clone());
            return;
        }

        if (this.loading[name]) {
            if (callback) this.loading[name].push(callback);
            return;
        }

        this.loading[name] = callback ? [callback] : [];

        this.ensureLoader().then((loader) => {
            loader.load(url, (gltf) => {
                console.log(`Asset Loaded: ${name}`);
                this.assets[name] = gltf.scene;
                const callbacks = this.loading[name] || [];
                delete this.loading[name];
                callbacks.forEach(cb => cb(gltf.scene.clone()));
            }, undefined, (error) => {
                console.error(`Error loading asset ${name}:`, error);
                const callbacks = this.loading[name] || [];
                delete this.loading[name];
                callbacks.forEach(cb => cb(null));
            });
        }).catch((error) => {
            console.warn(`GLTF loader unavailable for ${name}:`, error);
            const callbacks = this.loading[name] || [];
            delete this.loading[name];
            callbacks.forEach(cb => cb(null));
        });
    }

    get(name) {
        return this.assets[name] ? this.assets[name].clone() : null;
    }
}

// Global Asset Manager Instance
const assetManager = new AssetManager();

class SpaceCombatScene {
    constructor(game) {
        this.game = game;
        this.active = false;

        // Optional high-fidelity GLB assets are intentionally opt-in. They are not
        // shipped in the public build by default; procedural ships/missiles remain
        // fully functional and avoid failed requests / a ~57 MB model download.
        this.useHighFidelityAssets = window.EXOPLANET_PIONEER_GLTF_ASSETS === true;
        if (this.useHighFidelityAssets) {
            assetManager.load('xwing', 'assets/models/ships/viper.glb');
            assetManager.load('missile', 'assets/models/defense/missile_battery.glb');
        }

        // Scene Setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = game.renderer; // Reuse main renderer

        // Lighting
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x222222, 0.8); // Higher ambient for visibility
        this.scene.add(ambientLight);

        // Key Light (Sun)
        const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
        sunLight.position.set(100, 50, 50);
        this.scene.add(sunLight);

        // Rim Light (Blue-ish back light)
        const rimLight = new THREE.DirectionalLight(0x4455ff, 0.8);
        rimLight.position.set(-50, 20, -50);
        this.scene.add(rimLight);

        // Starfield & Nebula
        this.createStarfield();
        this.createNebula();

        // Game Objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.targetLock = null;
        this._targetLockBadTime = 0;
        this._crosshairHitTimeout = null;
        this._lastCrosshairHitAt = 0;
        this._targetBracketEl = null;
        this._targetProjectVec = null;
        this._leadIndicatorEl = null;
        this._leadProjectVec = null;
        this._cameraShakeTime = 0;
        this._cameraShakeDuration = 0;
        this._cameraShakeMag = 0;
        this._cameraShakeVec = new THREE.Vector3();
        this._audioCtx = null;
        this._lastSfxAt = 0;
        this._wavePlan = null;
        this._waveIndex = 0;
        this._waitingForNextWave = false;
        this._nextWaveTimer = 0;
        this._combatOutcome = null;
        this._pendingExitTimer = 0;
        this._combatReward = null;
        this.cameraOffset = new THREE.Vector3(0, 8, 25); // Chase position
        this.cameraLookOffset = new THREE.Vector3(0, 5, -20); // Look ahead point

        this.zoom = 25;
        this.onScroll = (e) => {
            if (!this.active) return;
            e.preventDefault();
            e.stopPropagation();
            if (this.game && this.game.isPaused) return;
            this.zoom += e.deltaY * 0.05;
            this.zoom = Math.max(10, Math.min(this.zoom, 50));
            this.cameraOffset.z = this.zoom;
        };

        // Systems
        this.projectileSystem = new ProjectileSystem(this);

        this._targetBracketEl = document.getElementById('hud-target-bracket');
        this._targetProjectVec = new THREE.Vector3();
        this._leadIndicatorEl = document.getElementById('hud-lead-indicator');
        this._leadProjectVec = new THREE.Vector3();

        // Input
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.resumeAudio();
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.init();
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < 6000; i++) {
            vertices.push(
                THREE.MathUtils.randFloatSpread(2000),
                THREE.MathUtils.randFloatSpread(2000),
                THREE.MathUtils.randFloatSpread(2000)
            );

            // Star colors (Blue-white to yellow-white)
            const starType = Math.random();
            if (starType > 0.9) color.setHex(0xaaaaff); // Blue giant
            else if (starType > 0.6) color.setHex(0xffffee); // White/Yellow
            else color.setHex(0xaaaaaa); // Dim

            colors.push(color.r, color.g, color.b);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({ size: 1.2, vertexColors: true, transparent: true, opacity: 0.8 });
        this.starfield = new THREE.Points(geometry, material);
        this.scene.add(this.starfield);
    }

    createNebula() {
        // Simple Gradient Background Sphere
        const geo = new THREE.SphereGeometry(1500, 32, 32);
        // Flip normals to view from inside
        geo.scale(-1, 1, 1);

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(0x000022) }, // Deep Blue
                color2: { value: new THREE.Color(0x050011) }  // Space Black
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                void main() {
                    // Simple vertical gradient
                    gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
                }
            `,
            side: THREE.BackSide
        });

        const nebula = new THREE.Mesh(geo, mat);
        this.scene.add(nebula);
    }

    init() {
        // Player is now created in start() based on squadron selection
        // this.player = new ShipController(this); // REMOVED
        // this.scene.add(this.player.mesh);

        // Spawn some enemies test
    }

    spawnEnemy(pos, opts = null) {
        const p = (pos && pos.isVector3) ? { x: pos.x, y: pos.y, z: pos.z } : pos;
        const enemy = new EnemyAI(this, p, opts);
        this.enemies.push(enemy);
        this.scene.add(enemy.mesh);
    }

    getDefaultWavePlan() {
        return [
            { count: 3, archetype: 'scout' },
            { count: 4, archetype: 'fighter' },
            { count: 1, archetype: 'ace' }
        ];
    }

    resetCombatLoop() {
        this._waveIndex = 0;
        this._waitingForNextWave = false;
        this._nextWaveTimer = 0;
        this._combatOutcome = null;
        this._pendingExitTimer = 0;
        this._combatReward = null;
    }

    cleanupBattlefield() {
        if (Array.isArray(this.enemies)) {
            this.enemies.forEach(e => {
                if (e && e.mesh) this.scene.remove(e.mesh);
            });
        }
        this.enemies = [];

        if (this.projectileSystem && Array.isArray(this.projectileSystem.projectiles)) {
            this.projectileSystem.projectiles.forEach(p => {
                if (p && p.mesh) this.scene.remove(p.mesh);
            });
            this.projectileSystem.projectiles = [];
        }

        if (Array.isArray(this.particles)) {
            this.particles.forEach(p => {
                if (p && p.mesh) this.scene.remove(p.mesh);
            });
        }
        this.particles = [];

        this.clearTargetLock();
    }

    spawnWave(wave) {
        if (!wave) return;

        const count = (typeof wave.count === 'number' && Number.isFinite(wave.count)) ? Math.max(0, Math.floor(wave.count)) : 0;
        const archetype = wave.archetype != null ? String(wave.archetype) : null;

        const base = (this.player && this.player.mesh && this.player.mesh.position) ? this.player.mesh.position : new THREE.Vector3(0, 0, 0);
        const centerZ = base.z - 140;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 60;
            const x = base.x + Math.cos(angle) * radius;
            const y = base.y + THREE.MathUtils.randFloatSpread(40);
            const z = centerZ + THREE.MathUtils.randFloatSpread(60);
            const opts = archetype ? { archetype } : null;
            this.spawnEnemy({ x, y, z }, opts);
        }
    }

    spawnNextWave() {
        if (!Array.isArray(this._wavePlan) || this._wavePlan.length === 0) {
            this.triggerCombatEnd('victory');
            return;
        }

        if (this._waveIndex >= this._wavePlan.length) {
            this.triggerCombatEnd('victory');
            return;
        }

        const waveNumber = this._waveIndex + 1;
        const wave = this._wavePlan[this._waveIndex];
        this._waveIndex++;

        if (this.game && this.game.notify) {
            this.game.notify(`Wave ${waveNumber} incoming!`, 'warning');
        }

        this.spawnWave(wave);
    }

    onWaveCleared() {
        if (this._combatOutcome) return;

        if (!Array.isArray(this._wavePlan) || this._wavePlan.length === 0 || this._waveIndex >= this._wavePlan.length) {
            this.triggerCombatEnd('victory');
            return;
        }

        this._waitingForNextWave = true;
        this._nextWaveTimer = 1.6;

        if (this.game && this.game.notify) {
            this.game.notify('Wave cleared!', 'info');
        }
    }

    calculateCombatReward() {
        const waves = Array.isArray(this._wavePlan) ? this._wavePlan : [];
        let credits = 0;
        let alloys = 0;

        for (let i = 0; i < waves.length; i++) {
            const w = waves[i] || {};
            const c = (typeof w.count === 'number' && Number.isFinite(w.count)) ? w.count : 0;
            credits += Math.max(0, c) * 10;
            if (i > 0 && i % 2 === 0) alloys += 2;
        }

        const reward = {};
        const cOut = Math.floor(credits);
        const aOut = Math.floor(alloys);
        if (cOut > 0) reward.credits = cOut;
        if (aOut > 0) reward.alloys = aOut;
        return reward;
    }

    triggerCombatEnd(outcome) {
        if (this._combatOutcome) return;

        this._combatOutcome = outcome || 'victory';
        this._combatReward = (this._combatOutcome === 'victory') ? this.calculateCombatReward() : null;
        this._pendingExitTimer = 2.25;

        if (this.game && this.game.notify) {
            if (this._combatOutcome === 'victory') {
                this.game.notify('Victory! Returning to base...', 'success');
            } else {
                this.game.notify('Combat ended.', 'info');
            }
        }
    }

    start(squadronData = []) {
        this.active = true;
        const hud = document.getElementById('combat-hud');
        if (hud) hud.style.display = 'block';

        this.resetCombatLoop();
        this.cleanupBattlefield();

        if (!Array.isArray(this._wavePlan) || this._wavePlan.length === 0) {
            this._wavePlan = this.getDefaultWavePlan();
        }

        // 1. Cleanup Old Squadron
        if (this.squadron) {
            this.squadron.forEach(ship => this.scene.remove(ship.mesh));
        }
        this.squadron = [];

        // 2. Create New Squadron
        console.log("Starting Combat with Squadron:", squadronData);
        // Fallback if empty (should check outside too)
        if (!squadronData || squadronData.length === 0) {
            // Default "Rookie" ship if nothing passed
            squadronData = [{ name: 'Rookie One', hull: 'Interceptor', modules: [] }];
        }

        squadronData.forEach((design, index) => {
            const ship = new ShipController(this, design);

            // Formation Position
            let xOff = 0, zOff = 0;
            // Leader is 0,0,0
            if (index === 1) { xOff = -20; zOff = 20; }  // Left Wing
            if (index === 2) { xOff = 20; zOff = 20; }   // Right Wing

            ship.formationOffset = new THREE.Vector3(xOff, 0, zOff);
            ship.mesh.position.set(xOff, 0, zOff); // Initial pos

            this.scene.add(ship.mesh);
            this.squadron.push(ship);
        });

        // 3. Set Player Control to Leader
        this.playerIndex = 0;
        this.player = this.squadron[0];

        this.setCameraForPlayer();

        this.spawnNextWave();

        // Notify
        if (this.game && this.game.notify) {
            this.game.notify(`Squadron launched! Leader: ${this.player.design.name}`, "success");
        }

        // Scroll listener with capture: true to ensure it works
        window.addEventListener('wheel', this.onScroll, { capture: true, passive: false });

        // Mouse Fire Listener
        this.onMouseDown = (e) => {
            this.resumeAudio();
            if (this.player && this.active) this.player.shoot();
        };
        window.addEventListener('mousedown', this.onMouseDown);

        // Tab Listener for switching ships
        this.onKeyDown = (e) => {
            if (e.code === 'Tab') {
                e.preventDefault(); // Prevent focus switch
                this.cycleShip();
            }

            if (e.code === 'KeyT') {
                if (e.repeat) return;
                e.preventDefault();
                this.toggleTargetLock();
            }
        }
        window.addEventListener('keydown', this.onKeyDown);
    }

    cycleShip() {
        if (!this.squadron || this.squadron.length <= 1) return;

        this.playerIndex = (this.playerIndex + 1) % this.squadron.length;
        this.player = this.squadron[this.playerIndex];

        if (this.player && this.player.formationOffset) {
            this.player.formationOffset.set(0, 0, 0);
        }

        const wingmen = this.squadron.filter(s => s !== this.player);
        if (wingmen[0] && wingmen[0].formationOffset) wingmen[0].formationOffset.set(-20, 0, 20);
        if (wingmen[1] && wingmen[1].formationOffset) wingmen[1].formationOffset.set(20, 0, 20);

        for (let i = 2; i < wingmen.length; i++) {
            if (!wingmen[i].formationOffset) continue;
            const side = (i % 2 === 0) ? -1 : 1;
            const row = Math.floor(i / 2);
            wingmen[i].formationOffset.set(side * (20 + row * 12), 0, 20 + row * 12);
        }

        this.setCameraForPlayer();

        // Visual feedback?
        if (this.game && this.game.notify) {
            this.game.notify(`Switched control to: ${this.player.design.name}`, "info");
        }
    }

    setCameraForPlayer() {
        if (!this.player) return;

        let scale = 0.5;
        if (this.player.getHullModelSpec) {
            const spec = this.player.getHullModelSpec();
            if (spec && typeof spec.scale === 'number' && Number.isFinite(spec.scale)) scale = spec.scale;
        }

        const factor = Math.max(0.5, Math.min(2.0, scale / 0.5));
        const z = THREE.MathUtils.clamp(25 * factor, 12, 60);
        this.zoom = z;
        this.cameraOffset.set(0, 8 * factor, z);
        this.cameraLookOffset.set(0, 5 * factor, -20 * factor);
    }

    stop() {
        this.active = false;
        document.getElementById('combat-hud').style.display = 'none';
        this.clearTargetLock();
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.classList.remove('locked', 'hit', 'hit-shield', 'hit-kill');
        if (this._targetBracketEl) this._targetBracketEl.style.display = 'none';
        if (this._leadIndicatorEl) this._leadIndicatorEl.style.display = 'none';
        window.removeEventListener('wheel', this.onScroll, true);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('keydown', this.onKeyDown);
        // Cleanup?
    }

    update(dt) {
        if (!this.active) return;

        const dtSafe = (typeof dt === 'number' && Number.isFinite(dt) && dt > 0) ? dt : 0;

        if (this._pendingExitTimer > 0) {
            this._pendingExitTimer = Math.max(0, this._pendingExitTimer - dtSafe);
            if (this._pendingExitTimer <= 0) {
                const result = { outcome: this._combatOutcome, reward: this._combatReward };
                if (this.game && typeof this.game.retreatFromCombat === 'function') {
                    this.game.retreatFromCombat(result);
                } else {
                    this.stop();
                }
                return;
            }
        }

        if (!this._combatOutcome && this._waitingForNextWave) {
            this._nextWaveTimer = Math.max(0, this._nextWaveTimer - dtSafe);
            if (this._nextWaveTimer <= 0) {
                this._waitingForNextWave = false;
                this.spawnNextWave();
            }
        }

        // Update Squadron
        if (this.squadron) {
            this.squadron.forEach((ship, index) => {
                if (ship === this.player) {
                    // Controlled by User
                    ship.update(dt, this.keys);
                } else {
                    // Wingman Logic (AI)
                    // Now passes the player as leader
                    ship.update(dt, null, this.player);
                }
            });
        }

        this.enemies.forEach(e => e.update(dt, this.player));
        this.projectileSystem.update(dt);
        this.updateParticles(dt);

        // Collision Detection
        this.checkCollisions();

        // Update Camera
        this.updateCamera(dt);

        this.updateTargetLock(dt);
    }

    updateCamera(dt) {
        if (!this.player || !this.player.mesh) return;

        // Target Position (Behind ship) - More lag (lower lerp)
        const relativeOffset = this.cameraOffset.clone();
        const cameraTargetPos = relativeOffset.applyMatrix4(this.player.mesh.matrixWorld);

        // Smoothly move camera (2.0 factor for heavier feel)
        this.camera.position.lerp(cameraTargetPos, 2.0 * dt);

        // Look at a point in front of the ship to lead the action
        const lookOffset = this.cameraLookOffset.clone();
        const lookTarget = lookOffset.applyMatrix4(this.player.mesh.matrixWorld);

        // Rolling/Banking Camera effect
        // We get the ship's up vector to align camera up slightly
        const shipUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.player.mesh.quaternion);

        // Smooth rotation (3.0 factor for smoother turns)
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(this.camera.position, lookTarget, shipUp)
        );
        this.camera.quaternion.slerp(targetQuaternion, 3.0 * dt);

        if (this._cameraShakeTime > 0) {
            const dtSafe = (typeof dt === 'number' && Number.isFinite(dt) && dt > 0) ? dt : 0;
            this._cameraShakeTime = Math.max(0, this._cameraShakeTime - dtSafe);
            const k = (this._cameraShakeDuration > 0) ? (this._cameraShakeTime / this._cameraShakeDuration) : 0;
            const mag = this._cameraShakeMag * k;
            if (mag > 0 && this._cameraShakeVec) {
                this._cameraShakeVec.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).multiplyScalar(mag);
                this.camera.position.add(this._cameraShakeVec);
            }

            if (this._cameraShakeTime <= 0) {
                this._cameraShakeDuration = 0;
                this._cameraShakeMag = 0;
            }
        }
    }

    addCameraShake(magnitude = 0.25, duration = 0.15) {
        const mag = (typeof magnitude === 'number' && Number.isFinite(magnitude)) ? magnitude : 0;
        const dur = (typeof duration === 'number' && Number.isFinite(duration)) ? duration : 0;
        if (mag <= 0 || dur <= 0) return;

        this._cameraShakeTime = Math.max(this._cameraShakeTime || 0, dur);
        this._cameraShakeDuration = Math.max(this._cameraShakeDuration || 0, dur);
        this._cameraShakeMag = Math.max(this._cameraShakeMag || 0, mag);
    }

    ensureAudio() {
        if (this._audioCtx) return this._audioCtx;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        try {
            this._audioCtx = new Ctx();
        } catch (e) {
            this._audioCtx = null;
        }
        return this._audioCtx;
    }

    resumeAudio() {
        const ctx = this.ensureAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }
    }

    playTone(freq, duration = 0.08, type = 'sine', volume = 0.04, delay = 0) {
        const ctx = this.ensureAudio();
        if (!ctx) return;
        if (!(typeof freq === 'number' && Number.isFinite(freq) && freq > 0)) return;
        const dur = (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) ? duration : 0.08;
        const vol = (typeof volume === 'number' && Number.isFinite(volume) && volume > 0) ? volume : 0.04;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }

        const t0 = ctx.currentTime + Math.max(0, (typeof delay === 'number' && Number.isFinite(delay)) ? delay : 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(vol, t0 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    playCombatSfx(kind, strength = 1) {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const minGap = (kind === 'kill') ? 0 : 45;
        if (now - (this._lastSfxAt || 0) < minGap) return;
        this._lastSfxAt = now;

        const k = THREE.MathUtils.clamp((typeof strength === 'number' && Number.isFinite(strength)) ? strength : 0.6, 0, 1);

        if (kind === 'shield') {
            this.playTone(900 + 500 * k, 0.06 + 0.05 * k, 'sine', 0.03 + 0.03 * k);
            this.playTone(1500 + 650 * k, 0.03 + 0.03 * k, 'triangle', 0.02 + 0.02 * k, 0.02);
            return;
        }

        if (kind === 'hull') {
            this.playTone(220 + 70 * k, 0.08 + 0.06 * k, 'square', 0.04 + 0.04 * k);
            this.playTone(120 + 40 * k, 0.06 + 0.04 * k, 'sawtooth', 0.02 + 0.03 * k, 0.02);
            return;
        }

        if (kind === 'hurt') {
            this.playTone(95 + 35 * k, 0.09 + 0.07 * k, 'sawtooth', 0.05 + 0.04 * k);
            return;
        }

        if (kind === 'kill') {
            this.playTone(260, 0.11, 'square', 0.05 + 0.03 * k);
            this.playTone(520, 0.09, 'triangle', 0.04 + 0.02 * k, 0.09);
            return;
        }
    }

    getBestEnemyTarget(ship, threshold = 0.95) {
        if (!ship || !ship.mesh || !Array.isArray(this.enemies) || this.enemies.length === 0) return null;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.mesh.quaternion).normalize();
        const toVec = new THREE.Vector3();

        let best = null;
        let bestDot = threshold;
        let bestDist = Infinity;
        let bestIndex = -1;

        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (!e || !e.mesh) continue;

            toVec.subVectors(e.mesh.position, ship.mesh.position);
            const dist = toVec.length();
            if (dist <= 0.001) continue;

            toVec.multiplyScalar(1 / dist);
            const dot = forward.dot(toVec);
            if (dot < threshold) continue;

            if (!best || dot > bestDot + 0.01 || (dot >= bestDot - 1e-6 && dist < bestDist)) {
                best = e;
                bestDot = dot;
                bestDist = dist;
                bestIndex = i;
            }
        }

        if (!best) return null;
        return { target: best, dist: bestDist, index: bestIndex, dot: bestDot };
    }

    toggleTargetLock() {
        if (!this.active) return;

        if (this.targetLock) {
            this.clearTargetLock();
            return;
        }

        const info = this.getBestEnemyTarget(this.player, 0.95);
        if (info && info.target) {
            this.targetLock = info.target;
            this._targetLockBadTime = 0;
        }
    }

    clearTargetLock() {
        this.targetLock = null;
        this._targetLockBadTime = 0;
        if (this._targetBracketEl) this._targetBracketEl.style.display = 'none';
        if (this._leadIndicatorEl) this._leadIndicatorEl.style.display = 'none';
    }

    updateTargetLock(dt) {
        if (!this.targetLock) {
            this._targetLockBadTime = 0;
            if (this._targetBracketEl) this._targetBracketEl.style.display = 'none';
            if (this._leadIndicatorEl) this._leadIndicatorEl.style.display = 'none';
            return;
        }

        const t = this.targetLock;
        if (!t || !t.mesh || typeof t.health !== 'number' || t.health <= 0) {
            this.clearTargetLock();
            return;
        }

        if (!Array.isArray(this.enemies) || this.enemies.indexOf(t) === -1) {
            this.clearTargetLock();
            return;
        }

        if (!this.player || !this.player.mesh) {
            this.clearTargetLock();
            return;
        }

        const dtSafe = (typeof dt === 'number' && Number.isFinite(dt) && dt > 0) ? dt : 0;
        const maxLockDistance = 650;
        const maintainDotThreshold = 0.92;
        const graceTime = 0.35;

        const toTarget = new THREE.Vector3().subVectors(t.mesh.position, this.player.mesh.position);
        const dist = toTarget.length();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.mesh.quaternion).normalize();

        let dot = -1;
        if (dist > 0.001) {
            toTarget.multiplyScalar(1 / dist);
            dot = forward.dot(toTarget);
        }

        const outOfCone = dot < maintainDotThreshold;
        const outOfRange = dist > maxLockDistance;

        if (outOfCone || outOfRange) {
            this._targetLockBadTime += dtSafe;
        } else {
            this._targetLockBadTime = 0;
        }

        if (this._targetLockBadTime > graceTime) {
            this.clearTargetLock();
            return;
        }

        this.updateTargetBracket();
        this.updateLeadIndicator();
    }

    getProjectileSpeedForWeapon(weapon) {
        const w = String(weapon || 'laser').toLowerCase();
        return w === 'missile' ? 60 : 150;
    }

    getLeadAimPointForTarget(out, shooterPos, projectileSpeed, target) {
        if (!out || !shooterPos || !target || !target.mesh) return false;

        const speed = (typeof projectileSpeed === 'number' && Number.isFinite(projectileSpeed) && projectileSpeed > 0) ? projectileSpeed : 150;
        const targetPos = target.mesh.position;
        const targetVel = (target.velocity && target.velocity.isVector3) ? target.velocity : null;

        const r = new THREE.Vector3().subVectors(targetPos, shooterPos);
        const v = targetVel ? targetVel.clone() : new THREE.Vector3(0, 0, 0);

        const a = v.dot(v) - speed * speed;
        const b = 2 * r.dot(v);
        const c = r.dot(r);

        let t = null;
        if (Math.abs(a) < 1e-6) {
            if (Math.abs(b) > 1e-6) {
                t = -c / b;
            }
        } else {
            const disc = b * b - 4 * a * c;
            if (disc >= 0) {
                const sDisc = Math.sqrt(disc);
                const t1 = (-b - sDisc) / (2 * a);
                const t2 = (-b + sDisc) / (2 * a);
                const tt1 = (t1 > 0) ? t1 : null;
                const tt2 = (t2 > 0) ? t2 : null;
                if (tt1 != null && tt2 != null) t = Math.min(tt1, tt2);
                else if (tt1 != null) t = tt1;
                else if (tt2 != null) t = tt2;
            }
        }

        if (!(typeof t === 'number' && Number.isFinite(t)) || t <= 0) return false;

        out.copy(targetPos);
        if (targetVel) out.addScaledVector(targetVel, t);
        return true;
    }

    updateLeadIndicator() {
        const el = this._leadIndicatorEl;
        if (!el) return;

        if (!this.targetLock || !this.targetLock.mesh || !this.player || !this.player.mesh || !this.camera) {
            el.style.display = 'none';
            return;
        }

        const weapon = this.player.currentWeapon;
        const projectileSpeed = this.getProjectileSpeedForWeapon(weapon);

        const muzzlePos = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.mesh.quaternion).normalize();
        muzzlePos.copy(this.player.mesh.position).add(forward.clone().multiplyScalar(2));

        const leadWorld = new THREE.Vector3();
        const ok = this.getLeadAimPointForTarget(leadWorld, muzzlePos, projectileSpeed, this.targetLock);
        if (!ok) {
            el.style.display = 'none';
            return;
        }

        if (!this._leadProjectVec) this._leadProjectVec = new THREE.Vector3();
        this._leadProjectVec.copy(leadWorld).project(this.camera);

        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        const x = (this._leadProjectVec.x * 0.5 + 0.5) * w;
        const y = (-this._leadProjectVec.y * 0.5 + 0.5) * h;

        const margin = 30;
        const offscreen = (this._leadProjectVec.z < -1 || this._leadProjectVec.z > 1 || x < -margin || x > w + margin || y < -margin || y > h + margin);
        if (offscreen) {
            el.style.display = 'none';
            return;
        }

        el.style.display = 'block';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    }

    updateTargetBracket() {
        const el = this._targetBracketEl;
        if (!el) return;

        if (!this.targetLock || !this.targetLock.mesh || !this.camera) {
            el.style.display = 'none';
            return;
        }

        if (!this._targetProjectVec) this._targetProjectVec = new THREE.Vector3();
        this._targetProjectVec.copy(this.targetLock.mesh.position).project(this.camera);

        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        const x = (this._targetProjectVec.x * 0.5 + 0.5) * w;
        const y = (-this._targetProjectVec.y * 0.5 + 0.5) * h;

        const margin = 30;
        const offscreen = (this._targetProjectVec.z < -1 || this._targetProjectVec.z > 1 || x < -margin || x > w + margin || y < -margin || y > h + margin);
        if (offscreen) {
            el.style.display = 'none';
            return;
        }

        let dist = 0;
        if (this.player && this.player.mesh) {
            dist = this.player.mesh.position.distanceTo(this.targetLock.mesh.position);
        }
        const size = THREE.MathUtils.clamp(110 - dist * 0.12, 42, 92);

        el.style.display = 'block';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
    }

    flashCrosshair(kind) {
        const el = document.getElementById('crosshair');
        if (!el) return;

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (this._lastCrosshairHitAt && now - this._lastCrosshairHitAt < 30) return;
        this._lastCrosshairHitAt = now;

        el.classList.remove('hit', 'hit-shield', 'hit-kill');
        if (kind) el.classList.add(kind);

        if (this._crosshairHitTimeout) clearTimeout(this._crosshairHitTimeout);
        this._crosshairHitTimeout = setTimeout(() => {
            el.classList.remove('hit', 'hit-shield', 'hit-kill');
        }, 120);
    }

    checkCollisions() {
        // Projectiles vs Enemies
        this.projectileSystem.projectiles.forEach(p => {
            if (!p.active) return;

            if (p.owner === 'player') {
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    if (p.mesh.position.distanceTo(e.mesh.position) < 5) { // Increased hit radius slightly
                        const dmg = (typeof p.damage === 'number' && Number.isFinite(p.damage)) ? p.damage : (p.type === 'missile' ? 25 : 10);
                        const preShields = (typeof e.shields === 'number' && Number.isFinite(e.shields)) ? e.shields : 0;
                        const preHealth = (typeof e.health === 'number' && Number.isFinite(e.health)) ? e.health : 0;
                        e.takeDamage(dmg);
                        const postShields = (typeof e.shields === 'number' && Number.isFinite(e.shields)) ? e.shields : 0;
                        const postHealth = (typeof e.health === 'number' && Number.isFinite(e.health)) ? e.health : 0;
                        const shieldDamage = Math.max(0, preShields - postShields);
                        const hullDamage = Math.max(0, preHealth - postHealth);
                        p.active = false; // Destroy bullet
                        p.mesh.visible = false;

                        const fxStrength = THREE.MathUtils.clamp(dmg / 40, 0, 1);
                        if (shieldDamage > 0 && hullDamage <= 0) {
                            this.createShieldRipple(p.mesh.position, e, fxStrength);
                        }
                        if (hullDamage > 0) {
                            this.createHullSparks(p.mesh.position, e, fxStrength);
                        }

                        const impactColor = (shieldDamage > 0 && hullDamage <= 0) ? 0x8b5cf6 : 0xffaa00;
                        this.createExplosion(p.mesh.position, 1.0, impactColor);

                        if (e.health <= 0) {
                            this.playCombatSfx('kill', fxStrength);
                            this.flashCrosshair('hit-kill');
                            this.destroyEnemy(i);
                        } else if (hullDamage > 0) {
                            this.playCombatSfx('hull', fxStrength);
                            this.flashCrosshair('hit');
                        } else if (shieldDamage > 0) {
                            this.playCombatSfx('shield', fxStrength);
                            this.flashCrosshair('hit-shield');
                        }
                        break;
                    }
                }
            } else if (p.owner === 'enemy') {
                if (!this.squadron || this.squadron.length === 0) return;

                for (let i = this.squadron.length - 1; i >= 0; i--) {
                    const ship = this.squadron[i];
                    if (!ship || !ship.mesh) continue;

                    if (p.mesh.position.distanceTo(ship.mesh.position) < 5) {
                        const dmg = (typeof p.damage === 'number' && Number.isFinite(p.damage)) ? p.damage : (p.type === 'missile' ? 25 : 10);
                        const preShields = (typeof ship.shields === 'number' && Number.isFinite(ship.shields)) ? ship.shields : 0;
                        const preHealth = (typeof ship.health === 'number' && Number.isFinite(ship.health)) ? ship.health : 0;
                        ship.takeDamage(dmg);
                        const postShields = (typeof ship.shields === 'number' && Number.isFinite(ship.shields)) ? ship.shields : 0;
                        const postHealth = (typeof ship.health === 'number' && Number.isFinite(ship.health)) ? ship.health : 0;
                        const shieldDamage = Math.max(0, preShields - postShields);
                        const hullDamage = Math.max(0, preHealth - postHealth);
                        p.active = false;
                        p.mesh.visible = false;

                        const fxStrength = THREE.MathUtils.clamp(dmg / 40, 0, 1);
                        if (shieldDamage > 0 && hullDamage <= 0) {
                            this.createShieldRipple(p.mesh.position, ship, fxStrength);
                        }
                        if (hullDamage > 0) {
                            this.createHullSparks(p.mesh.position, ship, fxStrength);
                        }

                        const impactColor = (shieldDamage > 0 && hullDamage <= 0) ? 0x8b5cf6 : 0xff3333;
                        this.createExplosion(p.mesh.position, 0.7, impactColor);

                        if (ship === this.player) {
                            const dmgNorm = THREE.MathUtils.clamp(dmg / 40, 0, 1);
                            const mag = (hullDamage > 0 ? 0.22 : 0.12) + dmgNorm * (hullDamage > 0 ? 0.35 : 0.18);
                            this.addCameraShake(mag, 0.16);
                            this.playCombatSfx('hurt', dmgNorm);
                        }

                        if (ship.health <= 0) {
                            this.destroyShip(i);
                        }
                        break;
                    }
                }
            }
        });
    }

    destroyEnemy(index) {
        const deadEnemy = this.enemies[index];
        if (deadEnemy && this.targetLock === deadEnemy) {
            this.clearTargetLock();
        }
        this.createExplosion(deadEnemy.mesh.position, 2.0); // Big boom
        this.scene.remove(deadEnemy.mesh);
        this.enemies.splice(index, 1);

        if (!this._combatOutcome && Array.isArray(this.enemies) && this.enemies.length === 0) {
            this.onWaveCleared();
        }
        // Score / Loot?
    }

    destroyShip(index) {
        if (!this.squadron || index < 0 || index >= this.squadron.length) return;

        const deadShip = this.squadron[index];
        if (deadShip && deadShip.mesh) {
            this.createExplosion(deadShip.mesh.position, 1.5);
            this.scene.remove(deadShip.mesh);
        }

        this.squadron.splice(index, 1);

        if (this.player === deadShip) {
            this.playerIndex = 0;
            this.player = this.squadron[0] || null;
        } else {
            this.playerIndex = this.player ? this.squadron.indexOf(this.player) : 0;
        }

        if (!this.squadron || this.squadron.length === 0) {
            if (this.game && this.game.notify) {
                this.game.notify('Squadron destroyed!', 'danger');
            }
            if (this.game && typeof this.game.retreatFromCombat === 'function') {
                this.game.retreatFromCombat();
            } else {
                this.stop();
            }
            return;
        }

        if (!this.player) {
            this.playerIndex = 0;
            this.player = this.squadron[0];
        }

        if (this.player && this.player.formationOffset) {
            this.player.formationOffset.set(0, 0, 0);
        }

        const wingmen = this.squadron.filter(s => s !== this.player);
        if (wingmen[0] && wingmen[0].formationOffset) wingmen[0].formationOffset.set(-20, 0, 20);
        if (wingmen[1] && wingmen[1].formationOffset) wingmen[1].formationOffset.set(20, 0, 20);

        for (let i = 2; i < wingmen.length; i++) {
            if (!wingmen[i].formationOffset) continue;
            const side = (i % 2 === 0) ? -1 : 1;
            const row = Math.floor(i / 2);
            wingmen[i].formationOffset.set(side * (20 + row * 12), 0, 20 + row * 12);
        }

        this.setCameraForPlayer();

        if (this.game && this.game.notify && this.player && this.player.design) {
            this.game.notify(`Ship destroyed! Control: ${this.player.design.name}`, 'warning');
        }
    }

    createExplosion(pos, scale = 1.0, colorHex = 0xffaa00) {
        // PARTICLE EXPLOSION
        const particleCount = 20;
        const color = new THREE.Color(colorHex);

        for (let i = 0; i < particleCount; i++) {
            // Debris Chunk
            const size = Math.random() * 0.5 * scale;
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            // Random velocity
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );

            this.scene.add(mesh);
            const life = 1.5 + Math.random();
            this.particles.push({ mesh, vel, life, maxLife: life });

            // Spark (Additive)
            const sparkGeo = new THREE.PlaneGeometry(0.5, 0.5);
            const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.copy(pos);
            this.scene.add(spark);
            const sparkLife = 0.5;
            this.particles.push({ mesh: spark, vel: vel.clone().multiplyScalar(1.5), life: sparkLife, maxLife: sparkLife, billboard: true });
        }
    }

    createShieldRipple(pos, ship = null, strength = 1) {
        if (!pos || !this.scene) return;
        const k = THREE.MathUtils.clamp((typeof strength === 'number' && Number.isFinite(strength)) ? strength : 0.6, 0, 1);

        const geo = new THREE.RingGeometry(0.7, 1.4, 32, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.78, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);

        const normal = new THREE.Vector3(0, 0, 1);
        if (ship && ship.mesh && ship.mesh.position) {
            normal.subVectors(pos, ship.mesh.position);
            if (normal.length() > 0.001) normal.normalize();
            else normal.set(0, 0, 1);
        }

        mesh.position.copy(pos).addScaledVector(normal, 0.25);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

        const s = 1.6 + k * 1.2;
        mesh.scale.set(s, s, s);
        this.scene.add(mesh);

        const life = 0.22 + k * 0.12;
        this.particles.push({ mesh, vel: new THREE.Vector3(0, 0, 0), life, maxLife: life, grow: 6 + k * 4, spin: (Math.random() - 0.5) * 2 });
    }

    createHullSparks(pos, ship = null, strength = 1) {
        if (!pos || !this.scene) return;
        const k = THREE.MathUtils.clamp((typeof strength === 'number' && Number.isFinite(strength)) ? strength : 0.6, 0, 1);

        const baseDir = new THREE.Vector3(0, 0, 1);
        if (ship && ship.mesh && ship.mesh.position) {
            baseDir.subVectors(pos, ship.mesh.position);
            if (baseDir.length() > 0.001) baseDir.normalize();
            else baseDir.set(0, 0, 1);
        }

        const count = Math.floor(6 + k * 10);
        for (let i = 0; i < count; i++) {
            const size = 0.25 + Math.random() * 0.35;
            const geo = new THREE.PlaneGeometry(size, size);
            const color = (Math.random() < 0.35) ? 0xffffff : 0xffdd66;
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            mesh.rotation.z = Math.random() * Math.PI;
            this.scene.add(mesh);

            const rand = new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(1),
                THREE.MathUtils.randFloatSpread(1),
                THREE.MathUtils.randFloatSpread(1)
            ).normalize();
            const dir = baseDir.clone().lerp(rand, 0.6).normalize();
            const speed = 28 + Math.random() * 55;
            const vel = dir.multiplyScalar(speed);

            const life = 0.16 + Math.random() * 0.18 + k * 0.08;
            this.particles.push({ mesh, vel, life, maxLife: life, billboard: true, spin: (Math.random() - 0.5) * 8 });
        }
    }

    updateParticles(dt) {
        const dtSafe = (typeof dt === 'number' && Number.isFinite(dt) && dt > 0) ? dt : 0;
        if (dtSafe <= 0) return;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (!p || !p.mesh) {
                this.particles.splice(i, 1);
                continue;
            }

            p.life -= dtSafe;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                if (p.vel && p.vel.isVector3) {
                    p.mesh.position.addScaledVector(p.vel, dtSafe);
                }

                if (p.billboard && this.camera) {
                    p.mesh.quaternion.copy(this.camera.quaternion);
                }

                if (typeof p.spin === 'number' && Number.isFinite(p.spin)) {
                    p.mesh.rotation.z += p.spin * dtSafe;
                } else if (p.vel && p.vel.isVector3) {
                    p.mesh.rotation.x += p.vel.z * dtSafe;
                    p.mesh.rotation.y += p.vel.x * dtSafe;
                }

                if (typeof p.grow === 'number' && Number.isFinite(p.grow) && p.grow !== 0) {
                    const k = 1 + p.grow * dtSafe;
                    if (k > 0 && p.mesh.scale && p.mesh.scale.isVector3) {
                        p.mesh.scale.multiplyScalar(k);
                    }
                }

                const maxLife = (typeof p.maxLife === 'number' && Number.isFinite(p.maxLife) && p.maxLife > 0) ? p.maxLife : 1;
                const a = THREE.MathUtils.clamp(p.life / maxLife, 0, 1);
                const mat = p.mesh.material;
                if (Array.isArray(mat)) {
                    for (let j = 0; j < mat.length; j++) {
                        const m = mat[j];
                        if (!m || typeof m.opacity !== 'number') continue;
                        m.transparent = true;
                        m.opacity = a;
                    }
                } else if (mat && typeof mat.opacity === 'number') {
                    mat.transparent = true;
                    mat.opacity = a;
                }
            }
        }
    }

    render() {
        if (!this.active) return;
        this.renderer.render(this.scene, this.camera);
    }
}

class ShipController {
    constructor(scene, design = null) {
        this.scene = scene;
        this.design = design || { name: 'Prototype', hull: 'Interceptor', modules: [] }; // Default

        // Apply Design Stats
        this.speed = 0;
        this.maxSpeed = 40;
        this.turnSpeed = 2.0;

        this.maxHealth = 100;

        // Custom Stats from Hull
        if (this.design.hull === 'Dreadnought') { this.maxSpeed = 20; this.turnSpeed = 0.8; this.maxHealth = 500; }
        else if (this.design.hull === 'Bomber') { this.maxSpeed = 30; this.turnSpeed = 1.5; this.maxHealth = 200; }

        if (this.design && this.design.stats) {
            const stats = this.design.stats;
            if (typeof stats.hp === 'number' && Number.isFinite(stats.hp)) this.maxHealth = stats.hp;
            if (typeof stats.speed === 'number' && Number.isFinite(stats.speed)) {
                this.maxSpeed = 20 + stats.speed * 0.5;
                this.turnSpeed = 1.2 + stats.speed / 50;
            }
            if (typeof stats.damage === 'number' && Number.isFinite(stats.damage)) this.damage = stats.damage;
            if (typeof stats.range === 'number' && Number.isFinite(stats.range)) this.range = stats.range;
        }

        this.maxShields = 0;
        this.shields = 0;
        this.shieldRegenRate = 0;
        this.shieldRegenDelay = 2.5;
        this.shieldRegenTimer = 0;

        let shieldHp = 0;
        if (this.design) {
            const shields = Array.isArray(this.design.shields) ? this.design.shields : [];
            if (shields.length > 0) {
                shields.forEach(sh => {
                    const hp = (sh && sh.stats && typeof sh.stats.hp === 'number' && Number.isFinite(sh.stats.hp)) ? sh.stats.hp : 0;
                    shieldHp += hp;
                });
            } else if (Array.isArray(this.design.modules)) {
                this.design.modules.forEach(m => {
                    if (!m || m.type !== 'shield') return;
                    const hp = (m.stats && typeof m.stats.hp === 'number' && Number.isFinite(m.stats.hp)) ? m.stats.hp : 0;
                    shieldHp += hp;
                });
            }
        }

        if (typeof shieldHp === 'number' && Number.isFinite(shieldHp) && shieldHp > 0) {
            this.maxShields = shieldHp;
            this.shields = shieldHp;

            if (this.design && this.design.stats && typeof this.design.stats.hp === 'number' && Number.isFinite(this.design.stats.hp)) {
                const hullHp = this.design.stats.hp - shieldHp;
                if (Number.isFinite(hullHp) && hullHp > 0) this.maxHealth = hullHp;
            }

            const shieldList = Array.isArray(this.design.shields) ? this.design.shields : (Array.isArray(this.design.modules) ? this.design.modules : []);
            const hasRegen = shieldList.some(s => s && s.id === 'mod_shield_regenerative');
            const hasHeavy = shieldList.some(s => s && s.id === 'mod_shield_heavy');
            this.shieldRegenRate = hasRegen ? 16 : (hasHeavy ? 6 : 10);
        }

        this.weaponDamage = { laser: 10, missile: 25 };
        if (this.design && Array.isArray(this.design.weapons) && this.design.weapons.length > 0) {
            const dmg = { laser: 0, missile: 0 };
            this.design.weapons.forEach(w => {
                if (!w || !w.stats) return;
                const wDmg = w.stats.damage;
                if (!(typeof wDmg === 'number' && Number.isFinite(wDmg))) return;
                const id = String(w.id || '').toLowerCase();
                if (id.includes('missile') || id.includes('torpedo')) dmg.missile += wDmg;
                else dmg.laser += wDmg;
            });
            if (dmg.laser > 0) this.weaponDamage.laser = dmg.laser;
            if (dmg.missile > 0) this.weaponDamage.missile = dmg.missile;
            if (dmg.laser > 0 && dmg.missile === 0) this.weaponDamage.missile = dmg.laser;
            if (dmg.missile > 0 && dmg.laser === 0) this.weaponDamage.laser = dmg.missile;
        } else if (typeof this.damage === 'number' && Number.isFinite(this.damage)) {
            this.weaponDamage.laser = this.damage;
            this.weaponDamage.missile = this.damage;
        }

        const game = (this.scene && this.scene.game) ? this.scene.game : null;
        if (game && typeof game.getPilotCombatBonuses === 'function') {
            const b = game.getPilotCombatBonuses();
            if (b && typeof b === 'object') {
                if (typeof b.speedMult === 'number' && Number.isFinite(b.speedMult)) this.maxSpeed *= b.speedMult;
                if (typeof b.turnMult === 'number' && Number.isFinite(b.turnMult)) this.turnSpeed *= b.turnMult;
                if (typeof b.hullHpMult === 'number' && Number.isFinite(b.hullHpMult)) this.maxHealth *= b.hullHpMult;

                if (typeof this.maxShields === 'number' && Number.isFinite(this.maxShields) && this.maxShields > 0) {
                    if (typeof b.shieldHpMult === 'number' && Number.isFinite(b.shieldHpMult)) {
                        this.maxShields *= b.shieldHpMult;
                        this.shields = this.maxShields;
                    }
                    if (typeof b.shieldRegenMult === 'number' && Number.isFinite(b.shieldRegenMult)) this.shieldRegenRate *= b.shieldRegenMult;
                }

                if (this.weaponDamage) {
                    if (typeof this.weaponDamage.laser === 'number' && Number.isFinite(this.weaponDamage.laser) && typeof b.laserDmgMult === 'number' && Number.isFinite(b.laserDmgMult)) {
                        this.weaponDamage.laser *= b.laserDmgMult;
                    }
                    if (typeof this.weaponDamage.missile === 'number' && Number.isFinite(this.weaponDamage.missile) && typeof b.missileDmgMult === 'number' && Number.isFinite(b.missileDmgMult)) {
                        this.weaponDamage.missile *= b.missileDmgMult;
                    }
                }
            }
        }

        // Apply Modules (Simple bonus)
        // design.modules ...

        // Mesh Placeholder
        this.mesh = new THREE.Group();

        this._shouldHideProceduralMesh = false;

        // 1. Try to load High-Fidelity Asset
        // Load different model based on hull? For now keeping X-Wing default
        const modelSpec = this.getHullModelSpec();
        if (this.scene.useHighFidelityAssets) assetManager.load(modelSpec.assetKey, modelSpec.url, (model) => {
            if (!model) {
                console.warn(`Failed to load 3D model for ${modelSpec.assetKey}, using procedural fallback.`);
                if (this.proceduralMesh) this.proceduralMesh.visible = true;
                return;
            }
            const s = modelSpec.scale || 0.5;
            model.scale.set(s, s, s);
            model.rotation.y = (typeof modelSpec.rotationY === 'number') ? modelSpec.rotationY : Math.PI;

            if (typeof modelSpec.tint === 'number') {
                this.applyModelTint(model, modelSpec.tint);
            }

            // Hide procedural if it exists
            if (this.proceduralMesh) this.proceduralMesh.visible = false;
            else this._shouldHideProceduralMesh = true;

            this.mesh.add(model);
        });

        // 2. Create Procedural Mesh (Fallback) immediately
        this.createProceduralMesh();

        if (this._shouldHideProceduralMesh && this.proceduralMesh) {
            this.proceduralMesh.visible = false;
        }

        this.velocity = new THREE.Vector3();
        this.health = this.maxHealth;
        this.energy = 100;

        this.currentWeapon = 'laser'; // Default
        this.lastShotTime = 0;
        this._lastMissileLockWarn = 0;

        // Wingman AI State
        this.formationOffset = new THREE.Vector3();
    }

    getHullModelSpec() {
        const hull = this.design ? this.design.hull : null;
        const hullKey = (hull && typeof hull === 'object') ? (hull.id || hull.name || '') : hull;
        const h = String(hullKey || '').toLowerCase();

        if (h.includes('interceptor')) {
            return { assetKey: 'xwing', url: 'assets/models/ships/viper.glb', scale: 0.45, rotationY: Math.PI, tint: 0xd9f99d };
        }

        if (h.includes('bomber')) {
            return { assetKey: 'xwing', url: 'assets/models/ships/viper.glb', scale: 0.65, rotationY: Math.PI, tint: 0xffd6a5 };
        }

        if (h.includes('dreadnought') || h.includes('cruiser') || h.includes('destroyer') || h.includes('frigate')) {
            return { assetKey: 'xwing', url: 'assets/models/ships/viper.glb', scale: 0.9, rotationY: Math.PI, tint: 0xa5d8ff };
        }

        return { assetKey: 'xwing', url: 'assets/models/ships/viper.glb', scale: 0.5, rotationY: Math.PI, tint: 0xffffff };
    }

    applyModelTint(model, tintHex) {
        const tint = new THREE.Color(tintHex);
        model.traverse((obj) => {
            if (!obj || !obj.isMesh || !obj.material) return;

            if (Array.isArray(obj.material)) {
                obj.material = obj.material.map((m) => {
                    const mm = m.clone();
                    if (mm.color) mm.color.lerp(tint, 0.35);
                    return mm;
                });
                return;
            }

            obj.material = obj.material.clone();
            if (obj.material.color) obj.material.color.lerp(tint, 0.35);
        });
    }

    // ... createProceduralMesh ... (omitted from replace for brevity unless needed)

    update(dt, inputState, leaderShip = null) {
        if (!this.mesh) return;

        // 1. AI / Wingman Mode
        if (!inputState && leaderShip) {
            this.updateAI(dt, leaderShip);
        }
        // 2. Player Control Mode
        else if (inputState) {
            this.handlePlayerInput(dt, inputState);
        }

        // 3. Physics & Boundaries
        this.mesh.position.addScaledVector(this.velocity, dt);

        // Boundary (Simple box)
        if (this.mesh.position.z < -1000) this.mesh.position.z = -1000;
        if (this.mesh.position.z > 1000) this.mesh.position.z = 1000;
        if (this.mesh.position.x < -1000) this.mesh.position.x = -1000;
        if (this.mesh.position.x > 1000) this.mesh.position.x = 1000;
        if (this.mesh.position.y < -500) this.mesh.position.y = -500;
        if (this.mesh.position.y > 500) this.mesh.position.y = 500;

        // Energy Regen
        this.energy = Math.min(100, this.energy + 10 * dt);

        if (this.maxShields > 0) {
            if (this.shieldRegenTimer > 0) {
                this.shieldRegenTimer = Math.max(0, this.shieldRegenTimer - dt);
            } else if (this.shields < this.maxShields && this.shieldRegenRate > 0) {
                this.shields = Math.min(this.maxShields, this.shields + this.shieldRegenRate * dt);
            }
        }

        if (inputState) {
            this.updateHUD();
        }
    }

    handlePlayerInput(dt, keys) {
        // Pitch/Yaw/Roll
        if (keys['KeyW']) this.mesh.rotateX(this.turnSpeed * dt);
        if (keys['KeyS']) this.mesh.rotateX(-this.turnSpeed * dt);
        if (keys['KeyA']) this.mesh.rotateY(this.turnSpeed * dt); // Yaw
        if (keys['KeyD']) this.mesh.rotateY(-this.turnSpeed * dt);

        // Roll (Q/E)
        if (keys['KeyQ']) this.mesh.rotateZ(this.turnSpeed * 1.5 * dt);
        if (keys['KeyE']) this.mesh.rotateZ(-this.turnSpeed * 1.5 * dt);

        if (keys['Digit1']) this.currentWeapon = 'laser';
        if (keys['Digit2']) this.currentWeapon = 'missile';

        if (keys['Space']) {
            this.shoot();
        }

        const boostKey = !!keys['ShiftLeft'];
        const boosting = boostKey && this.energy > 0;
        const accelerating = !!keys['ArrowUp'] || boosting;
        const decelerating = !!keys['ArrowDown'] || !!keys['ControlLeft'];

        if (boosting) {
            this.energy = Math.max(0, this.energy - 15 * dt);
        }

        // Speed Control
        if (accelerating) this.speed += 50 * dt;
        if (decelerating) this.speed -= 50 * dt;

        if (!accelerating && !decelerating) {
            const cruiseSpeed = Math.min(20, this.maxSpeed);
            this.speed = THREE.MathUtils.lerp(this.speed, cruiseSpeed, dt);
        }

        const speedCap = boosting ? this.maxSpeed * 1.5 : this.maxSpeed;
        this.speed = Math.max(0, Math.min(this.speed, speedCap));

        // Apply Velocity (Forward direction)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        this.velocity.copy(forward).multiplyScalar(this.speed);
    }

    updateAI(dt, leader) {
        // --- 1. FORMATION FLYING ---
        // Calculate Target Position: Leader World Pos + (FormationOffset rotated by Leader Quat)
        const offset = this.formationOffset || new THREE.Vector3(0, 0, 20); // Default behind
        const targetPos = offset.clone().applyQuaternion(leader.mesh.quaternion).add(leader.mesh.position);

        // Vector to Target
        const toTarget = targetPos.clone().sub(this.mesh.position);
        const distToTarget = toTarget.length();

        // Desired Rotation: Look at a point slightly ahead of the target position to smooth out turns
        // If far behind, look at leader directly? No, look at formation slot.
        // Actually, for "V" formation, we should look generally parallel to leader, but turn towards slot if deviant.

        // Simple Steering: Look at target slot
        const invLeaderQuat = leader.mesh.quaternion.clone();
        if (invLeaderQuat.invert) invLeaderQuat.invert();
        else invLeaderQuat.inverse();

        const relPos = this.mesh.position.clone().sub(leader.mesh.position).applyQuaternion(invLeaderQuat);
        const err = relPos.sub(offset);
        const lateralError = Math.sqrt(err.x * err.x + err.y * err.y);

        if (lateralError > 6 || Math.abs(err.z) > 12) {
            const desiredRot = new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(this.mesh.position, targetPos, new THREE.Vector3(0, 1, 0))
            );
            this.mesh.quaternion.slerp(desiredRot, 2.5 * dt);
        } else {
            // If very close to slot, match leader rotation
            this.mesh.quaternion.slerp(leader.mesh.quaternion, 2.5 * dt);
        }

        // Speed Control (PID-like)
        // If behind, speed up. If ahead, slow down.
        const leaderSpeed = leader.speed;
        let desiredSpeed = leaderSpeed;

        // Catchup / Slowdown factor
        desiredSpeed += THREE.MathUtils.clamp(err.z * 0.7, -15, 30);
        if (distToTarget > 150) desiredSpeed = Math.min(desiredSpeed + 30, this.maxSpeed * 1.5);
        // Cap speed
        desiredSpeed = Math.min(desiredSpeed, this.maxSpeed * 1.5); // Allow burst to catch up

        this.speed = THREE.MathUtils.lerp(this.speed, desiredSpeed, 2.0 * dt);

        // --- 2. COMBAT ENGAGEMENT ---
        // Identify nearest enemy
        let nearest = null;
        let minDist = 300; // Radar range

        // Access enemies from scene reference (ShipController -> SpaceCombatScene -> enemies)
        if (this.scene && this.scene.enemies) {
            this.scene.enemies.forEach(e => {
                const d = this.mesh.position.distanceTo(e.mesh.position);
                if (d < minDist) {
                    minDist = d;
                    nearest = e;
                }
            });
        }

        if (nearest) {
            // Check firing angle (Dot Product)
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion).normalize();
            const toEnemy = nearest.mesh.position.clone().sub(this.mesh.position).normalize();
            const dot = forward.dot(toEnemy);

            if (dot > 0.95) { // Roughly 18 degrees cone
                // Fire!
                this.shoot();
            }

            // Optional: If very close to enemy, break formation to evade/pursue? 
            // For now, staying in formation provides cover fire.
        }

        // Velocity Application
        const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        this.velocity.copy(forwardVec).multiplyScalar(this.speed);
    }

    createProceduralMesh() {
        this.proceduralMesh = new THREE.Group();
        const pMesh = this.proceduralMesh; // Alias for brevity

        // HIGH FIDELITY PROCEDURAL (Moved from Constructor)
        const fuselageGeo = new THREE.BoxGeometry(1.5, 1.5, 10);
        const fuselageMat = new THREE.MeshPhysicalMaterial({
            color: 0xeeeeee, roughness: 0.3, metalness: 0.6, clearcoat: 1.0, clearcoatRoughness: 0.1
        });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        pMesh.add(fuselage);

        // Greeble: Top Vents
        const ventGeo = new THREE.BoxGeometry(1, 0.2, 2);
        const ventMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(0, 0.8, 1);
        pMesh.add(vent);

        // Nose
        const noseGeo = new THREE.ConeGeometry(1, 6, 32);
        noseGeo.rotateX(-Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, fuselageMat);
        nose.position.z = -8;
        pMesh.add(nose);

        // Cockpit
        const cockpitGeo = new THREE.BoxGeometry(1.4, 0.8, 3);
        const cockpitMat = new THREE.MeshPhysicalMaterial({
            color: 0x222222, roughness: 0.1, metalness: 0.1, clearcoat: 1.0
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 1, -2);
        pMesh.add(cockpit);

        // Wings (S-Foils)
        const wingGeo = new THREE.BoxGeometry(8, 0.1, 3);
        const wingMat = new THREE.MeshPhysicalMaterial({
            color: 0xcccccc, metalness: 0.5, roughness: 0.4, clearcoat: 0.5
        });

        const createWing = (x, y, rotZ) => {
            const w = new THREE.Mesh(wingGeo, wingMat);
            w.position.set(x, y, 2);
            w.rotation.z = rotZ;
            pMesh.add(w);
            // Wing Pipe Detail
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 7), ventMat);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, 0, 0.5);
            w.add(pipe);
        };

        createWing(4, 1, -0.2); // TL
        createWing(-4, 1, 0.2); // TR
        createWing(4, -1, 0.2); // BL
        createWing(-4, -1, -0.2); // BR

        // Engines
        const engineGeo = new THREE.CylinderGeometry(0.5, 0.4, 2, 8);
        engineGeo.rotateX(Math.PI / 2);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
        const engineGlow = new THREE.MeshBasicMaterial({ color: 0xff5500 });
        const laserMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, metalness: 0.8 });

        [
            { x: 2, y: 1.5 }, { x: -2, y: 1.5 },
            { x: 2, y: -1.5 }, { x: -2, y: -1.5 }
        ].forEach(pos => {
            const eng = new THREE.Mesh(engineGeo, engineMat);
            eng.position.set(pos.x, pos.y, 4);
            pMesh.add(eng);

            // Complex Intake (Torus)
            const intakeGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
            const intake = new THREE.Mesh(intakeGeo, new THREE.MeshPhysicalMaterial({ color: 0x555555, metalness: 0.8 }));
            intake.position.z = -1.1;
            eng.add(intake);

            // Glow
            const glow = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), engineGlow);
            glow.position.set(0, 0, 1.05);
            eng.add(glow);

            // Laser Cannons
            const laser = new THREE.Group();
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6), laserMat);
            barrel.rotation.x = Math.PI / 2;
            laser.add(barrel);

            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            tip.rotation.x = Math.PI / 2;
            tip.position.z = -3;
            laser.add(tip);

            laser.position.set(pos.x > 0 ? 5.8 : -5.8, pos.y, -2);
            pMesh.add(laser);
        });

        // R2 UNIT
        const dBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), new THREE.MeshPhysicalMaterial({ color: 0xffffff, clearcoat: 1.0 }));
        const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xcccccc, metalness: 0.8 }));
        dBody.rotateX(Math.PI / 2);
        dHead.rotateX(-Math.PI / 2);
        dHead.position.y = 0.3;
        dBody.add(dHead);

        const dPanel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
        dPanel.position.set(0, 0, 0.3);
        dBody.add(dPanel);
        dBody.position.set(0, 1.4, 1.5);
        pMesh.add(dBody);

        // MARKINGS
        const stripeGeo = new THREE.PlaneGeometry(8, 0.2);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xaa0000, side: THREE.DoubleSide });
        const stripeL = new THREE.Mesh(stripeGeo, stripeMat);
        stripeL.position.set(-2, 1.51, 0);
        stripeL.rotation.x = -Math.PI / 2;
        stripeL.rotation.z = -0.2;
        pMesh.add(stripeL);

        const stripeR = new THREE.Mesh(stripeGeo, stripeMat);
        stripeR.position.set(2, 1.51, 0);
        stripeR.rotation.x = -Math.PI / 2;
        stripeR.rotation.z = 0.2;
        pMesh.add(stripeR);

        this.mesh.add(pMesh);
    }

    shoot() {
        const now = Date.now();
        const fireRate = this.currentWeapon === 'missile' ? 800 : 150; // Slower fire for missiles

        const energyCost = this.currentWeapon === 'missile' ? 20 : 4;
        if (this.energy < energyCost) return;

        const lock = this.scene ? this.scene.targetLock : null;
        const hasLock = !!(lock && lock.mesh && typeof lock.health === 'number' && lock.health > 0);
        if (this.currentWeapon === 'missile' && !hasLock) {
            if (now - (this._lastMissileLockWarn || 0) > 900) {
                this._lastMissileLockWarn = now;
                if (this.scene && this.scene.game && this.scene.game.notify) {
                    this.scene.game.notify('Missile lock required (press T).', 'warning');
                }
            }
            return;
        }

        if (now - this.lastShotTime > fireRate) {
            this.lastShotTime = now;

            this.energy = Math.max(0, this.energy - energyCost);

            // Spawn Projectile
            const pos = this.mesh.position.clone();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion).normalize();
            pos.add(forward.clone().multiplyScalar(2)); // Offset muzzle

            let direction = forward;
            if (lock && lock.mesh && this.currentWeapon === 'missile' && typeof this.scene.getLeadAimPointForTarget === 'function') {
                const projectileSpeed = this.scene.getProjectileSpeedForWeapon(this.currentWeapon);
                const lead = new THREE.Vector3();
                const ok = this.scene.getLeadAimPointForTarget(lead, pos, projectileSpeed, lock);
                if (ok) {
                    direction = lead.sub(pos).normalize();
                } else {
                    direction = lock.mesh.position.clone().sub(pos).normalize();
                }
            }

            const dmg = this.weaponDamage ? this.weaponDamage[this.currentWeapon] : undefined;
            this.scene.projectileSystem.fire(pos, direction, 'player', this.currentWeapon, dmg);
        }
    }

    takeDamage(amount) {
        const dmg = (typeof amount === 'number' && Number.isFinite(amount)) ? amount : 0;
        if (dmg <= 0) return;

        let remaining = dmg;

        if (this.maxShields > 0 && this.shields > 0) {
            const absorbed = Math.min(this.shields, remaining);
            this.shields -= absorbed;
            remaining -= absorbed;
            if (absorbed > 0) {
                this.shieldRegenTimer = this.shieldRegenDelay;
            }
        }

        if (remaining > 0) {
            this.health = Math.max(0, this.health - remaining);
        }
    }

    updateHUD() {
        // Assuming HTML elements exist
        const hpEl = document.getElementById('hud-hp-bar');
        if (hpEl) {
            const hpPct = this.maxHealth > 0 ? (this.health / this.maxHealth) * 100 : 0;
            hpEl.style.width = `${Math.max(0, Math.min(100, hpPct))}%`;
        }

        const shieldEl = document.getElementById('hud-shield-bar');
        if (shieldEl) {
            const shPct = this.maxShields > 0 ? (this.shields / this.maxShields) * 100 : 0;
            shieldEl.style.width = `${Math.max(0, Math.min(100, shPct))}%`;
        }

        const energyEl = document.getElementById('hud-energy-bar');
        if (energyEl) energyEl.style.width = `${Math.max(0, Math.min(100, (this.energy / 100) * 100))}%`;

        const speedEl = document.getElementById('hud-speed');
        if (speedEl) speedEl.innerText = `SPD: ${Math.floor(this.speed * 10)} | WPN: ${this.currentWeapon.toUpperCase()}`;

        const targetEl = document.getElementById('hud-target-text');
        if (targetEl && this.scene && this.mesh) {
            let targetInfo = null;
            let locked = false;

            const lock = this.scene.targetLock;
            if (lock && lock.mesh && typeof lock.health === 'number' && lock.health > 0) {
                const idx = Array.isArray(this.scene.enemies) ? this.scene.enemies.indexOf(lock) : -1;
                targetInfo = {
                    target: lock,
                    dist: lock.mesh.position.distanceTo(this.mesh.position),
                    index: idx
                };
                locked = true;
            } else if (typeof this.scene.getBestEnemyTarget === 'function') {
                targetInfo = this.scene.getBestEnemyTarget(this, 0.95);
            }

            if (targetInfo && targetInfo.target) {
                const best = targetInfo.target;
                const bestDist = targetInfo.dist;
                const bestIndex = targetInfo.index;

                const hasShields = typeof best.maxShields === 'number' && Number.isFinite(best.maxShields) && best.maxShields > 0;
                const hasHull = typeof best.maxHealth === 'number' && Number.isFinite(best.maxHealth) && best.maxHealth > 0;

                const shPct = hasShields && typeof best.shields === 'number' ? Math.round((best.shields / best.maxShields) * 100) : 0;
                const hullPct = hasHull ? Math.round((best.health / best.maxHealth) * 100) : Math.round(best.health);
                const hullText = hasHull ? `${hullPct}%` : `${hullPct}`;

                const idxText = (typeof bestIndex === 'number' && Number.isFinite(bestIndex) && bestIndex >= 0) ? String(bestIndex + 1) : '?';
                const lockText = locked ? ' [LOCK]' : '';
                targetEl.innerText = `TGT: ENEMY ${idxText}${lockText} | DST: ${Math.round(bestDist)} | SHD: ${shPct}% | HULL: ${hullText}`;
            } else {
                targetEl.innerText = 'TGT: NONE';
            }

            const crosshair = document.getElementById('crosshair');
            if (crosshair) crosshair.classList.toggle('locked', !!this.scene.targetLock);
        } else if (targetEl) {
            targetEl.innerText = 'TGT: NONE';
        }
    }
}

class EnemyAI {
    constructor(scene, pos, opts = null) {
        this.scene = scene;

        const o = (opts && typeof opts === 'object') ? opts : {};
        const archetype = (o.archetype != null) ? String(o.archetype).toLowerCase() : 'fighter';
        this.archetype = archetype;

        let maxHealth = 50;
        let maxShields = 25;
        let shieldRegenRate = 6;
        let shieldRegenDelay = 3.0;
        let speed = 15;
        let weaponDamage = 10;
        let tintHex = null;

        if (archetype === 'scout') {
            maxHealth = 35;
            maxShields = 12;
            speed = 22;
            weaponDamage = 8;
            tintHex = 0x44aaff;
        } else if (archetype === 'ace') {
            maxHealth = 70;
            maxShields = 40;
            speed = 18;
            weaponDamage = 14;
            tintHex = 0xff4444;
        } else if (archetype === 'tank') {
            maxHealth = 110;
            maxShields = 65;
            shieldRegenRate = 8;
            speed = 10;
            weaponDamage = 12;
            tintHex = 0x66ff66;
        }

        if (typeof o.maxHealth === 'number' && Number.isFinite(o.maxHealth)) maxHealth = o.maxHealth;
        if (typeof o.maxShields === 'number' && Number.isFinite(o.maxShields)) maxShields = o.maxShields;
        if (typeof o.shieldRegenRate === 'number' && Number.isFinite(o.shieldRegenRate)) shieldRegenRate = o.shieldRegenRate;
        if (typeof o.shieldRegenDelay === 'number' && Number.isFinite(o.shieldRegenDelay)) shieldRegenDelay = o.shieldRegenDelay;
        if (typeof o.speed === 'number' && Number.isFinite(o.speed)) speed = o.speed;
        if (typeof o.weaponDamage === 'number' && Number.isFinite(o.weaponDamage)) weaponDamage = o.weaponDamage;
        if (o.tint != null) {
            const t = Number(o.tint);
            if (Number.isFinite(t)) tintHex = t;
        }

        this.maxHealth = maxHealth;
        this.health = this.maxHealth;

        this.maxShields = Math.max(0, maxShields);
        this.shields = this.maxShields;
        this.shieldRegenRate = shieldRegenRate;
        this.shieldRegenDelay = shieldRegenDelay;
        this.shieldRegenTimer = 0;
        this.weaponDamage = weaponDamage;

        // Mesh (Enemy Style)
        this.mesh = new THREE.Group();
        // TIE Fighter Style
        // TIE Fighter Style (High Fidelity)
        const cockpitGeo = new THREE.SphereGeometry(1.5, 32, 32); // High poly
        const cockpitMat = new THREE.MeshPhysicalMaterial({
            color: 0x888888, // TIE Grey
            metalness: 0.6,
            roughness: 0.3,
            clearcoat: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        this.mesh.add(cockpit);

        // Window Frame (Detail)
        const windowFrameGeo = new THREE.TorusGeometry(0.8, 0.1, 16, 32);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const frame = new THREE.Mesh(windowFrameGeo, frameMat);
        frame.position.z = 1.4;
        this.mesh.add(frame);

        // Window Glass
        const windowGeo = new THREE.CircleGeometry(0.8, 32);
        const windowMat = new THREE.MeshPhysicalMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.0,
            clearcoat: 1.0,
            emissive: 0xaa0000,
            emissiveIntensity: 0.2
        });
        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.z = 1.35; // Front of sphere
        this.mesh.add(win);

        // Solar Panels (Hexagonal)
        const panelGeo = new THREE.CylinderGeometry(4, 4, 0.1, 6);
        panelGeo.rotateX(Math.PI / 2);
        panelGeo.rotateZ(Math.PI / 2); // Vertical

        const panelMat = new THREE.MeshPhysicalMaterial({
            color: 0x111111,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const panelFrameMat = new THREE.MeshPhysicalMaterial({ color: 0x666666, metalness: 0.7, clearcoat: 0.5 });

        const createPanel = (x) => {
            const p = new THREE.Mesh(panelGeo, panelMat);
            p.position.x = x;
            this.mesh.add(p);
            // Center Detail
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8), panelFrameMat);
            hub.rotation.z = Math.PI / 2;
            p.add(hub);
            // Bracing (The Star pattern)
            for (let i = 0; i < 3; i++) {
                const strut = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 0.1), panelFrameMat);
                strut.rotation.z = Math.PI / 2;
                strut.rotation.x = (Math.PI / 3) * i;
                p.add(strut);
            }
        };

        createPanel(-3.5);
        createPanel(3.5);

        // Struts connecting wings to body
        const strutGeo = new THREE.CylinderGeometry(0.4, 0.4, 7, 16);
        strutGeo.rotateZ(Math.PI / 2);
        const strut = new THREE.Mesh(strutGeo, panelFrameMat);
        this.mesh.add(strut);

        this.mesh.position.set(pos.x, pos.y, pos.z);

        if (tintHex != null) {
            const tint = new THREE.Color(tintHex);
            this.mesh.traverse(obj => {
                if (!obj) return;
                const mat = obj.material;
                if (!mat) return;
                const mats = Array.isArray(mat) ? mat : [mat];
                for (let i = 0; i < mats.length; i++) {
                    const m = mats[i];
                    if (!m) continue;
                    if (m.color && m.color.isColor) {
                        m.color.lerp(tint, 0.35);
                    }
                    if (m.emissive && m.emissive.isColor) {
                        m.emissive.lerp(tint, 0.18);
                    }
                }
            });
        }

        this.state = 'chase';
        this.speed = speed;

        this.velocity = new THREE.Vector3();
        this._prevPos = this.mesh.position.clone();
    }

    update(dt, player) {
        if (!player) return;

        // STATE MACHINE AI
        // 0: Idle, 1: Chase, 2: Attack Run, 3: Evade
        if (!this.stateTimer) this.stateTimer = 0;
        this.stateTimer -= dt;

        if (this.maxShields > 0) {
            if (this.shieldRegenTimer > 0) {
                this.shieldRegenTimer = Math.max(0, this.shieldRegenTimer - dt);
            } else if (this.shields < this.maxShields && this.shieldRegenRate > 0) {
                this.shields = Math.min(this.maxShields, this.shields + this.shieldRegenRate * dt);
            }
        }

        const dist = this.mesh.position.distanceTo(player.mesh.position);

        // State Transitions
        if (this.state === 'chase') {
            if (dist < 40) { this.state = 'attack'; this.stateTimer = 3.0; } // Attack for 3s
        } else if (this.state === 'attack') {
            if (this.stateTimer <= 0 || dist < 10) { this.state = 'evade'; this.stateTimer = 2.0; } // Break off
        } else if (this.state === 'evade') {
            if (this.stateTimer <= 0) this.state = 'chase'; // Re-engage
        }

        // Logic
        if (this.state === 'chase') {
            // Smooth turn towards player
            const targetPos = player.mesh.position.clone();
            const lookMatrix = new THREE.Matrix4().lookAt(this.mesh.position, targetPos, new THREE.Vector3(0, 1, 0));
            const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
            this.mesh.quaternion.slerp(targetQuat, 2.0 * dt);

            this.mesh.translateZ(-this.speed * dt); // Forward
        }
        else if (this.state === 'attack') {
            // Lock on and accelerate
            this.mesh.lookAt(player.mesh.position); // Hard lock (scary)
            this.mesh.translateZ(-this.speed * 1.5 * dt); // Boost

            // Fire!
            if (Math.random() > 0.95) {
                // Fire logic would be here, visual only for AI right now? 
                // We should add AI shooting:
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
                const firePos = this.mesh.position.clone().add(fwd.clone().multiplyScalar(2));
                this.scene.projectileSystem.fire(firePos, fwd, 'enemy', 'laser', this.weaponDamage);
            }
        }
        else if (this.state === 'evade') {
            // Bank hard and random
            this.mesh.rotateZ(2.0 * dt);
            this.mesh.translateZ(-this.speed * 1.2 * dt);
            this.mesh.translateY(10 * dt); // Strafe up
        }

        const dtSafe = (typeof dt === 'number' && Number.isFinite(dt) && dt > 0) ? dt : 0;
        if (!this._prevPos) this._prevPos = this.mesh.position.clone();
        if (this.velocity && dtSafe > 0) {
            this.velocity.subVectors(this.mesh.position, this._prevPos).multiplyScalar(1 / dtSafe);
        }
        if (this._prevPos) this._prevPos.copy(this.mesh.position);
    }

    takeDamage(amount) {
        const dmg = (typeof amount === 'number' && Number.isFinite(amount)) ? amount : 0;
        if (dmg <= 0) return;

        let remaining = dmg;

        if (this.maxShields > 0 && this.shields > 0) {
            const absorbed = Math.min(this.shields, remaining);
            this.shields -= absorbed;
            remaining -= absorbed;
            if (absorbed > 0) {
                this.shieldRegenTimer = this.shieldRegenDelay;
            }
        }

        if (remaining > 0) {
            this.health = Math.max(0, this.health - remaining);
        }
        // Flash red?
    }
}



class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = []; // Single Pool
    }

    fire(position, direction, owner, type = 'laser', damage = null) {
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().negate());
        const speed = type === 'missile' ? 60 : 150;
        const velocity = direction.clone().multiplyScalar(speed);
        this.createBullet(owner, position, quat, velocity, type, damage);
    }

    createBullet(owner, position, quaternion, velocity, type, damage) {
        // Recycle or create new
        let bullet = this.projectiles.find(p => !p.active);

        // Check for Type Mismatch in recycled bullet (Simple fix: just create new if mismatch to avoid geometry swapping logic complexity for now)
        if (bullet && bullet.type !== type) {
            this.scene.scene.remove(bullet.mesh);
            const idx = this.projectiles.indexOf(bullet);
            this.projectiles.splice(idx, 1);
            bullet = null; // Force new
        }

        if (!bullet) {
            let mesh;
            // High Fidelity Missile (Asset)
            const missileAsset = assetManager.get('missile');

            if (type === 'missile' && missileAsset) {
                mesh = missileAsset;
                mesh.scale.set(0.2, 0.2, 0.2);
                mesh.rotation.y = Math.PI;
            } else if (type === 'missile') {
                // Procedural Missile Fallback
                const geo = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8);
                geo.rotateX(Math.PI / 2);
                const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
                mesh = new THREE.Mesh(geo, mat);
                
                // Add tiny fins
                const finGeo = new THREE.BoxGeometry(0.4, 0.02, 0.2);
                const finMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
                const fin1 = new THREE.Mesh(finGeo, finMat);
                mesh.add(fin1);
                const fin2 = fin1.clone();
                fin2.rotation.z = Math.PI / 2;
                mesh.add(fin2);
            } else {
                // Fallback Laser Bolt
                const geo = new THREE.CylinderGeometry(0.1, 0.1, 2);
                geo.rotateX(Math.PI / 2);
                const color = owner === 'player' ? 0x00ff00 : 0xff0000;
                const mat = new THREE.MeshBasicMaterial({ color: color });
                mesh = new THREE.Mesh(geo, mat);
            }

            this.scene.scene.add(mesh);
            bullet = { mesh: mesh, active: false };
            this.projectiles.push(bullet);
        }

        if (bullet && type === 'missile') {
            const missileAsset = assetManager.get('missile');
            if (missileAsset && bullet.mesh && bullet.mesh.isMesh) {
                this.scene.scene.remove(bullet.mesh);
                bullet.mesh = missileAsset;
                bullet.mesh.scale.set(0.2, 0.2, 0.2);
                bullet.mesh.rotation.y = Math.PI;
                this.scene.scene.add(bullet.mesh);
            }
        }

        // Reset State
        bullet.active = true;
        bullet.owner = owner;
        bullet.type = type;
        if (typeof damage === 'number' && Number.isFinite(damage)) bullet.damage = damage;
        else bullet.damage = type === 'missile' ? 25 : 10;
        bullet.life = 2.0;
        bullet.mesh.position.copy(position);
        bullet.mesh.quaternion.copy(quaternion);
        bullet.velocity = velocity.clone();
        bullet.mesh.visible = true;

        if (type === 'missile' && bullet.mesh && !bullet.mesh.isMesh) {
            bullet.mesh.rotateY(Math.PI);
        }
    }

    update(dt) {
        for (const p of this.projectiles) {
            if (!p.active) continue;

            p.mesh.position.addScaledVector(p.velocity, dt); // Use stored velocity
            p.life -= dt;

            if (p.life <= 0) {
                p.active = false;
                p.mesh.visible = false;
            }
        }
    }
}

class CapitalShip {
    constructor(scene, pos) {
        this.scene = scene;
        this.health = 5000;
        this.mesh = new THREE.Group();
        this.mesh.position.copy(pos);

        // Procedural Mothership (Star Destroyer-ish)
        const hullGeo = new THREE.ConeGeometry(20, 100, 4, 1, false, Math.PI * 0.25);
        hullGeo.rotateX(Math.PI / 2);
        hullGeo.rotateY(Math.PI / 4); // Flatten
        hullGeo.scale(1, 0.3, 1);

        const hullMat = new THREE.MeshPhysicalMaterial({
            color: 0x555555, metalness: 0.7, roughness: 0.6, clearcoat: 0.2
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        this.mesh.add(hull);

        // Bridge Tower
        const bridgeGeo = new THREE.BoxGeometry(10, 5, 8);
        const bridge = new THREE.Mesh(bridgeGeo, hullMat);
        bridge.position.set(0, 8, 20);
        this.mesh.add(bridge);

        // Engines
        const engineGeo = new THREE.CylinderGeometry(2, 2, 4, 16);
        engineGeo.rotateX(Math.PI / 2);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x0044ff, emissiveIntensity: 2 });

        [-5, 0, 5].forEach(x => {
            const eng = new THREE.Mesh(engineGeo, engineMat);
            eng.position.set(x, 0, 45); // Rear
            this.mesh.add(eng);
        });

        scene.scene.add(this.mesh);

        this.spawnTimer = 0;
    }

    update(dt) {
        // Slow rotation
        this.mesh.rotation.y += 0.05 * dt;

        // Spawn Enemies
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 10.0; // Every 10s
            // Spawn Fighters
            if (this.scene.enemies.length < 10) {
                const spawnPos = this.mesh.position.clone();
                spawnPos.y -= 10; // Hangar bay
                this.scene.spawnEnemy({ x: spawnPos.x, y: spawnPos.y, z: spawnPos.z + 20 });
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            // Massive Explosion
            this.scene.createExplosion(this.mesh.position, 20.0);
            this.mesh.visible = false;
            // Should remove from scene properly but this works for visual
        }
    }
}

window.SpaceCombatScene = SpaceCombatScene;
