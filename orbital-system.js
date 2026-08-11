class SatelliteEntity {
    constructor(manager, type, orbitParams) {
        this.manager = manager;
        this.type = type; // 'comm', 'spy', 'solar'
        this.orbitParams = orbitParams || {
            a: 80 + Math.random() * 40, // Semi-major axis (Radius, roughly)
            e: 0.1, // Eccentricity
            i: (Math.random() - 0.5) * Math.PI, // Inclination
            omega: Math.random() * Math.PI * 2, // Longitude of Ascending Node
            w: Math.random() * Math.PI * 2, // Argument of Periapsis
            M0: Math.random() * Math.PI * 2 // Mean anomaly at epoch
        };
        this.mesh = this.createMesh();
        this.manager.scene.add(this.mesh);

        // Orbital Path Visual
        this.pathMesh = this.createOrbitPath();
        this.manager.scene.add(this.pathMesh);
    }

    createMesh() {
        let geo, mat;
        if (this.type === 'comm') {
            geo = new THREE.OctahedronGeometry(2);
            mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        } else if (this.type === 'moon') {
            geo = new THREE.DodecahedronGeometry(5, 1);
            mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 }); // Lit by sun?
        } else {
            geo = new THREE.BoxGeometry(2, 1, 1);
            mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        }
        return new THREE.Mesh(geo, mat);
    }

    createOrbitPath() {
        const points = [];
        const segments = 64;
        for (let j = 0; j <= segments; j++) {
            const E = (j / segments) * Math.PI * 2; // Approximation logic for visualization
            // Real Keplerian is harder, let's stick to circular/elliptical approximation for visual path
            // r = a
            const theta = E;
            const r = this.orbitParams.a;
            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);
            const vec = new THREE.Vector3(x, 0, z);
            // Apply inclination
            vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.orbitParams.i);
            vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitParams.omega);
            points.push(vec);
        }
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        return new THREE.Line(geo, mat);
    }

    update(time) {
        // Calculate position based on Keplerian Orbit
        // Simplification: Circular motion with inclination
        const n = 0.5; // Mean motion speed
        const M = this.orbitParams.M0 + n * time;

        const r = this.orbitParams.a;
        const x = r * Math.cos(M);
        const z = r * Math.sin(M);

        const pos = new THREE.Vector3(x, 0, z);
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.orbitParams.i);
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitParams.omega);

        this.mesh.position.copy(pos);
        this.mesh.lookAt(new THREE.Vector3(0, 0, 0)); // Look at planet
    }
}

class OrbitalManager {
    constructor(game) {
        this.game = game;
        this.satellites = [];
        this.active = false;
    }

    get scene() {
        return this.game.scene;
    }

    init() {
        // Create Moon
        this.moon = new SatelliteEntity(this, 'moon', {
            a: 200, // Further out
            e: 0.05,
            i: 0.1,
            omega: 0,
            w: 0,
            M0: 0
        });
        this.moon.mesh.scale.set(5, 5, 5); // Make it big
        this.moon.mesh.material.color.setHex(0x94a3b8); // Gray

        this.createMoonUI();
    }

    createMoonUI() {
        if (document.getElementById('ep-moon-ui')) return;
        const div = document.createElement('div');
        div.id = 'ep-moon-ui';
        div.style.position = 'absolute';
        div.style.top = '20%';
        div.style.right = '20px';
        div.style.display = 'none'; // Hidden by default
        div.style.textAlign = 'right';
        div.innerHTML = `
            <div style="font-size:1.5em; color:#94a3b8; font-weight:bold;">THE MOON</div>
            <div style="font-size:0.9em; color:#cbd5e1; margin-bottom:10px;">Uncolonized</div>
            <button class="ep-sys-btn" onclick="window.game.orbit.visitMoon()" style="border-color:#38bdf8;">LAND ON MOON</button>
        `;
        document.body.appendChild(div);
    }

    visitMoon() {
        // Trigger game logic
        window.game.visitMoon();
    }

    launchSatellite(type) {
        const sat = new SatelliteEntity(this, type);
        this.satellites.push(sat);
        this.game.notify("Satellite Launched into Orbit!", "success");
    }

    update(time) {
        if (!this.active) {
            this.satellites.forEach(s => s.mesh.visible = false);
            this.satellites.forEach(s => s.pathMesh.visible = false);
            if (this.moon) {
                this.moon.mesh.visible = false;
                this.moon.pathMesh.visible = false;
            }
            if (document.getElementById('ep-moon-ui')) document.getElementById('ep-moon-ui').style.display = 'none';
            return;
        }

        this.satellites.forEach(s => {
            s.mesh.visible = true;
            s.pathMesh.visible = true;
            s.update(time);
        });

        if (this.moon) {
            this.moon.mesh.visible = true;
            this.moon.pathMesh.visible = true;
            this.moon.update(time * 0.2); // Slower orbit
        }

        if (document.getElementById('ep-moon-ui')) document.getElementById('ep-moon-ui').style.display = 'block';
    }

    toggleView(active) {
        this.active = active;
        // Game handles camera
    }
}
window.OrbitalManager = OrbitalManager;
