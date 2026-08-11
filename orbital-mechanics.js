/**
 * Orbital Mechanics Simulator
 * Visualizes Keplerian orbits and gravity.
 */
class OrbitalMechanics {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.requestID = null;
        this.containerId = null;
        this.bodies = [];
        this.isPaused = false;
        this.G = 1;
    }

    createCanvas(containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 100, 100);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // Lights
        this.scene.add(new THREE.AmbientLight(0x444444));
        const sunLight = new THREE.PointLight(0xffffff, 1.5, 1000);
        this.scene.add(sunLight);

        // Central Star
        this.addStar();

        // Grid
        this.scene.add(new THREE.GridHelper(200, 20, 0x333333, 0x111111));

        window.addEventListener('resize', this.onResize.bind(this));

        this.animate();
    }

    addStar() {
        const geometry = new THREE.SphereGeometry(10, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const star = new THREE.Mesh(geometry, material);
        this.scene.add(star);
        this.bodies.push({ mesh: star, mass: 1000, x: 0, z: 0, vx: 0, vz: 0, fixed: true });
    }

    addPlanet(planetData) {
        if (!this.scene) return;

        // Determine properties based on data
        const color = planetData.pl_name === 'Earth' ? 0x2233ff : 0xaa5522;
        const radius = planetData.pl_rade ? planetData.pl_rade * 2 : 5; // Scale up
        const dist = 50 + Math.random() * 50;
        const velocity = Math.sqrt(this.G * 1000 / dist);

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(dist, 0, 0);
        this.scene.add(mesh);

        // Trail
        const trailGeo = new THREE.BufferGeometry();
        const trailMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
        const trail = new THREE.Line(trailGeo, trailMat);
        this.scene.add(trail);

        this.bodies.push({
            mesh: mesh,
            trail: trail,
            trailPoints: [],
            mass: 10,
            x: dist,
            z: 0,
            vx: 0,
            vz: velocity,
            fixed: false
        });
    }

    reset() {
        // Clear non-fixed bodies
        for (let i = this.bodies.length - 1; i >= 0; i--) {
            if (!this.bodies[i].fixed) {
                this.scene.remove(this.bodies[i].mesh);
                if (this.bodies[i].trail) this.scene.remove(this.bodies[i].trail);
                this.bodies.splice(i, 1);
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    animate() {
        if (!this.renderer) return;

        if (!this.isPaused) {
            this.updatePhysics();
        }

        this.renderer.render(this.scene, this.camera);
        this.requestID = requestAnimationFrame(this.animate.bind(this));
    }

    updatePhysics() {
        const dt = 0.5; // time step

        this.bodies.forEach(body => {
            if (body.fixed) return;

            // Simple gravity towards 0,0 (Star)
            const r = Math.sqrt(body.x * body.x + body.z * body.z);
            const F = (this.G * 1000 * body.mass) / (r * r);

            const ax = -F * (body.x / r) / body.mass;
            const az = -F * (body.z / r) / body.mass;

            body.vx += ax * dt;
            body.vz += az * dt;

            body.x += body.vx * dt;
            body.z += body.vz * dt;

            body.mesh.position.set(body.x, 0, body.z);

            // Update trail
            body.trailPoints.push(new THREE.Vector3(body.x, 0, body.z));
            if (body.trailPoints.length > 100) body.trailPoints.shift();
            body.trail.geometry.setFromPoints(body.trailPoints);
        });
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

window.orbitalMechanics = new OrbitalMechanics();
