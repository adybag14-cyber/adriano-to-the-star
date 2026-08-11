/**
 * Planet Surface Visualizer
 * Renders a detailed surface view of planets using Procedural Generation (Perlin Noise)
 * and 3D rendering with Three.js.
 */

// --- Simplex Noise Implementation (Embedded for portability) ---
class SimplexNoise {
    constructor(r) {
        if (r == undefined) r = Math.random;
        this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(r() * 256);
        }
        this.perm = [];
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
        this.dot = function (g, x, y) {
            return g[0] * x + g[1] * y;
        };
    }
    noise(xin, yin) {
        let n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (xin + yin) * F2; // Hairy factor for 2D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = xin - X0; // The x,y distances from the cell origin
        const y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1; }      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
}
// -----------------------------------------------------------------

class PlanetSurfaceViz {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.terrain = null;
        this.water = null;
        this.clouds = null;
        this.lighting = null;
        this.requestID = null;
        this.containerId = null;
        this.simplex = new SimplexNoise();
        this.time = 0;
    }

    createCanvas(containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        // Atmospheric Sky Color (default space black)
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.0015);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
        this.camera.position.set(0, 150, 400); // Higher start
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.innerHTML = ''; // Clear previous
        container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Stars
        this.createStars();

        // Handle Resize
        window.addEventListener('resize', this.onResize.bind(this));
    }

    setupLighting() {
        // Ambient
        const ambientLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.4);
        this.scene.add(ambientLight);

        // Sun
        const sunLight = new THREE.DirectionalLight(0xffd700, 1.2);
        sunLight.position.set(300, 400, 200);
        sunLight.castShadow = true;

        // Shadow Props
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 1500;

        // Orthographic Camera for Shadow
        const d = 500;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;

        this.scene.add(sunLight);
        this.lighting = { sun: sunLight, ambient: ambientLight };
    }

    createStars() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            vertices.push(
                (Math.random() - 0.5) * 2000,
                Math.random() * 1000 + 200, // Keep stars above
                (Math.random() - 0.5) * 2000
            );
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    visualizePlanet(planetData) {
        if (!this.scene) return;

        // Cleanup
        if (this.terrain) { this.scene.remove(this.terrain); this.terrain.geometry.dispose(); this.terrain.material.dispose(); }
        if (this.water) { this.scene.remove(this.water); this.water.geometry.dispose(); this.water.material.dispose(); }
        if (this.clouds) { this.scene.remove(this.clouds); this.clouds.geometry.dispose(); this.clouds.material.dispose(); }

        const isEarth = planetData.kepler_name === 'Earth' || planetData.koi_disposition === 'CONFIRMED';
        const isGasGiant = Planet3DViewer ? new Planet3DViewer().isGasGiant(planetData) : false;

        // Random seed for this planet name
        const seedStr = planetData.kepler_name || "Planet";
        let seed = 0;
        for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
        this.planetSeed = seed * 0.1337;

        if (isGasGiant) {
            this.createGasGiantAtmosphere(planetData);
        } else {
            this.createTerrestrialTerrain(planetData, isEarth);
        }

        // Adjust sky color
        if (planetData.temp > 800) { // Hot
            this.scene.fog.color.setHex(0x331100);
            this.scene.background.setHex(0x331100);
        } else if (isEarth) { // Earth-like
            this.scene.fog.color.setHex(0x87CEEB); // Sky Blue
            this.scene.background.setHex(0x87CEEB);
        } else {
            this.scene.fog.color.setHex(0x050510);
            this.scene.background.setHex(0x050510);
        }

        this.animate();
    }

    createTerrestrialTerrain(planetData, isEarth) {
        // High Res Geometry
        const size = 1000;
        const resolution = 200; // Increased vertex count
        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        geometry.rotateX(-Math.PI / 2);

        // Colors
        const colors = [];
        const count = geometry.attributes.position.count;
        const positions = geometry.attributes.position; // Access buffer attribute directly

        // Noise Params
        const scale = 0.005; // Terrain Frequency
        const heightScale = 40; // Terrain Amplitude (max height)
        const octaves = 4;
        const persistence = 0.5;

        // Biome Palettes
        let palette = {
            deepWater: new THREE.Color(isEarth ? 0x000088 : 0x220000),
            water: new THREE.Color(isEarth ? 0x0044cc : 0x551100),
            sand: new THREE.Color(0xd2b48c),
            grass: new THREE.Color(isEarth ? 0x228822 : 0x884422),
            forest: new THREE.Color(isEarth ? 0x004400 : 0x552211),
            rock: new THREE.Color(0x666666),
            snow: new THREE.Color(0xffffff)
        };

        if (planetData.temp > 500) { // Martian/Hot
            palette = {
                deepWater: new THREE.Color(0x220000), // Lava?
                water: new THREE.Color(0x551100),
                sand: new THREE.Color(0xffaa00),
                grass: new THREE.Color(0xcc4400),
                forest: new THREE.Color(0x662200),
                rock: new THREE.Color(0x444444),
                snow: new THREE.Color(0xcccccc) // Ash?
            };
        }

        // Generate Height Loop
        for (let i = 0; i < count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // FBM Noise
            let amplitude = 1;
            let frequency = scale;
            let height = 0;
            let maxVal = 0;

            for (let o = 0; o < octaves; o++) {
                height += this.simplex.noise((x + this.planetSeed) * frequency, (z + this.planetSeed) * frequency) * amplitude;
                maxVal += amplitude;
                amplitude *= persistence;
                frequency *= 2;
            }

            // Normalize approximate range -1 to 1, then scale
            height = (height / maxVal) * heightScale;

            // Flatten valleys for water
            if (height < -5) height = -5 + (height + 5) * 0.3;

            // Apply height
            positions.setY(i, height);

            // Calculate Color based on height
            let color;
            if (height < -2) color = palette.deepWater;
            else if (height < 2) color = palette.water;
            else if (height < 5) color = palette.sand;
            else if (height < 20) color = palette.grass;
            else if (height < 40) color = palette.forest;
            else if (height < 60) color = palette.rock;
            else color = palette.snow;

            // Vary color slightly
            const rVar = (Math.random() - 0.5) * 0.05;
            color.r += rVar; color.g += rVar; color.b += rVar;

            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        // Material with Vertex Colors
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true, // Low Poly Look
            side: THREE.DoubleSide
        });

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = true;
        this.scene.add(this.terrain);

        // Add Water Plane
        if (isEarth) {
            const waterGeometry = new THREE.PlaneGeometry(size, size, 32, 32);
            waterGeometry.rotateX(-Math.PI / 2);
            const waterMaterial = new THREE.MeshStandardMaterial({
                color: 0x0077ff,
                transparent: true,
                opacity: 0.6,
                roughness: 0.1,
                metalness: 0.8
            });
            this.water = new THREE.Mesh(waterGeometry, waterMaterial);
            this.water.position.y = 0; // Water level
            this.scene.add(this.water);
        }
    }

    createGasGiantAtmosphere(planetData) {
        // Gas giant swirls
        // Using a plane geometry with perlin texture would be better, but vertex displacement used here for simplicity
        const size = 1000;
        const widthSeg = 100;
        const geometry = new THREE.PlaneGeometry(size, size, widthSeg, widthSeg);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position;
        const colors = [];
        const count = positions.count;

        const baseHue = Math.random();

        for (let i = 0; i < count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Large bands
            const n = this.simplex.noise((z + this.planetSeed) * 0.01, (x + this.planetSeed) * 0.005);

            // Rolling clouds height
            const height = n * 20;
            positions.setY(i, height);

            const color = new THREE.Color();
            color.setHSL((baseHue + n * 0.1) % 1, 0.8, 0.5 + n * 0.3);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            flatShading: false
        });

        this.terrain = new THREE.Mesh(geometry, material);
        this.scene.add(this.terrain);
    }

    animate() {
        if (!this.renderer) return;

        this.time += 0.01;

        // Animate Water
        if (this.water) {
            const positions = this.water.geometry.attributes.position;
            // Simple wave effect? Warning: Expensive to update buffer every frame. 
            // Just move mesh up and down slightly
            this.water.position.y = Math.sin(this.time) * 0.5;
        }

        // Fly Camera
        if (this.camera.position.z < -400) {
            this.camera.position.z = 400; // Loop
        } else {
            this.camera.position.z -= 0.5; // Slowly fly forward
        }

        // Rotate stars to simulate planet rotation relative to sky? No, skybox rotation.

        this.renderer.render(this.scene, this.camera);
        this.requestID = requestAnimationFrame(this.animate.bind(this));
    }

    onResize() {
        if (!this.containerId || !this.camera || !this.renderer) return;
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    destroy() {
        if (this.requestID) cancelAnimationFrame(this.requestID);
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        this.scene = null;
        window.removeEventListener('resize', this.onResize);
    }
}

// Global Instance
window.planetSurfaceViz = new PlanetSurfaceViz();
