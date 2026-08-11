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
                texture: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Solarsystemscope_texture_2k_mercury.jpg',
                textureHd: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Solarsystemscope_texture_8k_mercury.jpg',
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
                texture: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Solarsystemscope_texture_2k_venus_surface.jpg',
                textureHd: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Solarsystemscope_texture_8k_venus_surface.jpg',
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
                texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
                textureHd: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Solarsystemscope_texture_8k_earth_daymap.jpg',
                bump: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
                clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
                color: 0x3b82f6,
                size: 1,
                speed: 0.001,
                data: {
                    name: 'EARTH',
                    diameter: '12,742 km',
                    distance: '1 AU',
                    surface: '71% Water',
                    desc: 'The third planet from the Sun. High-Resolution textures enabled via Global CDN for maximum detail.'
                }
            },
            'Mars': {
                texture: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Solarsystemscope_texture_2k_mars.jpg',
                textureHd: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Solarsystemscope_texture_8k_mars.jpg',
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
                texture: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Solarsystemscope_texture_2k_jupiter.jpg',
                textureHd: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Solarsystemscope_texture_8k_jupiter.jpg',
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
                texture: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Solarsystemscope_texture_2k_saturn.jpg',
                textureHd: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_8k_saturn.jpg',
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
                texture: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Solarsystemscope_texture_2k_uranus.jpg',
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
                texture: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_2k_neptune.jpg', // Was already correct, verifying
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
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
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 5000; i++) {
            vertices.push(
                THREE.MathUtils.randFloatSpread(500),
                THREE.MathUtils.randFloatSpread(500),
                THREE.MathUtils.randFloatSpread(500)
            );
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
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

        const disposeMesh = (mesh) => {
            if (!mesh) return;
            this.scene.remove(mesh);
            mesh.geometry?.dispose?.();
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const oldMaterial of materials) {
                if (!oldMaterial) continue;
                for (const key of ['map', 'bumpMap', 'normalMap', 'alphaMap']) oldMaterial[key]?.dispose?.();
                oldMaterial.dispose?.();
            }
        };
        disposeMesh(this.planetMesh);
        disposeMesh(this.cloudMesh);
        disposeMesh(this.atmosphereMesh);
        this.planetMesh = this.cloudMesh = this.atmosphereMesh = null;
        this.updateDataOverlay(config.data);

        // First paint never waits on third-party imagery: render a lit planet immediately.
        const geometry = new THREE.SphereGeometry(1, 48, 48);
        const material = new THREE.MeshStandardMaterial({
            color: config.color || 0x888888,
            roughness: 0.72,
            metalness: 0.04,
            emissive: new THREE.Color(config.color || 0x000000).multiplyScalar(0.035),
            emissiveIntensity: 0.16
        });
        this.planetMesh = new THREE.Mesh(geometry, material);
        this.planetMesh.name = `EducationPlanet:${resolvedName}`;
        this.scene.add(this.planetMesh);

        clearTimeout(this.textureLoadTimer);
        this.textureLoadTimer = null;
        if (!config.texture) return;

        // Remote imagery is optional enhancement. Debounce it so rapid planet browsing does not
        // launch obsolete multi-megabyte texture downloads that continue competing for bandwidth.
        this.textureLoadTimer = setTimeout(() => {
            if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh?.material !== material) return;

            const loader = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';
            const standardUrl = config.texture;
            const preferredUrl = this.hdTexturesEnabled && config.textureHd ? config.textureHd : standardUrl;
            const applyTexture = (texture) => {
                if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName || this.planetMesh?.material !== material) {
                    texture?.dispose?.();
                    return;
                }
                texture.encoding = THREE.sRGBEncoding;
                material.map?.dispose?.();
                material.map = texture;
                material.color.setHex(0xffffff);
                material.needsUpdate = true;
            };
            const loadStandard = () => loader.load(standardUrl, applyTexture, undefined, () => {
                console.info(`Texture unavailable for ${resolvedName}; keeping procedural surface.`);
            });
            loader.load(preferredUrl, applyTexture, undefined, () => {
                if (preferredUrl !== standardUrl) loadStandard();
                else console.info(`Texture unavailable for ${resolvedName}; keeping procedural surface.`);
            });
            if (config.bump) {
                loader.load(config.bump, (bump) => {
                    if (generation !== this.loadGeneration || this.planetMesh?.material !== material) return bump.dispose?.();
                    material.bumpMap = bump;
                    material.bumpScale = 0.035;
                    material.needsUpdate = true;
                }, undefined, () => {});
            }
            if (config.clouds) {
                loader.load(config.clouds, (cloudTexture) => {
                    if (generation !== this.loadGeneration || this.currentPlanet !== resolvedName) return cloudTexture.dispose?.();
                    cloudTexture.encoding = THREE.sRGBEncoding;
                    const cloudGeo = new THREE.SphereGeometry(1.018, 40, 40);
                    const cloudMat = new THREE.MeshPhongMaterial({
                        map: cloudTexture,
                        transparent: true,
                        opacity: 0.7,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });
                    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
                    this.scene.add(this.cloudMesh);
                }, undefined, () => {});
            }
        }, 320);
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
        if (!this.active) return;

        requestAnimationFrame(() => this.animate());

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
