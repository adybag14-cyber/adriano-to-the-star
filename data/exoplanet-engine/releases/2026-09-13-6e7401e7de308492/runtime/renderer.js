import * as T from '../vendor/exoplanet/0.186.0/three.webgpu.js';
import { TerrainManager } from './terrain-manager.js';
import { surfaceDetail } from './materials.js';
import { terrainField, normalize, pickSurface } from './terrain.js';
import {
    loadObserver,
    stellarColour,
    integrateXYZ,
    xyzToLinearSRGB,
    bandRadiance,
    albedoMaterial,
} from './colour.js';
import { C, planck } from './physics.js';
import { opticalFunctions, createOpticalMaterial } from './optics.js';
import { invariant } from './contracts.js';
const {
    Fn,
    If,
    float,
    vec3,
    vec4,
    uniform,
    attribute,
    positionWorld,
    positionLocal,
    positionView,
    normalView,
    texture,
    uv,
    mx_noise_float,
} = T.TSL;
export const QUALITIES = Object.freeze({
    Low: {
        scale: 0.65,
        maxPixels: 1000000,
        maxTiles: 54,
        errorPixels: 7,
        steps: 12,
        history: 0.55,
    },
    Medium: {
        scale: 0.8,
        maxPixels: 1600000,
        maxTiles: 96,
        errorPixels: 4,
        steps: 20,
        history: 0.7,
    },
    High: {
        scale: 1,
        maxPixels: 2600000,
        maxTiles: 150,
        errorPixels: 2.5,
        steps: 32,
        history: 0.8,
    },
    Ultra: {
        scale: 1,
        maxPixels: 4400000,
        maxTiles: 225,
        errorPixels: 1.5,
        steps: 48,
        history: 0.87,
    },
    'Scientific Workstation': {
        scale: 1,
        maxPixels: 8300000,
        maxTiles: 300,
        errorPixels: 0.85,
        steps: 80,
        history: 0.93,
    },
});
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function halton(index, base) {
    let f = 1,
        r = 0;
    while (index > 0) {
        f /= base;
        r += f * (index % base);
        index = Math.floor(index / base);
    }
    return r;
}
function proceduralNormal(height) {
    return Fn(() => {
        const dx = positionView.dFdx(),
            dy = positionView.dFdy(),
            n = normalView,
            r1 = dy.cross(n),
            r2 = n.cross(dx),
            det = dx.dot(r1);
        return n
            .sub(
                r1
                    .mul(height.dFdx())
                    .add(r2.mul(height.dFdy()))
                    .mul(det.sign())
                    .div(det.abs().max(1e-18))
            )
            .normalize();
    })();
}
export class PlanetRenderer {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.disposed = false;
        this.resources = [];
        this.frameIntervals = [];
        this.renderTimes = [];
        this.frame = 0;
        this.originRebases = 0;
        this.ready = false;
        this.controller = new AbortController();
    }
    async start(packet, recipe, settings = {}) {
        invariant(
            packet.decision.mode !== 'identity_placeholder' || recipe.sandbox,
            'Placeholder cannot allocate a physical renderer'
        );
        this.packet = packet;
        this.recipe = recipe;
        this.settings = {
            azimuth: 0.4,
            elevation: 0.2,
            range: 4,
            exposure: 1,
            paused: true,
            quality: 'High',
            view: 'human',
            time: 0,
            ...settings,
        };
        this.settings.range = clamp(Number(this.settings.range) || 4, 0.9, 60);
        this.settings.elevation = clamp(
            Number.isFinite(Number(this.settings.elevation))
                ? Number(this.settings.elevation)
                : 0.2,
            -1.5,
            1.5
        );
        this.settings.exposure = clamp(Number(this.settings.exposure) || 1, 0.05, 16);
        this.quality = QUALITIES[this.settings.quality] || QUALITIES.High;
        const begin = performance.now();
        this.canvas = document.createElement('canvas');
        this.canvas.dataset.engineGpu = '1';
        this.canvas.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;touch-action:none;';
        this.container.prepend(this.canvas);
        const forceWebGL =
            this.settings.backend === 'WebGL2' ||
            new URLSearchParams(location.search).get('backend') === 'webgl2';
        this.renderer = new T.WebGPURenderer({
            canvas: this.canvas,
            forceWebGL,
            antialias: true,
            alpha: false,
        });
        const timeout = new Promise((_, reject) => {
            this.initTimer = setTimeout(
                () => reject(new Error('GPU initialisation exceeded 15 seconds')),
                15000
            );
        });
        try {
            await Promise.race([this.renderer.init(), timeout]);
        } finally {
            clearTimeout(this.initTimer);
        }
        if (this.disposed) {
            this.renderer.dispose();
            return;
        }
        this.backend = this.renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2';
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = this.settings.exposure;
        this.scene = new T.Scene();
        this.scene.background = new T.Color(0.002, 0.004, 0.008);
        this.camera = new T.PerspectiveCamera(48, 1, 1e-6, 80);
        this.camera.position.set(0, 0, 0);
        this.quadCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.quadScene = new T.Scene();
        this.quad = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicNodeMaterial());
        // Render-target sampling follows Three's top-left screen convention on
        // both backends; ordinary mesh UVs otherwise invert an odd pass chain.
        const quadUV = this.quad.geometry.getAttribute('uv');
        for (let i = 0; i < quadUV.count; i++) quadUV.setY(i, 1 - quadUV.getY(i));
        this.quad.frustumCulled = false;
        this.quadScene.add(this.quad);
        this.resources.push(this.quad.geometry, this.quad.material);
        const rows = await loadObserver(this.controller.signal);
        if (this.disposed) return;
        const stellar =
            recipe.illumination.kind === 'blackbody'
                ? stellarColour(rows, recipe.illumination.temperature)
                : { linearRGB: [1, 1, 1], label: 'Neutral schematic inspection lighting' };
        this.colourReference = stellar;
        this.albedoReference =
            recipe.reflectance && recipe.illumination.kind === 'blackbody'
                ? albedoMaterial(rows, recipe.illumination.temperature, recipe.reflectance)
                : null;
        this.state = {
            compatibility: this.backend === 'WebGL2',
            time: uniform(this.settings.time),
            sun: uniform(new T.Vector3(1, 0.24, 0.65).normalize()),
            sunColour: uniform(new T.Vector3(...stellar.linearRGB)),
            cameraPlanet: uniform(new T.Vector3()),
            inverseProjection: uniform(new T.Matrix4()),
            cameraWorld: uniform(new T.Matrix4()),
            steps: uniform(this.quality.steps, 'int'),
            jitter: uniform(0.5),
            view: uniform(0),
        };
        this.functions = opticalFunctions(T, recipe, this.state);
        this.sun = new T.DirectionalLight(new T.Color(...stellar.linearRGB), 3.5);
        this.sun.target = new T.Object3D();
        this.scene.add(this.sun, this.sun.target);
        this.material = this.createBodyMaterial(rows);
        this.resources.push(this.material);
        if (recipe.solidSurface) {
            this.terrain = new TerrainManager(
                T,
                this.scene,
                this.material,
                recipe,
                this.quality,
                (error) => this.fail(error)
            );
            await this.terrain.init();
        } else {
            this.body = new T.Mesh(new T.SphereGeometry(1, 128, 64), this.material);
            this.body.userData.feature = 'atmosphere';
            this.scene.add(this.body);
            this.resources.push(this.body.geometry);
        }
        if (this.disposed) return;
        if (recipe.liquid) this.createLiquid(rows);
        if (this.state.compatibility && recipe.atmosphere.pressurePa > 0)
            this.createCompatibilityLayers();
        this.createTargets();
        this.createCompositing();
        this.resize();
        this.bindInput();
        if (this.settings.systemContext) this.systemMode = this.createSystem();
        this.updateCamera();
        this.renderer.onDeviceLost = (info) => {
            if (!this.disposed)
                this.fail(
                    new Error(
                        `Graphics device lost (${info?.reason || 'unknown'}). Re-select the same scenario to recover.`
                    )
                );
        };
        this.canvas.addEventListener(
            'webglcontextlost',
            (event) => {
                event.preventDefault();
                this.fail(new Error('WebGL context lost; evidence and recipe are retained.'));
            },
            { signal: this.controller.signal }
        );
        const device = this.renderer.backend.isWebGPUBackend ? this.renderer.backend.device : null;
        device?.pushErrorScope('validation');
        await this.renderer.compileAsync(this.scene, this.camera);
        for (const material of [this.optical, this.temporal, this.present]) {
            this.quad.material = material;
            await this.renderer.compileAsync(this.quadScene, this.quadCamera);
        }
        const validationError = await device?.popErrorScope();
        if (validationError)
            throw new Error(`GPU pipeline validation failed: ${validationError.message}`);
        if (this.disposed) return;
        this.ready = true;
        this.startupMs = performance.now() - begin;
        this.previousFrame = performance.now();
        this.lastLodUpdate = 0;
        this.settleFrames = 16;
        const loop = (now) => {
            if (this.disposed) return;
            this.animationId = requestAnimationFrame(loop);
            if (this.suspended || document.hidden) return;
            if (this.capturing) return;
            const active =
                !this.settings.paused ||
                this.cameraDirty ||
                this.transition ||
                !this.historyValid ||
                (!this.systemMode &&
                    this.terrain &&
                    (this.terrain.pending.size ||
                        this.terrain.changed ||
                        now < (this.terrain.transitionUntil || 0)));
            if (active)
                this.settleFrames =
                    { Low: 4, Medium: 8, High: 16, Ultra: 24, 'Scientific Workstation': 32 }[
                        this.settings.quality
                    ] || 16;
            if (!active && this.settleFrames <= 0) {
                this.wasIdle = true;
                return;
            }
            try {
                this.render(now);
                this.settleFrames--;
            } catch (error) {
                this.fail(error);
            }
        };
        this.animationId = requestAnimationFrame(loop);
        this.callbacks.onDiagnostics?.();
    }
    createBodyMaterial(rows) {
        const material = new T.MeshStandardNodeMaterial({ roughness: 0.85, metalness: 0 });
        const n = this.recipe.solidSurface
            ? attribute('planetDirection', 'vec3').normalize()
            : positionLocal.normalize();
        const detail = mx_noise_float(n.mul(3200).add(this.recipe.seedInt % 10000));
        if (this.recipe.solidSurface) {
            const detailModel = surfaceDetail(T, this.recipe);
            material.vertexColors = true;
            material.roughnessNode = attribute('roughness', 'float');
            material.colorNode = attribute('color', 'vec3')
                .mul(detail.mul(0.1).add(0.95))
                .mul(detailModel.albedo)
                .mul(this.functions.shadow(n));
            material.normalNode = detailModel.normal;
            this.correctCurvedDepth(material, false);
        } else {
            const warp = mx_noise_float(n.mul(7).add(this.recipe.seedInt % 1000)).mul(0.6),
                belt = n.y.mul(65).add(warp.mul(4)).sin().mul(0.5).add(0.5),
                storm = mx_noise_float(n.mul(24).add(warp)).mul(0.5).add(0.5);
            const cool = this.recipe.family === 'cool-gas',
                a = this.albedoReference
                    ? vec3(...this.albedoReference.linearRGB)
                    : cool
                      ? vec3(0.25, 0.3, 0.32)
                      : vec3(0.39, 0.31, 0.22),
                b = this.albedoReference
                    ? a.mul(0.65)
                    : cool
                      ? vec3(0.1, 0.16, 0.2)
                      : vec3(0.15, 0.12, 0.1);
            material.colorNode = a
                .mix(b, belt.mul(0.7).add(storm.mul(0.3)))
                .mul(this.functions.shadow(n));
        }
        // False-colour outputs use an explicitly uniform reference temperature, never a fake measured map.
        const thermalColour = vec3(
            clamp((this.recipe.referenceTemperature - 150) / 1800, 0, 1),
            clamp((this.recipe.referenceTemperature - 80) / 850, 0, 1) * 0.6,
            clamp(1 - this.recipe.referenceTemperature / 1800, 0, 1) * 0.6
        );
        const natural = material.colorNode;
        material.colorNode = this.state.view.greaterThan(0).select(thermalColour, natural);
        this.thermalRadiance = bandRadiance(this.recipe.referenceTemperature);
        return material;
    }
    correctCurvedDepth(material, referenceSphere) {
        // At orbital scale, a coarse triangle is a chord, not the planet's
        // spherical reference surface. Correct only its depth along the actual
        // camera ray so separately tessellated water and atmospheric integration
        // do not expose the triangle grid. Local views retain their streamed mesh.
        const S = T.TSL;
        material.depthNode = Fn(() => {
            const radius = referenceSphere
                ? float(1)
                : positionWorld
                      .add(this.state.cameraPlanet)
                      .length()
                      .div(attribute('planetDirection', 'vec3').length().max(1e-6));
            const ray = positionWorld.normalize();
            const hit = this.functions.sphere(this.state.cameraPlanet, ray, radius);
            const distance = hit.x.greaterThan(0).select(hit.x, hit.y);
            const corrected = S.cameraViewMatrix.mul(vec4(ray.mul(distance), 1)).z;
            const z = this.state.cameraPlanet
                .length()
                .greaterThan(1.02)
                .select(corrected, positionView.z);
            return S.viewZToPerspectiveDepth(z, S.cameraNear, S.cameraFar);
        })();
    }
    createLiquid(rows) {
        const lava = this.recipe.liquid === 'molten silicate',
            material = new T.MeshPhysicalNodeMaterial({
                color: lava ? 0x17100a : 0x02151e,
                roughness: lava ? 0.46 : 0.18,
                metalness: 0,
                ior: lava ? 1.5 : 1.333,
                transmission: 0,
            });
        const wave = mx_noise_float(
            positionLocal
                .normalize()
                .mul(lava ? 180 : 1800)
                .add(vec3(this.state.time.mul(0.014), 0, this.state.time.mul(0.009)))
        );
        material.normalNode = proceduralNormal(wave.mul(lava ? 0.000001 : 0.0000003));
        this.correctCurvedDepth(material, true);
        if (lava) {
            const xyz = integrateXYZ(rows, (w) => planck(w, this.recipe.referenceTemperature)),
                rgb = xyzToLinearSRGB(xyz),
                illumination = this.recipe.illumination;
            const dilution =
                illumination.hostRadiusMetres && illumination.separationMetres
                    ? (illumination.hostRadiusMetres / illumination.separationMetres) ** 2
                    : null;
            const incident = dilution
                ? this.colourReference.rawXYZ.map((v) => v * Math.PI * dilution)
                : integrateXYZ(rows, () => 1000 / 470e-9);
            const normalization = 3.5 / Math.max(...xyzToLinearSRGB(incident));
            material.emissiveNode = vec3(...rgb.map((v) => Math.max(0, v * normalization)));
            this.lavaReference = {
                temperature: this.recipe.referenceTemperature,
                model: 'Planck thermal emission; common reflected/emitted radiance normalization',
                xyz,
                illuminationNormalization: dilution
                    ? 'Adopted stellar radius and separation'
                    : 'Schematic equal-energy inspection irradiance of 1000 W/m²',
            };
        }
        this.liquid = new T.Mesh(new T.SphereGeometry(1, 192, 96), material);
        this.liquid.userData.feature = 'liquids';
        this.scene.add(this.liquid);
        this.resources.push(this.liquid.geometry, material);
    }
    createTargets() {
        this.opaque = new T.RenderTarget(1, 1, { type: T.HalfFloatType, depthBuffer: true });
        this.opaque.depthTexture = new T.DepthTexture(1, 1, T.UnsignedIntType);
        this.transport = new T.RenderTarget(1, 1, { type: T.HalfFloatType, depthBuffer: false });
        this.history = [
            new T.RenderTarget(1, 1, { type: T.HalfFloatType, depthBuffer: false }),
            new T.RenderTarget(1, 1, { type: T.HalfFloatType, depthBuffer: false }),
        ];
        this.resources.push(this.opaque, this.transport, ...this.history);
        this.historyIndex = 0;
        this.historyValid = false;
    }
    createCompatibilityLayers() {
        const S = T.TSL,
            h = this.recipe.atmosphere.profile.height / this.recipe.referenceRadiusMetres;
        this.compatibilityLayers = [];
        if (this.recipe.clouds.enabled) {
            const radius =
                1 +
                (h * (this.recipe.clouds.baseScaleHeights + this.recipe.clouds.topScaleHeights)) /
                    2;
            const material = new T.MeshStandardNodeMaterial({
                color: 0xd1d5d7,
                roughness: 1,
                transparent: true,
                depthWrite: false,
            });
            const point = S.positionLocal.normalize().mul(radius),
                density = this.functions.density(point);
            const slant = S.normalWorld
                .dot(S.cameraPosition.sub(S.positionWorld).normalize())
                .abs()
                .max(0.2);
            material.opacityNode = S.float(1)
                .sub(density.mul(this.recipe.clouds.opticalDepth).div(slant).negate().exp())
                .clamp(0, 0.995);
            const mesh = new T.Mesh(new T.SphereGeometry(radius, 96, 48), material);
            mesh.userData.feature = 'clouds';
            mesh.renderOrder = 2;
            this.scene.add(mesh);
            this.compatibilityLayers.push(mesh);
            this.resources.push(mesh.geometry, material);
        }
        const radius = 1 + h * 4,
            material = new T.MeshBasicNodeMaterial({
                transparent: true,
                depthWrite: false,
                side: T.FrontSide,
            });
        const view = S.cameraPosition.sub(S.positionWorld).normalize(),
            limb = S.float(1).sub(S.normalWorld.dot(view).abs()).clamp(0, 1);
        const beta = this.functions.beta,
            tau = Math.max(...beta) * h * Math.sqrt((2 * Math.PI) / Math.max(h, 1e-6));
        const colour = beta.map((v) => v / Math.max(...beta));
        material.colorNode = S.vec3(...colour)
            .mul(this.state.sunColour)
            .mul(S.normalWorld.dot(this.state.sun).add(0.15).max(0));
        material.opacityNode = limb
            .mul(limb)
            .mul(limb)
            .mul(1 - Math.exp(-Math.min(tau, 4)))
            .mul(0.6);
        const mesh = new T.Mesh(new T.SphereGeometry(radius, 96, 48), material);
        mesh.userData.feature = 'atmosphere';
        mesh.renderOrder = 3;
        this.scene.add(mesh);
        this.compatibilityLayers.push(mesh);
        this.resources.push(mesh.geometry, material);
    }
    createCompositing() {
        this.optical = createOpticalMaterial(
            T,
            this.opaque.texture,
            this.opaque.depthTexture,
            this.recipe,
            this.state,
            this.functions
        );
        this.resources.push(this.optical);
        this.identityOptical = new T.MeshBasicNodeMaterial({ depthTest: false, depthWrite: false });
        this.identityOptical.fragmentNode = texture(this.opaque.texture, uv());
        this.identityOptical.toneMapped = false;
        this.resources.push(this.identityOptical);
        this.currentTexture = texture(this.transport.texture, uv());
        this.previousTexture = texture(this.history[0].texture, uv());
        this.historyWeight = uniform(0);
        this.texel = uniform(new T.Vector2(1, 1));
        this.temporal = new T.MeshBasicNodeMaterial({ depthTest: false, depthWrite: false });
        this.temporal.toneMapped = false;
        this.temporal.fragmentNode = Fn(() => {
            const c = this.currentTexture.toVar(),
                low = c.rgb.toVar(),
                high = c.rgb.toVar();
            for (const [x, y] of [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
            ]) {
                const v = texture(
                    this.transport.texture,
                    uv().add(this.texel.mul(T.TSL.vec2(x, y)))
                ).rgb;
                low.assign(low.min(v));
                high.assign(high.max(v));
            }
            const history = this.previousTexture.rgb.clamp(low, high);
            return vec4(c.rgb.mix(history, this.historyWeight), 1);
        })();
        this.presentTexture = texture(this.history[1].texture, uv());
        this.present = new T.MeshBasicNodeMaterial({ depthTest: false, depthWrite: false });
        this.present.fragmentNode = this.presentTexture;
        this.present.toneMapped = true;
        this.resources.push(this.temporal, this.present);
    }
    renderQuad(material, target) {
        this.quad.material = material;
        this.renderer.setRenderTarget(target);
        this.renderer.render(this.quadScene, this.quadCamera);
    }
    resize() {
        if (!this.renderer || !this.opaque) return;
        const box = this.container.getBoundingClientRect(),
            w = Math.max(1, Math.round(box.width)),
            h = Math.max(1, Math.round(box.height));
        const dpr = Math.min(devicePixelRatio || 1, 2),
            scale =
                Math.min(dpr * this.quality.scale, Math.sqrt(this.quality.maxPixels / (w * h))) *
                (this.dynamicScale || 1);
        this.renderer.setPixelRatio(scale);
        this.renderer.setSize(w, h, false);
        const size = this.renderer.getDrawingBufferSize(new T.Vector2());
        for (const t of [this.opaque, this.transport, ...this.history]) t.setSize(size.x, size.y);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.texel.value.set(1 / size.x, 1 / size.y);
        this.historyValid = false;
        this.viewport = [w, h];
        this.framebuffer = [size.x, size.y];
    }
    bindInput() {
        let drag = null;
        const signal = this.controller.signal;
        this.canvas.addEventListener(
            'pointerdown',
            (event) => {
                drag = [event.clientX, event.clientY];
                this.dragStart = [...drag];
                this.canvas.setPointerCapture(event.pointerId);
                this.container.focus();
            },
            { signal }
        );
        this.canvas.addEventListener(
            'pointermove',
            (event) => {
                if (!drag) return;
                this.settings.azimuth -= (event.clientX - drag[0]) * 0.005;
                this.settings.elevation = clamp(
                    this.settings.elevation + (event.clientY - drag[1]) * 0.005,
                    -1.52,
                    1.52
                );
                drag = [event.clientX, event.clientY];
                this.cameraDirty = true;
                this.historyValid = false;
            },
            { signal }
        );
        this.canvas.addEventListener(
            'pointerup',
            (event) => {
                if (
                    drag &&
                    Math.hypot(
                        event.clientX - this.dragStart[0],
                        event.clientY - this.dragStart[1]
                    ) < 5
                )
                    this.pick(event);
                drag = null;
            },
            { signal }
        );
        this.canvas.addEventListener(
            'pointercancel',
            () => {
                drag = null;
            },
            { signal }
        );
        this.canvas.addEventListener(
            'wheel',
            (event) => {
                event.preventDefault();
                const altitude = Math.max(this.settings.range - 1, 0.000001);
                this.settings.range = 1 + altitude * Math.exp(event.deltaY * 0.0015);
                this.cameraDirty = true;
                this.historyValid = false;
            },
            { signal, passive: false }
        );
    }
    updateCamera() {
        const s = this.settings,
            dir = [
                Math.cos(s.elevation) * Math.sin(s.azimuth),
                Math.sin(s.elevation),
                Math.cos(s.elevation) * Math.cos(s.azimuth),
            ],
            r = this.recipe.referenceRadiusMetres;
        const field = terrainField(dir, this.recipe),
            surface = 1 + (this.recipe.liquid ? Math.max(0, field.height) : field.height) / r;
        const minimum = this.recipe.solidSurface
            ? surface + Math.max(3 / r, 1e-7)
            : 1 + (this.recipe.atmosphere.profile.height * 0.25) / r;
        s.range = clamp(s.range, minimum, this.transition ? 1e7 : 60);
        this.cameraPlanet = dir.map((x) => x * s.range);
        this.state.cameraPlanet.value.set(...this.cameraPlanet);
        const nearView = s.range < 1.015 && this.recipe.solidSurface;
        let target = [0, 0, 0];
        if (nearView) {
            const tangent = normalize([Math.cos(s.azimuth), 0, -Math.sin(s.azimuth)]);
            target = dir.map((x, i) => x * surface + tangent[i] * 0.018);
            this.camera.up.set(...dir);
        } else this.camera.up.set(0, 1, 0);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(...target.map((v, i) => v - this.cameraPlanet[i]));
        this.camera.near = Math.max(1e-7, Math.min(0.005, (s.range - surface) * 0.15));
        this.camera.far = Math.max(80, s.range * 2);
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();
        this.state.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
        this.state.cameraWorld.value.copy(this.camera.matrixWorld);
        for (const body of [this.body, this.liquid, ...(this.compatibilityLayers || [])])
            if (body) body.position.set(...this.cameraPlanet.map((v) => -v));
        this.sun.position
            .copy(this.state.sun.value)
            .multiplyScalar(30)
            .sub(this.state.cameraPlanet.value);
        this.sun.target.position.copy(this.state.cameraPlanet.value).negate();
        this.sun.target.updateMatrixWorld();
        this.altitudeMetres = (s.range - surface) * r;
        this.originRebases++;
        this.cameraDirty = false;
        if (this.systemMode && this.system) {
            const distance = this.system.separation * 2.3,
                mid = this.system.starPosition.clone().multiplyScalar(0.5);
            this.system.camera.position
                .copy(mid)
                .add(new T.Vector3(...dir).multiplyScalar(distance));
            this.system.camera.lookAt(mid);
            this.system.camera.updateMatrixWorld();
        }
    }
    render(now) {
        const trace = this.frame === 0 && new URLSearchParams(location.search).has('traceEngine');
        if (trace) console.info('engine frame: begin', this.framebuffer);
        const start = performance.now(),
            dt = Math.min(0.05, (now - this.previousFrame) / 1000),
            focused = document.hasFocus();
        if (this.frame > 20 && focused && this.previousFocused && !this.wasIdle) {
            this.frameIntervals.push(now - this.previousFrame);
            if (this.frameIntervals.length > 1200) this.frameIntervals.shift();
        }
        this.previousFrame = now;
        this.previousFocused = focused;
        this.wasIdle = false;
        if (!this.settings.paused) this.settings.time += dt;
        this.state.time.value = this.settings.time;
        this.state.jitter.value = 0.25 + halton((this.frame % 32) + 1, 2) * 0.5;
        if (this.transition) {
            const t = clamp((now - this.transition.began) / this.transition.duration, 0, 1),
                weight = t * t * (3 - 2 * t);
            this.settings.range = Math.exp(
                Math.log(this.transition.from) * (1 - weight) +
                    Math.log(this.transition.to) * weight
            );
            this.cameraDirty = true;
            this.historyValid = false;
            if (t === 1) this.transition = null;
        }
        if (this.cameraDirty || this.frame === 0) this.updateCamera();
        if (
            this.terrain &&
            !this.systemMode &&
            (this.frame === 0 ||
                now - this.lastLodUpdate > 100 ||
                this.terrain.pending.size ||
                this.terrain.changed)
        ) {
            this.terrain.update(
                this.cameraPlanet,
                this.framebuffer[1],
                (this.camera.fov * Math.PI) / 180
            );
            this.lastLodUpdate = now;
        }
        this.terrain?.rebase(this.cameraPlanet, now);
        this.renderer.toneMappingExposure = this.settings.exposure;
        this.renderer.setRenderTarget(this.opaque);
        if (trace) console.info('engine frame: opaque');
        this.renderer.render(
            this.systemMode ? this.system.scene : this.scene,
            this.systemMode ? this.system.camera : this.camera
        );
        this.renderQuad(
            this.analytical || this.systemMode || this.state.compatibility
                ? this.identityOptical
                : this.optical,
            this.transport
        );
        if (trace) console.info('engine frame: optical complete');
        const previous = this.history[this.historyIndex],
            next = this.history[1 - this.historyIndex];
        this.previousTexture.value = previous.texture;
        this.historyWeight.value = this.historyValid
            ? this.settings.paused
                ? this.quality.history
                : 0.45
            : 0;
        this.renderQuad(this.temporal, next);
        if (trace) console.info('engine frame: temporal complete');
        this.presentTexture.value = next.texture;
        this.renderQuad(this.present, null);
        this.historyIndex = 1 - this.historyIndex;
        this.historyValid = true;
        this.frame++;
        this.renderTimes.push(performance.now() - start);
        if (this.renderTimes.length > 1200) this.renderTimes.shift();
        if (this.frame % 180 === 0) {
            const sorted = [...this.frameIntervals].sort((a, b) => a - b),
                p95 = sorted[Math.floor(sorted.length * 0.95)];
            if (focused && p95 > 30 && (this.dynamicScale || 1) > 0.6) {
                this.dynamicScale = (this.dynamicScale || 1) * 0.9;
                this.resize();
            }
            this.callbacks.onDiagnostics?.();
        }
    }
    keyboard(key) {
        if (key === 'ArrowLeft') this.settings.azimuth -= 0.06;
        if (key === 'ArrowRight') this.settings.azimuth += 0.06;
        if (key === 'ArrowUp')
            this.settings.elevation = clamp(this.settings.elevation + 0.06, -1.52, 1.52);
        if (key === 'ArrowDown')
            this.settings.elevation = clamp(this.settings.elevation - 0.06, -1.52, 1.52);
        if (['+', '='].includes(key)) this.settings.range = 1 + (this.settings.range - 1) * 0.8;
        if (key === '-') this.settings.range = 1 + (this.settings.range - 1) * 1.25;
        this.cameraDirty = true;
        this.historyValid = false;
    }
    createSystem() {
        if (this.system) return true;
        const starRadius = this.recipe.illumination.hostRadiusMetres,
            separation = this.recipe.illumination.separationMetres;
        if (!(starRadius > 0 && separation > starRadius)) return false;
        const scene = new T.Scene();
        scene.background = new T.Color(0.002, 0.004, 0.008);
        const a = separation / C.au,
            starPosition = this.state.sun.value.clone().multiplyScalar(-a);
        const starMaterial = new T.MeshBasicNodeMaterial({
                color: new T.Color(...this.colourReference.linearRGB),
            }),
            star = new T.Mesh(new T.SphereGeometry(starRadius / C.au, 48, 32), starMaterial);
        star.position.copy(starPosition);
        scene.add(star);
        const planetMaterial = new T.MeshStandardNodeMaterial({ color: 0x70939f, roughness: 1 }),
            planet = new T.Mesh(
                new T.SphereGeometry(this.recipe.referenceRadiusMetres / C.au, 32, 16),
                planetMaterial
            );
        scene.add(planet);
        const light = new T.DirectionalLight(new T.Color(...this.colourReference.linearRGB), 3.5);
        light.position.copy(starPosition);
        scene.add(light);
        const camera = new T.PerspectiveCamera(48, this.camera.aspect, a * 0.00001, a * 20);
        this.system = { scene, camera, separation: a, starPosition, planet };
        this.resources.push(star.geometry, starMaterial, planet.geometry, planetMaterial);
        return true;
    }
    journey(stage) {
        const wasSystem = this.systemMode;
        if (stage === 'system') {
            this.systemMode = this.createSystem();
            if (this.systemMode) {
                this.transition = null;
                this.cameraDirty = true;
                this.historyValid = false;
                return;
            }
        }
        this.systemMode = false;
        const r = this.recipe.referenceRadiusMetres,
            h = this.recipe.atmosphere.profile.height / r,
            n = normalize(this.cameraPlanet || [0, 0, 1]),
            field = terrainField(n, this.recipe),
            surface = 1 + (this.recipe.liquid ? Math.max(0, field.height) : field.height) / r;
        const ranges = {
                system: 35,
                approach: 8,
                disc: 4,
                orbit: 2,
                'low-orbit': 1.08,
                atmosphere: 1 + h * 2,
                region: surface + 0.009,
                surface: surface + 50 / r,
            },
            to = ranges[stage] || 4,
            from = wasSystem
                ? (this.system.camera.position.length() * C.au) / r
                : this.settings.range;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) this.settings.range = to;
        else
            this.transition = {
                from,
                to,
                began: performance.now(),
                duration: wasSystem ? 1800 : 900,
            };
        this.cameraDirty = true;
        this.historyValid = false;
    }
    reset() {
        this.systemMode = false;
        this.transition = null;
        Object.assign(this.settings, { azimuth: 0.4, elevation: 0.2, range: 4 });
        this.cameraDirty = true;
        this.historyValid = false;
    }
    setQuality(name) {
        this.settings.quality = name;
        this.quality = QUALITIES[name] || QUALITIES.High;
        if (this.state) this.state.steps.value = this.quality.steps;
        if (this.terrain) this.terrain.quality = this.quality;
        this.dynamicScale = 1;
        this.resize();
    }
    setPaused(paused) {
        this.settings.paused = paused;
        this.historyValid = false;
    }
    setExposure(value) {
        this.settings.exposure = clamp(Number(value), 0.05, 16);
        this.historyValid = false;
    }
    setSuspended(suspended) {
        this.suspended = suspended;
        this.previousFrame = performance.now();
        this.historyValid = false;
    }
    setView(view) {
        if (!this.state) {
            this.settings.view = view;
            return;
        }
        this.settings.view = view;
        this.analytical = ['infrared', 'thermal', 'temperature'].includes(view);
        for (const layer of this.compatibilityLayers || []) layer.visible = !this.analytical;
        this.state.view.value = 0;
        this.historyValid = false;
        let material = this.material;
        if (this.analytical) {
            const value =
                view === 'infrared'
                    ? clamp(Math.log10(1 + this.thermalRadiance) / 4, 0, 1)
                    : view === 'thermal'
                      ? clamp(
                            Math.log10(1 + 5.670374419e-8 * this.recipe.referenceTemperature ** 4) /
                                7,
                            0,
                            1
                        )
                      : clamp(this.recipe.referenceTemperature / 3000, 0, 1);
            const colour = new T.Color(
                clamp(value * 2, 0, 1),
                clamp(value * 2 - 0.6, 0, 1),
                clamp(0.35 - value * 0.3, 0, 1)
            );
            if (!this.analyticalMaterial) {
                this.analyticalMaterial = new T.MeshBasicNodeMaterial();
                this.resources.push(this.analyticalMaterial);
            }
            this.analyticalMaterial.color.copy(colour);
            material = this.analyticalMaterial;
        }
        if (this.body) this.body.material = material;
        if (this.terrain) {
            this.terrain.material = material;
            for (const e of this.terrain.tiles.values()) e.mesh.material = material;
        }
        if (this.liquid) {
            this.liquidNaturalMaterial ??= this.liquid.material;
            this.liquid.material = this.analytical ? material : this.liquidNaturalMaterial;
        }
    }
    pick(event) {
        if (!this.recipe.solidSurface) {
            this.callbacks.onFeature?.('atmosphere');
            return;
        }
        const box = this.canvas.getBoundingClientRect(),
            point = new T.Vector3(
                ((event.clientX - box.left) / box.width) * 2 - 1,
                -((event.clientY - box.top) / box.height) * 2 + 1,
                1
            )
                .unproject(this.camera)
                .normalize();
        const hit = pickSurface(this.cameraPlanet, point.toArray(), this.recipe);
        this.lastPick = hit
            ? { planetFrame: hit, field: terrainField(normalize(hit), this.recipe) }
            : null;
        this.callbacks.onFeature?.(
            hit && this.recipe.liquid && this.lastPick.field.height < 0 ? 'liquids' : 'terrain'
        );
    }
    viewState() {
        return { ...this.settings, backend: this.backend, systemContext: Boolean(this.systemMode) };
    }
    diagnostics() {
        const sorted = [...this.frameIntervals].sort((a, b) => a - b),
            percent = (p) => (sorted.length ? sorted[Math.floor((sorted.length - 1) * p)] : null);
        return {
            backend: this.backend,
            threeRevision: T.REVISION,
            ready: this.ready,
            startupMs: this.startupMs,
            framebuffer: this.framebuffer,
            viewport: this.viewport,
            frames: sorted.length,
            p50: percent(0.5),
            p95: percent(0.95),
            p99: percent(0.99),
            maximum: sorted.at(-1),
            transportSteps: this.state?.compatibility ? 0 : this.quality?.steps,
            opticalBackendApproximation: this.state?.compatibility
                ? 'WebGL2 depth-tested cloud shell and optical-depth-scaled limb proxy; cloud and atmosphere presence retained'
                : 'WebGPU sampled optical paths',
            allocatedRenderTargets: 4,
            compatibilityLayers:
                this.compatibilityLayers?.map((mesh) => mesh.userData.feature) || [],
            estimatedTargetBytes: (this.framebuffer?.[0] || 0) * (this.framebuffer?.[1] || 0) * 36,
            originRebases: this.originRebases,
            altitudeMetres: this.recipe?.solidSurface ? this.altitudeMetres : null,
            altitudeReference: this.recipe?.solidSurface
                ? 'Selected conditional height field'
                : 'No solid landing surface',
            passOrder: [
                'opaque geometry/liquid',
                this.state?.compatibility
                    ? 'depth-tested cloud and optical-depth limb proxies'
                    : 'single optical integration to opaque depth',
                'neighbourhood-clamped temporal resolve',
                'ACES exposure and sRGB',
            ],
            illumination: this.colourReference?.label,
            visibleAlbedoModel: this.albedoReference || null,
            opacityModel: this.recipe?.atmosphere.model,
            cloudModel: this.recipe?.clouds.dynamics,
            thermalBand: 'Simulated blackbody radiance integrated over 8–14 µm, W m−2 sr−1',
            thermalReferenceRadiance: this.thermalRadiance,
            gpuMemoryMeasurement:
                'Application allocation estimate; driver residency is not observable.',
            ...this.terrain?.diagnostics(),
            coordinateFrame: this.systemMode
                ? 'System AU frame at reference separation; orientation is schematic'
                : 'CPU double-precision planet frame; GPU positions relative to the camera',
        };
    }
    async captureCanvas() {
        if (!this.ready) return this.canvas;
        const wasPaused = this.settings.paused,
            oldFrame = this.frame,
            samples = this.settings.quality === 'Scientific Workstation' ? 32 : 1;
        this.capturing = true;
        this.settings.paused = true;
        this.frame = 0;
        this.historyValid = false;
        try {
            for (let i = 0; i < samples; i++) {
                if (samples > 1) await new Promise(requestAnimationFrame);
                if (this.disposed) throw new Error('Capture cancelled');
                this.render(performance.now());
            }
            if (this.renderer.backend.isWebGPUBackend)
                await this.renderer.backend.device.queue.onSubmittedWorkDone();
            this.lastCapture = { ...this.viewState(), samples, deterministicJitterStart: 0 };
            return this.canvas;
        } finally {
            this.capturing = false;
            this.settings.paused = wasPaused;
            this.frame = oldFrame + samples;
        }
    }
    fail(error) {
        if (!this.disposed) {
            this.callbacks.onFailure?.(error);
        }
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        clearTimeout(this.initTimer);
        cancelAnimationFrame(this.animationId);
        this.controller.abort();
        this.terrain?.dispose();
        for (const r of new Set(this.resources)) r.dispose?.();
        this.resources = [];
        this.renderer?.dispose().catch?.(() => {});
        this.canvas?.remove();
    }
}
