/* global THREE */
(() => {
    'use strict';

    const VERSION = 'pioneer-cinematic-v1';
    const TIERS = Object.freeze({
        low: { stars: 1800, nebula: 0.66, aurora: false },
        medium: { stars: 4200, nebula: 0.84, aurora: true },
        high: { stars: 7600, nebula: 1, aurora: true },
        ultra: { stars: 11000, nebula: 1, aurora: true }
    });
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const fract = (v) => v - Math.floor(v);
    function randomGenerator(seed) {
        let state = seed >>> 0;
        return () => {
            state += 0x6D2B79F5;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function noise(x, y, z) {
        const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        let fx = x - ix, fy = y - iy, fz = z - iz;
        fx *= fx * (3 - 2 * fx); fy *= fy * (3 - 2 * fy); fz *= fz * (3 - 2 * fz);
        const h = (a, b, c) => {
            let bits = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2147483647);
            bits = Math.imul(bits ^ (bits >>> 13), 1274126177);
            return ((bits ^ (bits >>> 16)) >>> 0) / 4294967295;
        };
        const a = h(ix, iy, iz) * (1 - fx) + h(ix + 1, iy, iz) * fx;
        const b = h(ix, iy + 1, iz) * (1 - fx) + h(ix + 1, iy + 1, iz) * fx;
        const c = h(ix, iy, iz + 1) * (1 - fx) + h(ix + 1, iy, iz + 1) * fx;
        const d = h(ix, iy + 1, iz + 1) * (1 - fx) + h(ix + 1, iy + 1, iz + 1) * fx;
        return (a * (1 - fy) + b * fy) * (1 - fz) + (c * (1 - fy) + d * fy) * fz;
    }
    function fbm(x, y, z) {
        let value = 0, amplitude = 0.56;
        for (let i = 0; i < 4; i++) {
            value += noise(x, y, z) * amplitude;
            x = x * 2.09 + 7.1; y = y * 2.09 + 11.3; z = z * 2.09 + 3.7;
            amplitude *= 0.46;
        }
        return value;
    }

    // A seamless, baked celestial sphere: no fragment-noise cost at runtime and no asset request.
    // The stylised dust/emission panorama is scenery, not an astronomical sky survey.
    function createNebulaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 512;
        const context = canvas.getContext('2d');
        const image = context.createImageData(canvas.width, canvas.height);
        for (let y = 0; y < canvas.height; y++) {
            const latitude = (y / (canvas.height - 1) - 0.5) * Math.PI;
            const sy = Math.sin(latitude), cr = Math.cos(latitude);
            for (let x = 0; x < canvas.width; x++) {
                const longitude = x / (canvas.width - 1) * Math.PI * 2;
                const sx = Math.cos(longitude) * cr, sz = Math.sin(longitude) * cr;
                const turbulence = fbm(sx * 3.8 + 19, sy * 3.8 + 8, sz * 3.8 - 11);
                const warpedLatitude = sy + sx * 0.40 + sz * 0.18 + (turbulence - 0.5) * 0.29;
                const band = Math.exp(-warpedLatitude * warpedLatitude * 19);
                const detail = fbm(sx * 10 + 81, sy * 10 + 5, sz * 10 + 8);
                const gas = Math.pow(clamp(turbulence * 1.62 - 0.41, 0, 1), 1.7) * band;
                const dust = Math.pow(clamp(detail * 1.72 - 0.48, 0, 1), 1.35);
                const illuminated = gas * (0.34 + detail * 0.95) * (1 - dust * 0.82);
                const filament = Math.pow(clamp(1 - Math.abs(detail - 0.51) * 10, 0, 1), 4) * band * gas;
                const lobe = Math.max(0, sx * 0.65 + sz * 0.75);
                const cyan = clamp(0.50 + sz * 0.42 - sx * 0.34, 0, 1);
                const core = Math.pow(band, 2) * (0.025 + detail * 0.055) * (1 - dust);
                const i = (y * canvas.width + x) * 4;
                image.data[i] = 2 + illuminated * (40 + (1 - cyan) * 58) + core * 150 + filament * 62;
                image.data[i + 1] = 5 + illuminated * (70 + cyan * 56) + core * 166 + filament * 93;
                image.data[i + 2] = 12 + illuminated * (138 + lobe * 38) + core * 185 + filament * 143;
                image.data[i + 3] = 255;
            }
        }
        context.putImageData(image, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        // The legacy Pioneer pipeline outputs custom shader colors directly. Keep this baked
        // display-referred map in that same contract instead of decoding it twice into black.
        texture.encoding = THREE.LinearEncoding;
        texture.name = 'PioneerBakedNebulaPanorama';
        return texture;
    }

    class PioneerCinematicRenderer {
        constructor(game, options = {}) {
            if (!game?.scene || !game?.camera || !game?.renderer) throw new Error('Pioneer cinematics require an initialized scene, camera and renderer.');
            this.game = game;
            this.scene = game.scene;
            this.camera = game.camera;
            this.renderer = game.renderer;
            this.version = VERSION;
            this.elapsed = 0;
            this.disposed = false;
            this.frameAverage = 16.7;
            this.slowFrames = 0;
            this.adaptiveReductions = 0;
            this.lastPlanet = null;
            this.requestedQuality = 'high';
            this.quality = 'high';
            this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.resources = [];
            this.legacyVisibility = [];
            this.sunDirection = new THREE.Vector3(1, 0.5, 1).normalize();
            this.group = new THREE.Group();
            this.group.name = 'PioneerCinematicEnvironment';
            this.group.userData.pioneerCinematicVersion = VERSION;
            this.scene.add(this.group);
            this.sky = new THREE.Group();
            this.sky.name = 'PioneerCelestialSphere';
            this.group.add(this.sky);
            this.createSky();
            this.createStellarCorona();
            for (const object of [...(game.starLayers || []), game.sunMesh].filter(Boolean)) {
                this.legacyVisibility.push({ object, visible: object.visible });
                object.visible = false;
            }
            // Three r128 uses outputEncoding; the current outputColorSpace path alone is a no-op.
            // Custom terrain shaders preserve their existing linear-light contract.
            this.setQuality(options.quality || game.graphicsSettings?.meshDetail || 'high');
            this.update(0);
        }

        own(resource) { this.resources.push(resource); return resource; }
        decorative(mesh) {
            mesh.raycast = () => {};
            mesh.frustumCulled = false;
            mesh.userData.isPioneerScenery = true;
            return mesh;
        }

        createSky() {
            this.skyRadius = Math.min(860, this.camera.far * 0.87);
            const map = this.own(createNebulaTexture());
            const material = this.own(new THREE.MeshBasicMaterial({ map, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
            const geometry = this.own(new THREE.SphereGeometry(this.skyRadius, 48, 24));
            this.nebula = this.decorative(new THREE.Mesh(geometry, material));
            this.nebula.name = 'PioneerEmissionNebula';
            this.nebula.renderOrder = -1000;
            this.nebula.rotation.set(0.14, 0.62, -0.17);
            this.sky.add(this.nebula);

            const count = TIERS.ultra.stars;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const sizes = new Float32Array(count);
            const phases = new Float32Array(count);
            const random = randomGenerator(1862036);
            const color = new THREE.Color();
            const spectralColors = [0xa6c9ff, 0xc3dbff, 0xe0eaff, 0xfff5df, 0xffdbad];
            for (let i = 0; i < count; i++) {
                const theta = random() * Math.PI * 2;
                const sy = random() * 2 - 1;
                const cr = Math.sqrt(1 - sy * sy);
                const radius = this.skyRadius * (0.91 + random() * 0.04);
                positions[i * 3] = Math.cos(theta) * cr * radius;
                positions[i * 3 + 1] = sy * radius;
                positions[i * 3 + 2] = Math.sin(theta) * cr * radius;
                color.setHex(spectralColors[Math.floor(random() * spectralColors.length)]);
                const magnitude = 0.32 + Math.pow(random(), 4) * 0.96;
                colors[i * 3] = color.r * magnitude;
                colors[i * 3 + 1] = color.g * magnitude;
                colors[i * 3 + 2] = color.b * magnitude;
                sizes[i] = 1.1 + Math.pow(random(), 11) * 4.8;
                phases[i] = random() * Math.PI * 2;
            }
            const starGeometry = this.own(new THREE.BufferGeometry());
            starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            starGeometry.setAttribute('starSize', new THREE.BufferAttribute(sizes, 1));
            starGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
            const starMaterial = this.own(new THREE.ShaderMaterial({
                uniforms: { time: { value: 0 }, pixelRatio: { value: this.renderer.getPixelRatio() }, motion: { value: 1 } },
                vertexShader: `
                    attribute float starSize;
                    attribute float phase;
                    attribute vec3 color;
                    uniform float time;
                    uniform float pixelRatio;
                    uniform float motion;
                    varying vec3 vColor;
                    void main() {
                        vColor = color * (1.0 + sin(time * 0.35 + phase) * 0.055 * motion);
                        gl_PointSize = clamp(starSize * pixelRatio, 1.0, 12.0);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }`,
                fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        vec2 p = gl_PointCoord * 2.0 - 1.0;
                        float r = length(p);
                        if (r > 1.0) discard;
                        float core = exp(-r * r * 12.0);
                        float halo = exp(-r * r * 3.4) * 0.28;
                        gl_FragColor = vec4(vColor * (core + halo), 1.0);
                    }`,
                // Opaque render queue is intentional: distant points must precede opaque planets.
                // Transparent objects are sorted into a later queue regardless of renderOrder.
                transparent: false, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, toneMapped: false
            }));
            this.stars = this.decorative(new THREE.Points(starGeometry, starMaterial));
            this.stars.name = 'PioneerSpectralStarfield';
            this.stars.renderOrder = -999;
            this.sky.add(this.stars);
        }

        createStellarCorona() {
            const geometry = this.own(new THREE.PlaneGeometry(1, 1));
            const material = this.own(new THREE.ShaderMaterial({
                uniforms: { time: { value: 0 }, stellarColor: { value: new THREE.Color(0xffd2a3) }, opacity: { value: 0.92 } },
                vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
                fragmentShader: `
                    uniform float time; uniform vec3 stellarColor; uniform float opacity; varying vec2 vUv;
                    void main() {
                        vec2 p = (vUv - 0.5) * 2.0;
                        float r = length(p);
                        float a = atan(p.y, p.x);
                        float rays = 0.84 + 0.11 * sin(a * 13.0 + time * 0.035) + 0.05 * sin(a * 27.0 - time * 0.025);
                        float halo = exp(-r * 5.8) * rays * (1.0 - smoothstep(0.25, 1.0, r));
                        float core = 1.0 - smoothstep(0.063, 0.093, r);
                        vec3 color = mix(stellarColor, vec3(1.0, 0.95, 0.83), core);
                        gl_FragColor = vec4(color * (halo * 1.6 + core), (halo + core) * opacity);
                    }`,
                transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false, toneMapped: false
            }));
            this.corona = this.decorative(new THREE.Mesh(geometry, material));
            this.corona.name = 'PioneerStellarCorona';
            this.corona.scale.setScalar(115);
            this.corona.renderOrder = 0;
            this.group.add(this.corona);
        }

        releaseWorldEffects() {
            for (const effect of [this.aurora, this.rings]) {
                if (!effect) continue;
                effect.parent?.remove(effect);
                effect.geometry.dispose(); effect.material.dispose();
            }
            this.aurora = null; this.rings = null;
        }

        attachWorld(planet) {
            this.releaseWorldEffects();
            this.lastPlanet = planet || null;
            if (!planet) return;
            const profile = planet.userData?.terrain?.physicalProfile || {};
            const seed = Number(planet.userData?.uniforms?.seed?.value || 186);
            if ((profile.atmosphereRetention || 0) > 0.3 && !['gas', 'giant', 'moon', 'lava', 'volcanic'].includes(profile.worldType)) this.createAurora(planet);
            // Rings belong only to fictional gas-world scenarios. No ring detection is implied for catalog worlds.
            if (['gas', 'giant'].includes(profile.worldType) && profile.provenance !== 'catalog-constrained' && fract(Math.sin(seed * 3.71) * 4317.1) > 0.32) this.createRings(planet, seed);
            this.applyTier();
        }

        createAurora(planet) {
            const material = new THREE.ShaderMaterial({
                uniforms: { time: { value: 0 }, sunDirection: { value: this.sunDirection.clone() } },
                vertexShader: `
                    varying vec3 vLocal; varying vec3 vNormalWorld; varying vec3 vWorld;
                    void main() { vLocal = normalize(position); vNormalWorld = normalize(mat3(modelMatrix) * normal); vec4 p = modelMatrix * vec4(position, 1.0); vWorld = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }`,
                fragmentShader: `
                    varying vec3 vLocal; varying vec3 vNormalWorld; varying vec3 vWorld;
                    uniform float time; uniform vec3 sunDirection;
                    void main() {
                        float lon = atan(vLocal.z, vLocal.x);
                        float waviness = sin(lon * 9.0 + time * 0.10) * 0.014 + sin(lon * 23.0 - time * 0.065) * 0.006;
                        float oval = exp(-pow((abs(vLocal.y) - 0.87 - waviness) * 52.0, 2.0));
                        float curtains = 0.24 + pow(0.5 + 0.5 * sin(lon * 117.0 + sin(lon * 13.0) * 4.0 + time * 0.07), 3.0) * 0.76;
                        float night = 1.0 - smoothstep(-0.2, 0.35, dot(normalize(vNormalWorld), normalize(sunDirection)));
                        float limb = pow(1.0 - abs(dot(normalize(vNormalWorld), normalize(cameraPosition - vWorld))), 0.7);
                        vec3 color = mix(vec3(0.06, 0.85, 0.57), vec3(0.48, 0.22, 0.90), smoothstep(0.87, 0.91, abs(vLocal.y)));
                        float strength = oval * curtains * (0.07 + night * 0.65) * (0.35 + limb * 0.65);
                        gl_FragColor = vec4(color, strength);
                    }`,
                transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false
            });
            this.aurora = this.decorative(new THREE.Mesh(new THREE.SphereGeometry(52.45, 64, 40), material));
            this.aurora.name = 'PioneerAuroralCurtains';
            this.aurora.userData.scenario = 'Procedural magnetic-activity scenery';
            this.aurora.renderOrder = 2;
            planet.add(this.aurora);
        }

        createRings(planet, seed) {
            const material = new THREE.ShaderMaterial({
                uniforms: { sunDirection: { value: this.sunDirection.clone() }, seed: { value: seed % 1000 } },
                vertexShader: `varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNormalWorld; void main() { vLocal = position; vec4 p = modelMatrix * vec4(position, 1.0); vWorld = p.xyz; vNormalWorld = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * p; }`,
                fragmentShader: `
                    varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNormalWorld;
                    uniform vec3 sunDirection; uniform float seed;
                    void main() {
                        float r = length(vLocal.xy); float t = (r - 66.0) / 37.0;
                        float bands = 0.58 + sin(r * 3.9 + seed) * 0.16 + sin(r * 12.7) * 0.08;
                        float gap = smoothstep(0.018, 0.032, abs(t - 0.61));
                        float edge = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.92, 1.0, t));
                        vec3 L = normalize(sunDirection); float behind = max(0.0, -dot(vWorld, L));
                        float axisDistance = length(vWorld + L * behind);
                        float shadow = mix(1.0, smoothstep(48.5, 51.5, axisDistance), step(0.01, behind));
                        vec3 color = mix(vec3(0.32, 0.39, 0.49), vec3(0.77, 0.74, 0.63), bands);
                        float light = 0.28 + abs(dot(normalize(vNormalWorld), L)) * 0.72;
                        gl_FragColor = vec4(color * light * (0.12 + shadow * 0.88), bands * gap * edge * 0.72);
                    }`,
                transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false
            });
            this.rings = this.decorative(new THREE.Mesh(new THREE.RingGeometry(66, 103, 192, 1), material));
            this.rings.name = 'PioneerIcyRingSystem';
            this.rings.rotation.x = Math.PI * 0.5 + 0.20;
            this.rings.rotation.y = 0.12;
            this.rings.userData.scenario = 'Procedural gas-giant ring scenario';
            planet.add(this.rings);
        }

        setQuality(quality, adaptive = false) {
            if (!TIERS[quality]) quality = 'high';
            if (!adaptive) { this.requestedQuality = quality; this.adaptiveReductions = 0; }
            this.quality = quality;
            this.slowFrames = 0;
            this.applyTier();
            return this.getDiagnostics();
        }

        applyTier() {
            const tier = TIERS[this.quality];
            this.stars?.geometry.setDrawRange(0, tier.stars);
            this.nebula?.material.color.setScalar(tier.nebula);
            if (this.aurora) this.aurora.visible = tier.aurora;
        }

        update(deltaSeconds = 0) {
            if (this.disposed || document.hidden) return;
            const game = this.game;
            const traced = Boolean(game.rayTracingRenderer?.isActive?.());
            this.group.visible = !traced;
            if (this.lastPlanet !== game.planetMesh) this.attachWorld(game.planetMesh);
            const photo = Boolean(game.rayTracingRenderer?.isPathTracing?.());
            if (this.aurora) this.aurora.visible = TIERS[this.quality].aurora && !photo;
            if (this.rings) this.rings.visible = !traced;
            this.sky.position.copy(this.camera.position);
            const animate = !this.motionQuery.matches && !photo && game.timeScale !== 0;
            const dt = clamp(Number(deltaSeconds) || 0, 0, 0.08);
            if (animate) this.elapsed += dt;
            this.stars.material.uniforms.time.value = this.elapsed;
            this.stars.material.uniforms.motion.value = animate ? 1 : 0;
            this.stars.material.uniforms.pixelRatio.value = Math.min(2, this.renderer.getPixelRatio());
            this.corona.material.uniforms.time.value = this.elapsed;
            const light = game.suns?.[0]?.light || game.sunLight;
            const source = game.suns?.[0]?.mesh;
            if (source) this.corona.position.copy(source.position);
            else if (light) this.corona.position.copy(light.position).normalize().multiplyScalar(400);
            this.corona.quaternion.copy(this.camera.quaternion);
            if (light) {
                this.sunDirection.copy(light.position).normalize();
                this.corona.material.uniforms.stellarColor.value.copy(light.color);
            }
            for (const effect of [this.aurora, this.rings]) {
                if (!effect) continue;
                effect.material.uniforms.sunDirection.value.copy(this.sunDirection);
                if (effect.material.uniforms.time) effect.material.uniforms.time.value = this.elapsed;
            }
            // Lower only decorative draw counts after sustained slow foreground play. Terrain,
            // physical state, native textures and the user's requested detail remain untouched.
            if (dt > 0 && !traced && !game.isPaused && !game.isGalaxyViewActive && !game.isCombatActive) {
                this.frameAverage = this.frameAverage * 0.985 + dt * 1000 * 0.015;
                this.slowFrames = this.frameAverage > 38 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2);
                if (this.slowFrames > 240 && this.quality !== 'low') {
                    const tiers = ['low', 'medium', 'high', 'ultra'];
                    this.adaptiveReductions++;
                    this.setQuality(tiers[tiers.indexOf(this.quality) - 1], true);
                }
            }
        }

        getDiagnostics() {
            return { version: VERSION, requestedQuality: this.requestedQuality, effectiveQuality: this.quality, starCount: TIERS[this.quality].stars, skyRadius: this.skyRadius, frameAverageMs: Math.round(this.frameAverage * 10) / 10, adaptiveReductions: this.adaptiveReductions, reducedMotion: this.motionQuery.matches, renderDrawCalls: 3 + Number(Boolean(this.aurora?.visible)) + Number(Boolean(this.rings?.visible)), textureSize: '1024x512', style: 'procedural cinematic scenery', disposed: this.disposed };
        }

        dispose() {
            if (this.disposed) return;
            this.disposed = true;
            this.releaseWorldEffects();
            this.scene.remove(this.group);
            this.resources.forEach((resource) => resource.dispose());
            this.resources.length = 0;
            this.legacyVisibility.forEach(({ object, visible }) => { object.visible = visible; });
            this.legacyVisibility.length = 0;
        }
    }
    window.PioneerCinematicRenderer = PioneerCinematicRenderer;
})();
