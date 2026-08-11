/**
 * 3D Warp Drive Background
 * Uses Three.js to create a hyper-speed effect.
 */

// Import Three.js from CDN for simplicity in this standalone file
// In a real build step, we'd use imports, but this ensures it runs immediately
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

class WarpDrive {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('warp-canvas'),
            antialias: true
        });

        this.stars = [];
        this.speed = 0.5;
        this.isWarping = false;

        this.init();
        this.animate();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Add Fog for depth
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);

        // Create Stars
        const starGeo = new THREE.BufferGeometry();
        const starCount = 15000; // DOUBLED TO 11
        const posArray = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 4000; // Spread stars WIDER
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        // Texture
        const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');

        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            map: sprite,
            transparent: true
        });

        this.starMesh = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starMesh);

        this.camera.position.z = 1;

        // Listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    engageWarp() {
        this.isWarping = true;
        // Animation logic handles the speed up
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const positions = this.starMesh.geometry.attributes.position.array;

        if (this.isWarping) {
            this.speed += 0.1; // Accelerate
            // Streak effect logic involves stretching (advanced), 
            // for now we just speed up massively
            if (this.speed > 50) this.speed = 50;
        }

        for (let i = 1; i < positions.length; i += 3) { // Y axis
            // Move stars towards camera (Z axis is i+2)
            positions[i + 1] += this.speed;

            // Reset if behind camera
            if (positions[i + 1] > 200) {
                positions[i + 1] = -1000; // Send back

                // Randomize X and Y slightly for variation
                positions[i - 1] = (Math.random() - 0.5) * 2000;
                positions[i - 2] = (Math.random() - 0.5) * 2000;
            }
        }

        this.starMesh.geometry.attributes.position.needsUpdate = true;

        // Rotate simulation
        this.starMesh.rotation.z += 0.002;

        this.renderer.render(this.scene, this.camera);
    }
}

// Init when DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.warpDrive = new WarpDrive());
} else {
    window.warpDrive = new WarpDrive();
}
