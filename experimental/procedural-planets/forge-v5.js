import { AdaptiveTerrain } from './forge-terrain.js';
import { isSoftwareWebGL } from '../../renderer-capabilities.js';
import {
    terrainVertex,
    terrainFragment,
    volumeVertex,
    cloudFragment,
    atmosphereFragment,
    compositeVertex,
    compositeFragment,
} from './forge-shaders.js';

const T = window.THREE;
const PRESETS = {
    terran: { water: 0.49, temperature: 289, gas: 0, clouds: 0.52, density: 1 },
    archipelago: { water: 0.61, temperature: 284, gas: 0, clouds: 0.64, density: 1.1 },
    desert: { water: 0.12, temperature: 359, gas: 0, clouds: 0.16, density: 0.35 },
    ice: { water: 0.36, temperature: 185, gas: 0, clouds: 0.24, density: 0.45 },
    alien: { water: 0.32, temperature: 325, gas: 0, clouds: 0.38, density: 1.4 },
    lava: { water: 0.47, temperature: 1250, gas: 0, clouds: 0.12, density: 0.6 },
    gas: { water: 0, temperature: 165, gas: 1, clouds: 0, density: 1.8 },
};

class PlanetaryForgeV5 {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.status = document.getElementById('forge-status');
        this.params = {
            ...PRESETS.terran,
            type: 'terran',
            seed: 731.25,
            scale: 1.8,
            relief: 0.004,
            lights: false,
            atmosphere: true,
            cloudsEnabled: true,
            day: false,
        };
        this.elapsed = 0;
        this.previous = 0;
        this.frameId = 0;
        this.dirty = true;
        this.lastStats = 0;
        this.frames = 0;
        this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
        this.playing = !this.reduced.matches;
        this.bindControls();
        this.syncPauseControl();
        try {
            this.initializeGPU();
        } catch (error) {
            this.initializeCPU(error);
        }
    }
    initializeGPU() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', {
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
        });
        if (!context) throw new Error('WebGL2 is unavailable');
        if (isSoftwareWebGL(context)) {
            context.getExtension('WEBGL_lose_context')?.loseContext();
            throw new Error('WebGL2 is software-rendered in this browser');
        }
        this.renderer = new T.WebGLRenderer({ canvas, context, antialias: true, alpha: false });
        this.renderer.outputEncoding = T.LinearEncoding;
        this.renderer.toneMapping = T.NoToneMapping;
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        this.container.append(canvas);
        canvas.setAttribute('aria-label', 'Planetary Forge v5 interactive adaptive terrain');
        this.scene = new T.Scene();
        this.scene.background = new T.Color(0x000104);
        this.camera = new T.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0.18, 3.5);
        this.controls = new T.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 1.004;
        this.controls.maxDistance = 12;
        this.controls.enablePan = false;
        this.controls.addEventListener('change', () => this.request());
        this.uniforms = {
            uSeed: { value: this.params.seed },
            uScale: { value: 1.8 },
            uWater: { value: 0.49 },
            uRelief: { value: 0.004 },
            uGas: { value: 0 },
            uTemperature: { value: 289 },
            uTime: { value: 0 },
            uLights: { value: 0 },
            uCloudCoverage: { value: 0.52 },
            uCloudDensity: { value: 1 },
            uClouds: { value: 1 },
            uDay: { value: 0 },
            uSun: { value: new T.Vector3(-1, 0.48, 1).normalize() },
            uRotation: { value: new T.Matrix3() },
        };
        this.terrainMaterial = new T.ShaderMaterial({
            vertexShader: terrainVertex,
            fragmentShader: terrainFragment,
            uniforms: this.uniforms,
            extensions: { derivatives: true },
        });
        this.terrain = new AdaptiveTerrain(T, this.terrainMaterial);
        this.scene.add(this.terrain.group);
        const volumeUniforms = () => ({
            uCamera: { value: this.camera.position.clone() },
            uSunLocal: { value: this.uniforms.uSun.value.clone() },
            uDensity: { value: 1 },
            uSeed: { value: this.params.seed },
            uTime: { value: 0 },
            uCoverage: { value: 0.52 },
        });
        this.cloudUniforms = volumeUniforms();
        this.atmosphereUniforms = volumeUniforms();
        this.cloudMaterial = new T.ShaderMaterial({
            vertexShader: volumeVertex,
            fragmentShader: cloudFragment,
            uniforms: this.cloudUniforms,
            transparent: true,
            side: T.BackSide,
            depthTest: false,
            depthWrite: false,
        });
        this.clouds = new T.Mesh(new T.SphereGeometry(1.0028, 96, 64), this.cloudMaterial);
        this.clouds.renderOrder = 3;
        this.scene.add(this.clouds);
        this.atmosphereMaterial = new T.ShaderMaterial({
            vertexShader: volumeVertex,
            fragmentShader: atmosphereFragment,
            uniforms: this.atmosphereUniforms,
            transparent: true,
            side: T.BackSide,
            blending: T.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
        });
        this.atmosphere = new T.Mesh(new T.SphereGeometry(1.035, 96, 64), this.atmosphereMaterial);
        this.atmosphere.renderOrder = 4;
        this.scene.add(this.atmosphere);
        this.createStars();
        const hasFloat = Boolean(context.getExtension('EXT_color_buffer_float'));
        const Target = hasFloat ? T.WebGLMultisampleRenderTarget : T.WebGLRenderTarget;
        this.target = new Target(1, 1, {
            type: hasFloat ? T.HalfFloatType : T.UnsignedByteType,
            format: T.RGBAFormat,
            depthBuffer: true,
        });
        if (hasFloat) this.target.samples = 4;
        this.postScene = new T.Scene();
        this.postCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.postUniforms = {
            uScene: { value: this.target.texture },
            uPixel: { value: new T.Vector2(1, 1) },
            uExposure: { value: 1.05 },
        };
        this.postMaterial = new T.ShaderMaterial({
            vertexShader: compositeVertex,
            fragmentShader: compositeFragment,
            uniforms: this.postUniforms,
            depthTest: false,
            depthWrite: false,
        });
        this.postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), this.postMaterial));
        this.resize();
        this.terrain.update(this.camera, innerHeight);
        this.renderer.compile(this.scene, this.camera);
        this.renderer.compile(this.postScene, this.postCamera);
        if (
            this.renderer.info.programs.some(
                (program) => program.diagnostics && !program.diagnostics.runnable
            )
        )
            throw new Error('The v5 shader pipeline could not compile');
        this.mode = 'webgl2';
        this.container.dataset.renderer = 'webgl2-v5';
        this.container.dataset.engineVersion = '5';
        this.status.textContent =
            'V5 ready · adaptive terrain, GGX oceans, volumetric clouds, optical atmosphere and HDR.';
        document.getElementById('loading').hidden = true;
        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            cancelAnimationFrame(this.frameId);
            this.frameId = 0;
            this.initializeCPU(new Error('Graphics context lost'));
        });
        this.request();
    }
    createStars() {
        const positions = [],
            colours = [],
            random = () => Math.random();
        for (let i = 0; i < 5000; i++) {
            const z = random() * 2 - 1,
                angle = random() * Math.PI * 2,
                r = Math.sqrt(1 - z * z),
                brightness = 0.15 + Math.pow(random(), 5) * 1.7;
            positions.push(Math.cos(angle) * r * 100, Math.sin(angle) * r * 100, z * 100);
            colours.push(
                brightness,
                brightness * (0.88 + random() * 0.12),
                brightness * (0.8 + random() * 0.2)
            );
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new T.Float32BufferAttribute(colours, 3));
        this.stars = new T.Points(
            geometry,
            new T.ShaderMaterial({
                vertexColors: true,
                transparent: true,
                depthWrite: false,
                vertexShader:
                    'varying vec3 vColour;void main(){vColour=color;gl_PointSize=2.2;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
                fragmentShader:
                    'varying vec3 vColour;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;gl_FragColor=vec4(vColour,exp(-r*r*5.0));}',
            })
        );
        this.scene.add(this.stars);
    }
    initializeCPU(error) {
        if (this.mode === 'cpu') return;
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
        this.controls?.dispose();
        this.terrain?.dispose();
        this.renderer?.dispose();
        this.container.replaceChildren();
        this.mode = 'cpu';
        this.container.dataset.renderer = 'cpu-preview-v5';
        this.container.dataset.engineVersion = '5';
        this.status.textContent = `CPU preview · ${error.message}. Detailed terrain and volumetric effects require hardware-accelerated WebGL2.`;
        document.getElementById('forge-telemetry').textContent = 'V5 CPU preview · textured sphere · GPU terrain and volumes unavailable';
        document.getElementById('loading').hidden = true;
        const lights = document.getElementById('enable-city-lights');
        lights.checked = false;
        lights.disabled = true;
        lights.title = 'Settlement lights require the WebGL2 renderer';
        const viewer = {
            container: this.container,
            hdTexturesEnabled: false,
            prefersReducedMotion: false,
            appearanceModel: new window.PlanetaryAppearanceModel(),
        };
        this.cpuViewer = viewer;
        this.cpu = new window.EducationSoftwareRenderer(viewer);
        this.updateCPU();
    }
    updateCPU() {
        if (!this.cpu) return;
        const p = this.params;
        const palette = Array.from({ length: 64 }, (_, i) =>
            i / 63 < p.water
                ? [5, 24, 43]
                : p.temperature > 650
                  ? [92, 36, 17]
                  : p.temperature < 220
                    ? [183, 205, 217]
                    : [
                          90 + Math.round(i * 0.3),
                          85 + Math.round(i * 0.4),
                          48 + Math.round(i * 0.25),
                      ]
        );
        const model = {
            modelVersion: 'forge-v5-cpu-preview',
            planetId: `forge-${p.seed}`,
            planetName: 'Generated planet',
            seed: Math.round(p.seed * 1000),
            generatedFromSnapshot: 'procedural',
            evidence: { class: 'illustrative', spatialConstraint: 'none' },
            physical: { equilibriumTemperatureK: p.temperature },
            appearance: {
                palette,
                banding: Boolean(p.gas),
                terrainScale: p.scale / 1.8,
                craterStrength: p.gas ? 0 : 0.3,
                cloudOpacity: p.cloudsEnabled ? p.clouds * 0.6 : 0,
                atmosphereOpacity: p.atmosphere ? p.density * 0.14 : 0,
                atmosphereColour: [68, 145, 221],
            },
        };
        this.cpu.load(
            { planetaryModel: model, speed: this.playing ? 0.0005 : 0, day: p.day },
            'Generated planet'
        );
    }
    resize() {
        if (this.cpu) {
            this.cpu.resize();
            return;
        }
        if (!this.renderer) return;
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
        const size = this.renderer.getDrawingBufferSize(new T.Vector2());
        this.target?.setSize(size.x, size.y);
        this.postUniforms?.uPixel.value.set(1 / size.x, 1 / size.y);
        this.dirty = true;
        this.request();
    }
    bindControls() {
        const input = (id, key, digits) =>
            document.getElementById(id).addEventListener('input', (event) => {
                this.params[key] = Number(event.target.value);
                document.getElementById(
                    `${id === 'water-level' ? 'water' : id === 'roughness' ? 'roughness' : id === 'atmosphere-density' ? 'atmosphere' : 'cloud'}-value`
                ).textContent = this.params[key].toFixed(digits);
                this.apply();
            });
        input('water-level', 'water', 2);
        input('roughness', 'scale', 1);
        input('atmosphere-density', 'density', 2);
        input('cloud-coverage', 'clouds', 2);
        for (const [id, key] of [
            ['enable-clouds', 'cloudsEnabled'],
            ['enable-atmosphere', 'atmosphere'],
            ['enable-city-lights', 'lights'],
        ])
            document.getElementById(id).addEventListener('change', (event) => {
                this.params[key] = event.target.checked;
                this.apply();
            });
        document.getElementById('planet-type').addEventListener('change', (event) => {
            Object.assign(this.params, PRESETS[event.target.value], { type: event.target.value });
            for (const [id, key, label, digits] of [
                ['water-level', 'water', 'water-value', 2],
                ['atmosphere-density', 'density', 'atmosphere-value', 2],
                ['cloud-coverage', 'clouds', 'cloud-value', 2],
            ]) {
                document.getElementById(id).value = this.params[key];
                document.getElementById(label).textContent = this.params[key].toFixed(digits);
            }
            this.generate();
        });
        document.getElementById('generate-btn').addEventListener('click', () => this.generate());
        document.getElementById('day-mode-btn').addEventListener('click', (event) => {
            this.params.day = !this.params.day;
            event.target.setAttribute('aria-pressed', String(this.params.day));
            event.target.textContent = this.params.day
                ? 'Restore oblique sunlight'
                : 'Face the daylight';
            this.apply();
        });
        document.getElementById('pause-forge').addEventListener('click', (event) => {
            this.playing = !this.playing;
            event.target.setAttribute('aria-pressed', String(!this.playing));
            event.target.textContent = this.playing ? 'Pause rotation' : 'Resume rotation';
            this.previous = 0;
            this.apply();
        });
        document.getElementById('reset-camera-btn').addEventListener('click', () => {
            if (this.controls) {
                this.camera.position.set(0, 0.18, 3.5);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
            if (this.cpu) {
                this.cpu.zoom = 1;
                this.cpu.yaw = -0.72;
                this.cpu.pitch = 0.05;
                this.cpu.resize();
            }
            this.status.textContent = 'Camera reset to orbital overview.';
            this.request();
        });
        addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => {
            this.previous = 0;
            if (document.hidden) {
                cancelAnimationFrame(this.frameId);
                this.frameId = 0;
            } else this.request();
        });
        this.reduced.addEventListener('change', (event) => {
            this.playing = !event.matches;
            this.syncPauseControl();
            this.previous = 0;
            this.apply();
        });
    }
    syncPauseControl() {
        const button = document.getElementById('pause-forge');
        button.setAttribute('aria-pressed', String(!this.playing));
        button.textContent = this.playing ? 'Pause rotation' : 'Resume rotation';
    }
    generate() {
        this.params.seed = Math.floor(Math.random() * 1000000) / 100;
        this.status.textContent = `Generated ${this.params.type} world · seed ${this.params.seed.toFixed(2)} · fictional terrain.`;
        this.apply();
    }
    apply() {
        if (this.cpu) {
            clearTimeout(this.cpuUpdateTimer);
            this.cpuUpdateTimer = setTimeout(() => this.updateCPU(), 180);
            return;
        }
        if (!this.uniforms) return;
        const p = this.params,
            u = this.uniforms;
        for (const [key, value] of Object.entries({
            uSeed: p.seed,
            uScale: p.scale,
            uWater: p.water,
            uRelief: p.relief,
            uGas: p.gas,
            uTemperature: p.temperature,
            uLights: Number(p.lights),
            uClouds: Number(p.cloudsEnabled),
            uCloudCoverage: p.clouds,
            uCloudDensity: p.density,
            uDay: Number(p.day),
        }))
            u[key].value = value;
        this.cloudUniforms.uSeed.value = p.seed;
        this.cloudUniforms.uCoverage.value = p.clouds;
        this.cloudUniforms.uDensity.value = p.density;
        this.atmosphereUniforms.uDensity.value = p.density;
        this.clouds.visible = p.cloudsEnabled && !p.gas;
        this.atmosphere.visible = p.atmosphere;
        this.dirty = true;
        this.request();
    }
    request() {
        if (this.mode === 'cpu' || this.frameId || document.hidden) return;
        this.dirty = true;
        this.frameId = requestAnimationFrame((time) => this.frame(time));
    }
    frame(time) {
        this.frameId = 0;
        if (document.hidden || this.mode !== 'webgl2') return;
        const dt = Math.min(0.05, this.previous ? (time - this.previous) / 1000 : 0);
        this.previous = time;
        const changed = this.controls.update();
        if (this.playing) {
            this.elapsed += dt;
            this.terrain.group.rotation.y += dt * 0.012;
        }
        this.camera.near = Math.max(
            0.0001,
            Math.min(0.15, (this.camera.position.length() - 1) * 0.05)
        );
        this.camera.updateProjectionMatrix();
        this.terrain.update(this.camera, innerHeight);
        this.terrain.group.updateMatrixWorld(true);
        this.uniforms.uRotation.value.setFromMatrix4(this.terrain.group.matrixWorld);
        const rotation = this.terrain.group.quaternion.clone();
        this.clouds.quaternion.copy(rotation);
        this.atmosphere.quaternion.copy(rotation);
        const inverse = rotation.clone().invert(),
            sun = this.params.day
                ? this.camera.position.clone().normalize()
                : new T.Vector3(-1, 0.48, 1).normalize();
        this.uniforms.uSun.value.copy(sun);
        this.uniforms.uTime.value = this.elapsed;
        for (const uniforms of [this.cloudUniforms, this.atmosphereUniforms]) {
            uniforms.uCamera.value.copy(this.camera.position).applyQuaternion(inverse);
            uniforms.uSunLocal.value.copy(sun).applyQuaternion(inverse);
            uniforms.uTime.value = this.elapsed;
        }
        this.renderer.setRenderTarget(this.target);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.postCamera);
        this.frames++;
        this.dirty = false;
        if (
            time - this.lastStats > 500 ||
            (!this.playing && !this.terrain.stats.pendingRefinement)
        ) {
            const stats = this.terrain.stats;
            document.getElementById('forge-telemetry').textContent =
                `V5 · ${stats.triangles.toLocaleString()} terrain triangles · LOD ${stats.maxLevel} · altitude ${Math.max(0, (this.camera.position.length() - 1) * 6371).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
            this.container.dataset.triangles = String(stats.triangles);
            this.container.dataset.frames = String(this.frames);
            this.lastStats = time;
        }
        if (this.playing || changed || this.terrain.stats.pendingRefinement) this.request();
    }
}
window.planetForgeV5 = new PlanetaryForgeV5();
