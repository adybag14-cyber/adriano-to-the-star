/**
 * Education 3D Viewer - Powered by Three.js
 * Provides interactive planet visualization (Earth, Mars, Solar System, Exoplanets).
 */

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
                texture: 'images/earth_texture_map.png',
                textureHd: 'images/earth_texture_map.png',
                color: 0x3b82f6,
                size: 1,
                speed: 0.001,
                data: {
                    name: 'EARTH',
                    diameter: '12,742 km',
                    distance: '1 AU',
                    surface: '71% Water',
                    desc: 'The third planet from the Sun. High-resolution surface imagery is served locally for reliable detail.'
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
            this.hdTexturesEnabled = localStorage.getItem('education_hd_textures') === 'true';
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
        this.init();
        this.animate();

        const requestedTarget = new URLSearchParams(window.location.search).get('target');
        const initialPlanet = this.resolvePlanetName(window.__pendingEducationPlanet || requestedTarget) || 'Earth';
        this.loadPlanet(initialPlanet);

        window.addEventListener('resize', () => this.onWindowResize(), false);
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
        if (!educationContext) throw new Error('WebGL is unavailable for the Education 3D viewer.');
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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35); // Soft white light
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.18);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.copy(this.camera.position);
        this.scene.add(this.sunLight);

        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.15);
        this.fillLight.position.copy(this.camera.position).add(new THREE.Vector3(-2, 2, -2));
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
        const exact = Object.keys(this.planets).find(key => key.toLowerCase() === requested.toLowerCase());
        return exact || requested;
    }

    createCatalogPlanet(name) {
        const label = String(name || 'Catalog world').trim() || 'Catalog world';
        let hash = 2166136261;
        for (let i = 0; i < label.length; i++) {
            hash ^= label.charCodeAt(i);
            hash = Math.imul(hash, 16777619) >>> 0;
        }
        const hue = hash % 360;
        const color = new THREE.Color(`hsl(${hue}, 62%, 52%)`).getHex();
        return {
            texture: null,
            color,
            size: 0.85 + ((hash >>> 8) % 45) / 100,
            speed: 0.0007 + ((hash >>> 16) % 18) / 10000,
            data: {
                name: label.toUpperCase(),
                diameter: 'Catalog estimate',
                distance: 'Kepler catalogue',
                surface: 'Procedural exoplanet model',
                desc: `A procedural visual model for ${label}. Physical appearance is illustrative; use the database record for measured catalogue properties.`
            }
        };
    }

    loadPlanet(name) {
        const resolvedName = this.resolvePlanetName(name) || 'Earth';
        if (!this.planets[resolvedName]) this.planets[resolvedName] = this.createCatalogPlanet(resolvedName);
        this.currentPlanet = resolvedName;
        const config = this.planets[resolvedName];
        const generation = ++this.loadGeneration;
        this.updateDataOverlay(config.data);

        clearTimeout(this.textureLoadTimer);
        this.textureLoadTimer = null;

        // One persistent sphere/material is reused for the full Education session. Current
        // Chromium can lose the legacy Three r128 context when many materials/programs are
        // destroyed and recreated in quick succession. Updating one colour buffer is cheaper,
        // deterministic, and preserves the same orbit/rotation interaction.
        if (!this.planetMesh || !this.planetMesh.userData.educationVertexSurface) {
            if (this.planetMesh) {
                this.scene.remove(this.planetMesh);
                this.planetMesh.geometry?.dispose?.();
                this.planetMesh.material?.dispose?.();
            }
            const geometry = new THREE.SphereGeometry(1, 96, 96);
            geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
            this.planetMesh = new THREE.Mesh(geometry, material);
            this.planetMesh.userData.educationVertexSurface = true;
            this.scene.add(this.planetMesh);
        }

        // Legacy cloud/atmosphere meshes are not used by the reliable local-image path.
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
        mesh.userData.surfaceImage = null;
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        const normals = geometry.attributes.normal;
        const uv = geometry.attributes.uv;
        const colorAttribute = geometry.attributes.color;
        const colors = colorAttribute.array;
        const light = new THREE.Vector3(0.42, 0.32, 0.84).normalize();
        const normal = new THREE.Vector3();
        const fallbackColor = new THREE.Color(config.color || 0x888888);

        const applyFallbackColours = () => {
            for (let i = 0; i < positions.count; i++) {
                normal.fromBufferAttribute(normals, i).normalize();
                const shade = 0.42 + 0.58 * Math.max(0, normal.dot(light));
                colors[i * 3] = fallbackColor.r * shade;
                colors[i * 3 + 1] = fallbackColor.g * shade;
                colors[i * 3 + 2] = fallbackColor.b * shade;
            }
            colorAttribute.needsUpdate = true;
        };
        applyFallbackColours();

        if (!config.texture) return;

        const bakeImage = (image, sourceUrl) => {
            if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh !== mesh) return;
            const sourceWidth = image.naturalWidth || image.width || 0;
            const sourceHeight = image.naturalHeight || image.height || 0;
            if (sourceWidth < 2 || sourceHeight < 2) {
                console.info(`Texture unavailable for ${resolvedName}; keeping deterministic fallback surface.`);
                return;
            }
            // Enhanced mode bakes more of the checked-in source image into the
            // surface without introducing a fragile remote 8K dependency.
            const maxDimension = this.hdTexturesEnabled ? 1024 : 512;
            const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
            const width = Math.max(2, Math.round(sourceWidth * scale));
            const height = Math.max(2, Math.round(sourceHeight * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return;
            context.drawImage(image, 0, 0, width, height);
            const pixels = context.getImageData(0, 0, width, height).data;
            for (let i = 0; i < positions.count; i++) {
                const u = Math.min(1, Math.max(0, uv.getX(i)));
                const v = Math.min(1, Math.max(0, uv.getY(i)));
                const x = Math.min(width - 1, Math.max(0, Math.round(u * (width - 1))));
                const y = Math.min(height - 1, Math.max(0, Math.round((1 - v) * (height - 1))));
                const offset = (y * width + x) * 4;
                normal.fromBufferAttribute(normals, i).normalize();
                const shade = 0.42 + 0.58 * Math.max(0, normal.dot(light));
                colors[i * 3] = (pixels[offset] / 255) * shade;
                colors[i * 3 + 1] = (pixels[offset + 1] / 255) * shade;
                colors[i * 3 + 2] = (pixels[offset + 2] / 255) * shade;
            }
            colorAttribute.needsUpdate = true;
            mesh.userData.surfaceImage = {
                src: sourceUrl,
                width: sourceWidth,
                height: sourceHeight,
                bakedWidth: width,
                bakedHeight: height
            };
        };

        const standardUrl = config.texture;
        const preferredUrl = this.hdTexturesEnabled && config.textureHd ? config.textureHd : standardUrl;
        this.textureLoadTimer = setTimeout(() => {
            if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh !== mesh) return;
            const loader = new THREE.ImageLoader();
            const loadStandard = () => loader.load(
                standardUrl,
                (image) => bakeImage(image, standardUrl),
                undefined,
                () => console.info(`Texture unavailable for ${resolvedName}; keeping deterministic fallback surface.`)
            );
            loader.load(
                preferredUrl,
                (image) => bakeImage(image, preferredUrl),
                undefined,
                () => {
                    if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh !== mesh) return;
                    if (preferredUrl !== standardUrl) loadStandard();
                    else console.info(`Texture unavailable for ${resolvedName}; keeping deterministic fallback surface.`);
                }
            );
        }, 80);
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
        document.getElementById('planet-name').textContent = data.name;
        document.getElementById('planet-diameter').textContent = data.diameter;
        document.getElementById('planet-distance').textContent = data.distance;
        document.getElementById('planet-surface').textContent = data.surface;
        document.getElementById('planet-desc').textContent = data.desc;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.active) {
            this.animationFrameId = null;
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());

        try {
            const config = this.planets[this.currentPlanet];

            if (this.planetMesh && config) {
                this.planetMesh.rotation.y += config.speed;
            }

            if (this.cloudMesh && config) {
                this.cloudMesh.rotation.y += config.speed * 1.2; // Clouds move faster
            }

            if (this.stars) {
                this.stars.rotation.y -= 0.0001;
            }

            if (this.sunLight && this.camera) {
                this.sunLight.position.copy(this.camera.position);
            }

            if (this.fillLight && this.camera) {
                this.fillLight.position.copy(this.camera.position).add(new THREE.Vector3(-2, 2, -2));
            }

            if (this.controls) this.controls.update();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (e) {
            console.error("❌ Education Viewer Animation Error:", e);
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
