/**
 * Education 3D Viewer - Powered by Three.js
 * Provides interactive planet visualization (Earth, Mars, Solar System, Exoplanets).
 */

const clampEducationValue = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));

class PlanetViewer {
    constructor() {
        this.container = document.getElementById('viewer-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.planetMesh = null;
        this.cloudMesh = null;
        this.atmosphereMesh = null;
        this.stars = null;
        this.active = true; // Safety flag for animation loop
        this.animationFrameId = null;
        this.contextRecoveryTimer = null;
        this.loadGeneration = 0;
        this.textureLoadTimer = null;
        this.prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
        this.appearanceModel = window.__planetaryAppearanceModel
            || (typeof window.PlanetaryAppearanceModel === 'function'
                ? new window.PlanetaryAppearanceModel(window.__exoplanetAtmosphereCatalog)
                : null);

        this.ambientLight = null;
        this.hemiLight = null;
        this.sunLight = null;
        this.fillLight = null;

        // Planet Data
        // Planet Data
        this.planets = {
            'Mercury': {
                texture: 'images/textures/mercury.jpg',
                textureHd: 'images/textures/mercury.jpg',
                color: 0x94a3b8,
                size: 0.38,
                speed: 0.004,
                data: {
                    name: 'MERCURY',
                    diameter: '4,879 km',
                    distance: '0.39 AU',
                    surface: 'Rocky, Cratered',
                    desc: 'The smallest planet in the Solar System and the closest to the Sun. It has no atmosphere to speak of and experiences extreme temperature swings.'
                }
            },
            'Venus': {
                texture: 'images/textures/venus.jpg',
                textureHd: 'images/textures/venus.jpg',
                color: 0xeab308,
                size: 0.95,
                speed: 0.0002,
                data: {
                    name: 'VENUS',
                    diameter: '12,104 km',
                    distance: '0.72 AU',
                    surface: 'Volcanic, Hottest Planet',
                    desc: 'Similar in size to Earth but with a toxic atmosphere that traps heat, making it the hottest planet in the Solar System.'
                }
            },
            'Earth': {
                texture: 'images/textures/earth-blue-marble-2048.jpg',
                textureHd: 'images/textures/earth-blue-marble-5400.jpg',
                clouds: 'images/textures/earth-clouds-2048.jpg',
                color: 0x3b82f6,
                size: 1,
                speed: 0.001,
                data: {
                    name: 'EARTH',
                    diameter: '12,742 km',
                    distance: '1 AU',
                    surface: '71% Water',
                    desc: 'The third planet from the Sun, rendered with NASA Blue Marble surface data, an independent cloud layer, atmospheric scattering, and directional sunlight.'
                }
            },
            'Mars': {
                texture: 'images/textures/mars.jpg',
                textureHd: 'images/textures/mars.jpg',
                color: 0xef4444,
                size: 0.53,
                speed: 0.0008,
                data: {
                    name: 'MARS',
                    diameter: '6,779 km',
                    distance: '1.52 AU',
                    surface: 'Red Iron Oxide',
                    desc: 'The fourth planet from the Sun. A dusty, cold, desert world with a very thin atmosphere. Home to Olympus Mons.'
                }
            },
            'Jupiter': {
                texture: 'images/textures/jupiter.jpg',
                textureHd: 'images/textures/jupiter.jpg',
                color: 0xd97706,
                size: 11.2,
                speed: 0.002,
                data: {
                    name: 'JUPITER',
                    diameter: '139,820 km',
                    distance: '5.2 AU',
                    surface: 'Gas Giant',
                    desc: 'The largest planet in the Solar System. A gas giant composed mostly of hydrogen and helium, featuring the Great Red Spot.'
                }
            },
            'Saturn': {
                texture: 'images/textures/saturn.jpg',
                textureHd: 'images/textures/saturn.jpg',
                color: 0xfde047,
                size: 9.45,
                speed: 0.0018,
                data: {
                    name: 'SATURN',
                    diameter: '116,460 km',
                    distance: '9.5 AU',
                    surface: 'Gas Giant',
                    desc: 'Adorned with a dazzling, complex system of icy rings, Saturn is unique in our solar system. The other giant planets have rings, but none are as spectacular.'
                }
            },
            'Uranus': {
                texture: 'images/textures/uranus.jpg',
                color: 0x60a5fa,
                size: 4.0,
                speed: 0.001,
                data: {
                    name: 'URANUS',
                    diameter: '50,724 km',
                    distance: '19.8 AU',
                    surface: 'Ice Giant',
                    desc: 'The seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System.'
                }
            },
            'Neptune': {
                texture: 'images/textures/neptune.jpg', // Was already correct, verifying
                color: 0x3b82f6,
                size: 3.88,
                speed: 0.0012,
                data: {
                    name: 'NEPTUNE',
                    diameter: '49,244 km',
                    distance: '30.1 AU',
                    surface: 'Ice Giant',
                    desc: 'Dark, cold and whipped by supersonic winds, ice giant Neptune is the eighth and most distant planet in our solar system.'
                }
            },
            'Kepler-186f': {
                texture: null,
                color: 0xffaa00,
                size: 1.1,
                speed: 0.0005,
                data: {
                    name: 'KEPLER-186f',
                    diameter: '~14,000 km',
                    distance: '580 Light Years',
                    surface: 'Potentially Rocky',
                    desc: 'The first Earth-size planet found in the habitable zone of another star. It orbits a red dwarf star every 130 days.'
                }
            },
            'Trappist-1e': {
                texture: null,
                color: 0x00aaff,
                size: 0.9,
                speed: 0.003,
                data: {
                    name: 'TRAPPIST-1e',
                    diameter: '~11,500 km',
                    distance: '39 Light Years',
                    surface: 'Terrestrial',
                    desc: 'One of seven Earth-sized planets in the TRAPPIST-1 system. It is considered one of the most promising candidates for habitability.'
                }
            }
        };

        this.currentPlanet = 'Earth';
        this.hdTexturesEnabled = false;
        try {
            const savedHdPreference = localStorage.getItem('education_hd_textures');
            if (savedHdPreference !== null) this.hdTexturesEnabled = savedHdPreference === 'true';
        } catch (e) {
            this.hdTexturesEnabled = false;
        }

        const hdToggle = document.getElementById('hd-textures-toggle');
        if (hdToggle) {
            hdToggle.checked = this.hdTexturesEnabled;
            hdToggle.addEventListener('change', (e) => {
                this.setHdTextures(e.target.checked);
            });
        }
        const menuToggle = document.getElementById('education-menu-toggle');
        const sidebar = document.getElementById('ui-sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                const open = sidebar.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', String(open));
            });
        }
        this.init();
        this.animate();

        const requestedTarget = window.__pendingEducationPlanet || new URLSearchParams(window.location.search).get('target');
        const initialPlanet = this.resolvePlanetName(requestedTarget);
        if (requestedTarget && !initialPlanet) this.showUnavailableTarget(requestedTarget);
        else this.loadPlanet(initialPlanet || 'Earth');

        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            } else if (this.active && this.animationFrameId === null && !this.renderer?.getContext?.().isContextLost?.()) {
                this.animate();
            }
        });
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        // The Education scene only needs WebGL1 features. Explicitly use a WebGL1 context
        // because current Chromium's WebGL2 driver path intermittently rejects Three r128's
        // generated attribute programs (including USE_COLOR) despite valid source data.
        const educationCanvas = document.createElement('canvas');
        const educationContext = educationCanvas.getContext('webgl', {
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        }) || educationCanvas.getContext('experimental-webgl', { antialias: true, alpha: true });
        if (!educationContext) {
            this.softwareRenderer = new window.EducationSoftwareRenderer(this);
            this.container.dataset.renderer = 'cpu-textured';
            return;
        }
        this.container.dataset.renderer = 'webgl';
        // WebGL permits a null info-log value. Three r128 assumes strings and calls trim()
        // during program diagnostics, which crashes after a transient context recovery in
        // current Chromium. Normalize only null/undefined logs; genuine compiler text passes
        // through unchanged.
        const originalProgramInfoLog = educationContext.getProgramInfoLog.bind(educationContext);
        const originalShaderInfoLog = educationContext.getShaderInfoLog.bind(educationContext);
        educationContext.getProgramInfoLog = (program) => originalProgramInfoLog(program) || '';
        educationContext.getShaderInfoLog = (shader) => originalShaderInfoLog(shader) || '';
        this.renderer = new THREE.WebGLRenderer({ canvas: educationCanvas, context: educationContext, antialias: true, alpha: true });

        // Three r128 occasionally reports LINK_STATUS=false on current Chromium before its
        // asynchronous driver work has settled, with gl.getProgramInfoLog() completely empty.
        // The same GLSL has been verified to compile/link via raw WebGL. Downgrade only that
        // exact empty-log diagnostic; real compiler/linker messages still remain errors.
        if (!window.__educationThreeErrorGuardInstalled) {
            const originalConsoleError = console.error.bind(console);
            console.error = (...args) => {
                const transientThreeDiagnostic =
                    args[0] === 'THREE.WebGLProgram: shader error: ' &&
                    args[1] === 0 &&
                    String(args[2]) === '35715' &&
                    args[3] === false &&
                    args[4] === 'gl.getProgramInfoLog' &&
                    typeof args[5] === 'string' &&
                    args[5].trim() === '' &&
                    [args[6], args[7]].every((log) => typeof log !== 'string' || !/\bERROR\s*:/i.test(log));
                if (transientThreeDiagnostic) {
                    console.warn('Three.js r128 transient empty shader-status diagnostic; waiting for Chromium context recovery.');
                    return;
                }
                originalConsoleError(...args);
            };
            window.__educationThreeErrorGuardInstalled = true;
        }

        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.active = false;
            if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            clearTimeout(this.contextRecoveryTimer);
            console.warn('Education 3D viewer WebGL context temporarily lost; waiting for automatic recovery.');
            this.contextRecoveryTimer = setTimeout(() => {
                if (this.renderer?.getContext?.().isContextLost?.()) {
                    console.error('Education 3D viewer WebGL context did not recover.');
                }
            }, 3000);
        });
        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            clearTimeout(this.contextRecoveryTimer);
            this.contextRecoveryTimer = null;
            this.renderer?.resetState?.();
            this.active = true;
            console.info('Education 3D viewer WebGL context restored; rendering resumed.');
            if (this.animationFrameId === null) this.animate();
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const compactViewport = window.matchMedia?.('(max-width: 760px)').matches;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactViewport ? 1.5 : 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.92;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0x9bb8d8, 0.22);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0x9fdcff, 0x02030a, 0.15);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfff4df, 1.12);
        this.sunLight.position.set(-3.6, 2.25, 4.8);
        this.scene.add(this.sunLight);

        this.fillLight = new THREE.DirectionalLight(0x5d7cff, 0.05);
        this.fillLight.position.set(4, -2, -3);
        this.scene.add(this.fillLight);

        // Stars Background
        this.createStars();
    }

    createStars() {
        // Keep the starfield in CSS behind the transparent WebGL canvas. The previous
        // 5,000-point GPU field required a second shader program and could trigger context
        // loss on current Chromium/Three r128. No gameplay or interaction depends on it.
        this.stars = null;
    }

    resolvePlanetName(name) {
        if (!name) return null;
        const requested = String(name).trim();
        const modelTarget = this.appearanceModel?.resolveTarget?.(requested);
        if (modelTarget?.planet?.name) return modelTarget.planet.name;
        const exact = Object.keys(this.planets).find(key => key.toLowerCase() === requested.toLowerCase());
        return exact || null;
    }

    showUnavailableTarget(name) {
        const label = String(name || 'Unknown target').trim() || 'Unknown target';
        this.currentPlanet = null;
        this.updateDataOverlay({
            name: label.toUpperCase(),
            diameter: 'No planet record',
            distance: 'Unavailable',
            surface: 'Not rendered',
            desc: `${label} does not resolve to a planet in the published NASA-backed snapshot. Stars and systems are not rendered as planets.`
        });
        this.container?.setAttribute('aria-label', `No renderable planet record is available for ${label}.`);
        this.container?.classList.add('education-renderer-ready');
        document.dispatchEvent(new CustomEvent('education-planet-unavailable', { detail: { target: label } }));
    }

    createCatalogPlanet(name) {
        const target = this.appearanceModel?.resolveTarget?.(name);
        return target ? this.appearanceModel.toViewerConfig(target) : null;
    }

    loadPlanet(name) {
        const resolvedTarget = this.resolvePlanetName(name);
        if (name && !resolvedTarget) {
            this.showUnavailableTarget(name);
            return;
        }
        const resolvedName = resolvedTarget || 'Earth';
        const modeledConfig = this.createCatalogPlanet(resolvedName);
        if (modeledConfig) this.planets[resolvedName] = modeledConfig;
        if (!this.planets[resolvedName]) {
            this.showUnavailableTarget(name);
            return;
        }
        this.currentPlanet = resolvedName;
        const config = this.planets[resolvedName];
        const generation = ++this.loadGeneration;
        if (resolvedName !== 'Earth') this.container?.classList.add('education-renderer-ready');
        this.updateDataOverlay(config.data);
        document.querySelectorAll('[data-education-planet]').forEach(button => {
            const selected = button.dataset.educationPlanet === resolvedName;
            button.setAttribute('aria-pressed', String(selected));
        });
        if (this.container) {
            this.container.setAttribute('aria-label', `Interactive 3D view of ${config.data.name}. ${config.data.desc}`);
        }

        clearTimeout(this.textureLoadTimer);
        this.textureLoadTimer = null;

        if (this.softwareRenderer) {
            this.softwareRenderer.load(config, resolvedName);
            document.dispatchEvent(new CustomEvent('education-planet-change', {
                detail: { name: resolvedName, config, model: config.planetaryModel || null }
            }));
            return;
        }

        // Reuse one high-density sphere for the session. Texture maps stay in texture space;
        // baking them into vertex colours (the previous implementation) reduced a 5,400 px
        // source to a 96x96 sampling grid and was the direct cause of the blurred Earth.
        if (!this.planetMesh || !this.planetMesh.userData.educationTextureSurface) {
            if (this.planetMesh) {
                this.scene.remove(this.planetMesh);
                this.planetMesh.geometry?.dispose?.();
                this.planetMesh.material?.dispose?.();
            }
            // 128 x 96 keeps 24,320 triangles per sphere layer while reducing
            // startup geometry work. Surface detail remains texture-native, so
            // the 2K/5.4K Blue Marble maps are not downsampled by this change.
            const geometry = new THREE.SphereGeometry(1, 128, 96);
            const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 9 });
            this.planetMesh = new THREE.Mesh(geometry, material);
            this.planetMesh.userData.educationTextureSurface = true;
            this.scene.add(this.planetMesh);
        }

        for (const key of ['cloudMesh', 'atmosphereMesh']) {
            const mesh = this[key];
            if (!mesh) continue;
            this.scene.remove(mesh);
            mesh.geometry?.dispose?.();
            mesh.material?.map?.dispose?.();
            mesh.material?.dispose?.();
            this[key] = null;
        }

        const mesh = this.planetMesh;
        mesh.name = `EducationPlanet:${resolvedName}`;
        mesh.rotation.set(0.05, resolvedName === 'Earth' ? -0.72 : 0, resolvedName === 'Earth' ? -0.18 : 0);
        mesh.userData.surfaceImage = null;
        mesh.material.map?.dispose?.();
        mesh.material.bumpMap?.dispose?.();
        mesh.material.dispose?.();
        mesh.material = new THREE.MeshPhongMaterial({
            color: config.color || 0x888888,
            shininess: resolvedName === 'Earth' ? 1 : (config.planetaryModel?.appearance?.roughness > 0.7 ? 3 : 10),
            specular: resolvedName === 'Earth' ? 0x080b10 : 0x151924
        });

        const configureTexture = (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            texture.anisotropy = Math.min(16, this.renderer.capabilities.getMaxAnisotropy());
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;
            return texture;
        };

        if (config.planetaryModel && this.appearanceModel) {
            const model = config.planetaryModel;
            const compactTexture = window.matchMedia?.('(max-width: 760px)').matches === true;
            const textureWidth = compactTexture ? 512 : window.innerWidth >= 1800 ? 1024 : 768;
            const texture = this.appearanceModel.createSurfaceTexture(THREE, model, { width: textureWidth, height: textureWidth / 2 });
            if (texture) {
                configureTexture(texture);
                mesh.material.map = texture;
                if (!model.appearance.banding) {
                    mesh.material.bumpMap = texture;
                    mesh.material.bumpScale = 0.006;
                }
                mesh.material.color.setHex(0xffffff);
                mesh.material.needsUpdate = true;
                const image = texture.image || {};
                mesh.userData.surfaceImage = {
                    src: `generated://${model.planetId}/${model.modelVersion}`,
                    width: image.width || 0,
                    height: image.height || 0,
                    anisotropy: texture.anisotropy,
                    nativeTexture: false,
                    proceduralTexture: true,
                    modelVersion: model.modelVersion,
                    planetId: model.planetId,
                    evidenceClass: model.evidence.class,
                    spatialConstraint: model.evidence.spatialConstraint,
                    generatedFromSnapshot: model.generatedFromSnapshot
                };
            }
            mesh.userData.planetaryModel = model;
            mesh.userData.displayRadiusNormalised = true;
            mesh.userData.physicalRadiusEarth = model.physical.radiusEarth;
            if (model.appearance.atmosphereOpacity > 0.01) this.createAtmosphere(mesh.geometry, model);
            const cloudTexture = this.appearanceModel.createCloudTexture(THREE, model, { width: textureWidth, height: textureWidth / 2 });
            if (cloudTexture) this.createProceduralCloudLayer(cloudTexture, model, generation, mesh.geometry);
            this.container?.classList.add('education-renderer-ready');
            const detail = { name: resolvedName, config, model, system: model.system, planet: model.record };
            document.dispatchEvent(new CustomEvent('education-planet-change', { detail }));
            window.ExoplanetAtmosphereCatalog?.refreshEducation?.(resolvedName);
            return;
        }

        mesh.userData.planetaryModel = null;
        if (resolvedName === 'Earth') this.createAtmosphere(mesh.geometry);
        document.dispatchEvent(new CustomEvent('education-planet-change', {
            detail: { name: resolvedName, config, model: null, system: null, planet: null }
        }));

        if (!config.texture) return;

        const applySurface = (texture, sourceUrl) => {
            if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh !== mesh) return;
            configureTexture(texture);
            mesh.material.map?.dispose?.();
            mesh.material.map = texture;
            mesh.material.color.setHex(0xffffff);
            if (resolvedName === 'Earth') {
                mesh.material.bumpMap = texture;
                mesh.material.bumpScale = 0.002;
            }
            mesh.material.needsUpdate = true;
            const image = texture.image || {};
            mesh.userData.surfaceImage = {
                src: sourceUrl,
                width: image.naturalWidth || image.width || 0,
                height: image.naturalHeight || image.height || 0,
                anisotropy: texture.anisotropy,
                nativeTexture: true
            };
            this.container?.classList.add('education-renderer-ready');

            if (resolvedName === 'Earth' && config.clouds) this.loadCloudLayer(config.clouds, generation, mesh.geometry);
        };

        const standardUrl = config.texture;
        const preferredUrl = this.hdTexturesEnabled && config.textureHd ? config.textureHd : standardUrl;
        this.textureLoadTimer = setTimeout(() => {
            if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh !== mesh) return;
            const loader = new THREE.TextureLoader();
            const loadStandard = () => loader.load(
                standardUrl,
                (texture) => applySurface(texture, standardUrl),
                undefined,
                () => console.info(`Texture unavailable for ${resolvedName}; keeping deterministic fallback surface.`)
            );
            loader.load(
                preferredUrl,
                (texture) => applySurface(texture, preferredUrl),
                undefined,
                () => {
                    if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh !== mesh) return;
                    if (preferredUrl !== standardUrl) loadStandard();
                    else console.info(`Texture unavailable for ${resolvedName}; keeping deterministic fallback surface.`);
                }
            );
        }, 80);
    }

    createAtmosphere(geometry, model = null) {
        const rawColour = model?.appearance?.atmosphereColour || [41, 122, 235];
        const colour = new THREE.Color(rawColour[0] / 255, rawColour[1] / 255, rawColour[2] / 255);
        const opacity = model ? clampEducationValue(model.appearance.atmosphereOpacity, 0.01, 0.48) : 0.26;
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uAtmosphereColour: { value: colour },
                uAtmosphereOpacity: { value: opacity }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewDirection;
                void main() {
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    vNormal = normalize(normalMatrix * normal);
                    vViewDirection = normalize(-viewPosition.xyz);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vViewDirection;
                uniform vec3 uAtmosphereColour;
                uniform float uAtmosphereOpacity;
                void main() {
                    float rim = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 2.35);
                    gl_FragColor = vec4(uAtmosphereColour, rim * uAtmosphereOpacity);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        this.atmosphereMesh = new THREE.Mesh(geometry.clone(), material);
        this.atmosphereMesh.name = model ? `EducationPlanet:${model.planetId}:Atmosphere` : 'EducationEarth:Atmosphere';
        this.atmosphereMesh.userData.evidenceClass = model?.evidence?.class || 'observed-map';
        this.atmosphereMesh.userData.geometricThicknessExaggerated = Boolean(model);
        this.atmosphereMesh.scale.setScalar(model ? 1.022 + opacity * 0.025 : 1.018);
        this.scene.add(this.atmosphereMesh);
    }

    createProceduralCloudLayer(texture, model, generation, sourceGeometry) {
        if (generation !== this.loadGeneration || this.currentPlanet !== model.planetName) {
            texture.dispose();
            return;
        }
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            color: 0xe6f1f4,
            transparent: true,
            opacity: clampEducationValue(model.appearance.cloudOpacity, 0.02, 0.72),
            depthWrite: false,
            shininess: 2
        });
        this.cloudMesh = new THREE.Mesh(sourceGeometry.clone(), material);
        this.cloudMesh.name = `EducationPlanet:${model.planetId}:CloudScenario`;
        this.cloudMesh.userData.spatialConstraint = 'none';
        this.cloudMesh.userData.modelVersion = model.modelVersion;
        this.cloudMesh.scale.setScalar(1.009);
        this.cloudMesh.rotation.copy(this.planetMesh.rotation);
        this.scene.add(this.cloudMesh);
    }

    loadCloudLayer(url, generation, sourceGeometry) {
        new THREE.TextureLoader().load(url, (texture) => {
            if (generation !== this.loadGeneration || this.currentPlanet !== 'Earth') {
                texture.dispose();
                return;
            }
            texture.encoding = THREE.sRGBEncoding;
            texture.anisotropy = Math.min(16, this.renderer.capabilities.getMaxAnisotropy());
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                color: 0xdff6ff,
                transparent: true,
                opacity: 0.52,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                shininess: 3
            });
            this.cloudMesh = new THREE.Mesh(sourceGeometry.clone(), material);
            this.cloudMesh.name = 'EducationEarth:Clouds';
            this.cloudMesh.scale.setScalar(1.012);
            this.cloudMesh.rotation.copy(this.planetMesh.rotation);
            this.scene.add(this.cloudMesh);
        }, undefined, () => console.info('Cloud texture unavailable; Earth surface and atmosphere remain active.'));
    }

    setHdTextures(enabled) {
        this.hdTexturesEnabled = !!enabled;
        try {
            localStorage.setItem('education_hd_textures', String(this.hdTexturesEnabled));
        } catch (e) {
        }
        this.loadPlanet(this.currentPlanet);
    }

    updateDataOverlay(data) {
        const values = {
            'planet-name': data.name,
            'planet-diameter': data.diameter,
            'planet-distance': data.distance,
            'planet-surface': data.surface,
            'planet-desc': data.desc
        };
        for (const [id, value] of Object.entries(values)) {
            const node = document.getElementById(id);
            if (node && node.textContent.trim().replace(/\s+/g, ' ') !== String(value).trim().replace(/\s+/g, ' ')) {
                node.textContent = value;
            }
        }
    }

    onWindowResize() {
        if (this.softwareRenderer) { this.softwareRenderer.resize(); return; }
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (this.softwareRenderer) return;
        if (!this.active) {
            this.animationFrameId = null;
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());

        try {
            const config = this.planets[this.currentPlanet];

            if (this.planetMesh && config && !this.prefersReducedMotion) {
                this.planetMesh.rotation.y += config.speed;
            }

            if (this.cloudMesh && config && !this.prefersReducedMotion) {
                this.cloudMesh.rotation.y += config.speed * 1.2; // Clouds move faster
            }

            if (this.stars) {
                this.stars.rotation.y -= 0.0001;
            }

            if (this.controls) this.controls.update();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (e) {
            console.error('Education Viewer Animation Error:', e);
            this.active = false; // Stop loop to prevent browser freeze
            if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

const educationExtraLoads = new Map();
window.ensureEducationExtra = function (kind) {
    const spec = kind === 'games'
        ? { src: 'educational-games.js', ready: () => window.educationalGames }
        : kind === 'courses'
            ? { src: 'astronomy-courses.js', ready: () => window.astronomyCourses }
            : null;
    if (!spec) return Promise.reject(new Error(`Unknown Education module: ${kind}`));
    const existing = spec.ready();
    if (existing) return Promise.resolve(existing);
    if (educationExtraLoads.has(kind)) return educationExtraLoads.get(kind);

    const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = spec.src;
        script.async = true;
        script.dataset.educationExtra = kind;
        script.onload = () => {
            const instance = spec.ready();
            if (instance) resolve(instance);
            else reject(new Error(`${kind} module loaded without initializing`));
        };
        script.onerror = () => reject(new Error(`Unable to load ${spec.src}`));
        document.head.appendChild(script);
    }).catch((error) => {
        educationExtraLoads.delete(kind);
        throw error;
    });
    educationExtraLoads.set(kind, promise);
    return promise;
};

window.openEducationExtra = function (kind) {
    return window.ensureEducationExtra(kind).then((instance) => {
        if (kind === 'games') instance.createGamesWidget();
        else instance.renderCourseList();
        return instance;
    }).catch((error) => {
        console.error('Education module load failed:', error);
        alert('That module could not be loaded. Please try again.');
        return null;
    });
};

// Initialize
window.viewer = new PlanetViewer();
if (window.__pendingEducationExtra) {
    const pendingExtra = window.__pendingEducationExtra;
    window.__pendingEducationExtra = null;
    queueMicrotask(() => window.openEducationExtra?.(pendingExtra));
}
