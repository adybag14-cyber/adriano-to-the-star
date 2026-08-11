
class GalaxyGenerator {
    constructor(params = {}) {
        this.parameters = {
            count: params.count || 50000,
            size: params.size || 2000,
            branches: params.branches || 3,
            spin: params.spin || 1,
            randomness: params.randomness || 0.2,
            randomnessPower: params.randomnessPower || 3,
            insideColor: params.insideColor || '#ff8855', // Warmer core
            outsideColor: params.outsideColor || '#4466ff' // Cooler arms
        };
        this.geometry = null;
        this.material = null;
        this.points = null;
        this.starTexture = this.generateStarTexture();
    }

    generateStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Radial Gradient for Glow
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter; // Sharp but glowing
        return texture;
    }

    generate() {
        if (this.points !== null) {
            this.geometry.dispose();
            this.material.dispose();
            this.scene.remove(this.points);
        }

        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.parameters.count * 3);
        const colors = new Float32Array(this.parameters.count * 3);
        const scales = new Float32Array(this.parameters.count);

        this.systems = [];

        const colorInside = new THREE.Color(this.parameters.insideColor);
        const colorOutside = new THREE.Color(this.parameters.outsideColor);

        for (let i = 0; i < this.parameters.count; i++) {
            const i3 = i * 3;

            // Position
            const radius = Math.random() * this.parameters.size;
            const spinAngle = radius * this.parameters.spin;
            const branchAngle = (i % this.parameters.branches) / this.parameters.branches * Math.PI * 2;

            const randomX = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;
            const randomY = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;
            const randomZ = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY + (Math.random() - 0.5) * (this.parameters.size * 0.15); // Slightly thicker disk
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            // Color Logic (Enhanced)
            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, radius / this.parameters.size);

            // Add variety based on star temperature probabilities
            const randomColor = Math.random();
            if (randomColor > 0.9) {
                mixedColor.offsetHSL(0, 0, 0.2); // Blue-white giants
            } else if (randomColor < 0.05) {
                mixedColor.setHex(0xffaa33); // Red/Orange bias
            }

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            // Varied scales
            scales[i] = Math.random() * 2.0;

            // System Data
            this.systems.push({
                id: i,
                position: { x: positions[i3], y: positions[i3 + 1], z: positions[i3 + 2] },
                seed: i * 12345 + 6789,
                starConfig: this.generateStarConfig()
            });
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        console.log("Galaxy Geometry Position attr set");
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        // Note: Standard PointsMaterial doesn't use 'scale' attribute by default without custom shader, 
        // but we'll stick to size attenuation for 3D effect.

        this.material = new THREE.PointsMaterial({
            size: 15, // Larger to accommodate texture alpha
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            map: this.starTexture,
            transparent: true,
            opacity: 0.9
        });

        this.points = new THREE.Points(this.geometry, this.material);
        console.log("Galaxy Points created");
        return this.points;
    }

    generateStarConfig() {
        const starRand = Math.random();
        const starConfig = { type: 'single', stars: [] };
        if (starRand > 0.95) {
            starConfig.type = 'trinary';
            starConfig.stars.push({ color: 0xffaa00, size: 1.2 });
            starConfig.stars.push({ color: 0xff5500, size: 0.8 });
            starConfig.stars.push({ color: 0xffffff, size: 0.5 });
        } else if (starRand > 0.85) {
            starConfig.type = 'binary';
            starConfig.stars.push({ color: 0xffdd44, size: 1.5 });
            starConfig.stars.push({ color: 0x44aaff, size: 0.9 });
        } else {
            starConfig.type = 'single';
            const cRand = Math.random();
            let col = 0xfff7ed;
            if (cRand > 0.9) col = 0x44aaff;
            else if (cRand > 0.7) col = 0xffffff;
            else if (cRand < 0.1) col = 0xff5500;
            starConfig.stars.push({ color: col, size: 1.0 + Math.random() * 0.5 });
        }
        return starConfig;
    }

    updateColors(claims) {
        if (!this.geometry || !this.systems) return;
        this.claims = claims || {};
        const colors = this.geometry.attributes.color.array;
        const colorInside = new THREE.Color(this.parameters.insideColor);
        const colorOutside = new THREE.Color(this.parameters.outsideColor);
        const myId = window.game?.cloud?.user?.id;

        for (let i = 0; i < this.parameters.count; i++) {
            const i3 = i * 3;
            // logic...
            if (this.claims[i]) {
                const isMe = this.claims[i].user_id === myId;
                if (isMe) {
                    colors[i3] = 0.29; colors[i3 + 1] = 0.87; colors[i3 + 2] = 0.5;
                } else {
                    colors[i3] = 0.97; colors[i3 + 1] = 0.44; colors[i3 + 2] = 0.44;
                }
            } else {
                // Restore original calc is expensive, maybe cache?
                // Simplifying restoration for now, just re-calc gradient
                const radius = Math.sqrt(this.systems[i].position.x ** 2 + this.systems[i].position.z ** 2);
                const mixedColor = colorInside.clone();
                mixedColor.lerp(colorOutside, radius / this.parameters.size);
                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;
            }
        }
        this.geometry.attributes.color.needsUpdate = true;
    }
}

class GalaxyView {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        const w = container.clientWidth;
        const h = container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 10000);
        this.camera.position.set(0, 500, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(w, h);
        this.container.appendChild(this.renderer.domElement);

        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 10;
        this.mouse = new THREE.Vector2();

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Interaction
        this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

        this.hoveredSystem = null;

        // Marker for selection
        const markerGeo = new THREE.RingGeometry(12, 15, 32);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        this.marker = new THREE.Mesh(markerGeo, markerMat);
        this.marker.rotation.x = Math.PI / 2;
        this.marker.visible = false;
        this.scene.add(this.marker);

        // Generate Galaxy
        this.generator = new GalaxyGenerator();
        this.galaxyMesh = this.generator.generate();
        this.scene.add(this.galaxyMesh);

        this.createStarfield();

        // Initial Fetch for Meta-Galaxy
        if (window.game && window.game.multiplayer) {
            window.game.multiplayer.fetchGalaxyState().then(() => {
                this.generator.updateColors(window.game.multiplayer.systemClaims);
            });
        }
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const count = 1000;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 8000;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: false,
            color: 0x666666,
            transparent: true,
            opacity: 0.5
        });

        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    update() {
        this.controls.update();
        // Slowly rotate galaxy
        if (this.galaxyMesh) this.galaxyMesh.rotation.y += 0.0005;
        this.renderer.render(this.scene, this.camera);
    }

    onPointerMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.galaxyMesh);

        if (intersects.length > 0) {
            const index = intersects[0].index;
            const system = this.generator.systems[index];
            this.hoveredSystem = system;
            document.body.style.cursor = 'pointer';

            // Transform local point to world for marker
            this.marker.position.copy(intersects[0].point);
            this.marker.visible = true;
            this.marker.lookAt(this.camera.position);

            // Check Claim
            const claim = window.game?.multiplayer?.isSystemClaimed(system.id);
            let ownerText = "";
            if (claim) {
                const isMe = claim.user_id === window.game?.cloud?.user?.id;
                ownerText = `<br><span style="color:${isMe ? '#4ade80' : '#f87171'}">♛ Claimed by ${claim.profiles?.username || 'Unknown'}</span>`;
            }

            this.showTooltip(event, `Star System #${system.id}${ownerText}<br><span style="font-size:0.8em; color:#aaa">Click to Warp (100 Energy)</span>`);
        } else {
            this.hoveredSystem = null;
            document.body.style.cursor = 'default';
            this.marker.visible = false;
            this.hideTooltip();
        }
    }

    onClick(event) {
        if (this.hoveredSystem) {
            // Trigger main game callback directly (Modal handles confirmation)
            if (window.game) {
                window.game.warpToSystem(this.hoveredSystem);
            }
        }
    }

    showTooltip(e, text) {
        let tt = document.getElementById('galaxy-tooltip');
        if (!tt) {
            tt = document.createElement('div');
            tt.id = 'galaxy-tooltip';
            tt.style.position = 'absolute';
            tt.style.background = 'rgba(0,0,0,0.8)';
            tt.style.color = 'white';
            tt.style.padding = '8px';
            tt.style.borderRadius = '4px';
            tt.style.pointerEvents = 'none';
            tt.style.border = '1px solid #4ade80';
            tt.style.zIndex = '9999';
            document.body.appendChild(tt);
        }
        tt.style.display = 'block';
        tt.innerHTML = text;
        tt.style.left = (e.clientX + 15) + 'px';
        tt.style.top = (e.clientY + 15) + 'px';
    }

    hideTooltip() {
        const tt = document.getElementById('galaxy-tooltip');
        if (tt) tt.style.display = 'none';
    }
}

window.GalaxyGenerator = GalaxyGenerator;
window.GalaxyView = GalaxyView;
