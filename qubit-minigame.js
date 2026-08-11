/**
 * QubitMinigame.js
 * "The Lab" - Visualizes a Qubit on a Bloch Sphere.
 * The vector wobbles as simulated entropy increases. Player clicks to "measure/reset" it to [0,1,0].
 */

class QubitMinigame {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphereMesh = null;
        this.arrowHelper = null;
        this.isRunning = false;

        // Qubit State (Vector)
        this.vector = new THREE.Vector3(0, 1, 0);
        this.targetVector = new THREE.Vector3(0, 1, 0); // "North Pole"
        this.wobbleSpeed = 0.05;
    }

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Cleanup old if exists
        container.innerHTML = '';
        this.container = container;

        // Three.js Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0014); // Dark Purple

        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        this.camera.position.z = 4;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        // Bloch Sphere (Wireframe)
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.3 });
        this.sphereMesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.sphereMesh);

        // Axes
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);

        // State Vector Arrow
        const dir = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 0, 0);
        const length = 1.6;
        const hex = 0x00ff00; // Green
        this.arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex, 0.2, 0.1);
        this.scene.add(this.arrowHelper);

        // Interaction
        this.renderer.domElement.addEventListener('click', () => this.measureQubit());

        this.isRunning = true;
    }

    measureQubit() {
        if (!this.game.quantum) return;

        // "Measurement" collapses the state
        // If close to ideal, we stabilize heavy. If far, we fail?
        // Simpler: Just stabilize.

        this.vector.set(0, 1, 0); // Reset to North Pole
        this.arrowHelper.setDirection(this.vector);
        this.arrowHelper.setColor(0x00ff00);

        this.game.quantum.stabilize(25); // Adds coherence
        this.game.audio.playClick(); // Reuse click sound
    }

    update(dt) {
        if (!this.isRunning || !this.renderer) return;

        // Simulate "Environmental Noise" based on low coherence
        const noiseLevel = (100 - (this.game.quantum.coherence || 0)) / 100;

        // Random Rotation (Wobble)
        if (noiseLevel > 0) {
            this.vector.x += (Math.random() - 0.5) * noiseLevel * 0.1;
            this.vector.z += (Math.random() - 0.5) * noiseLevel * 0.1;
            this.vector.normalize();
        }

        // Color Indication
        if (this.vector.y < 0.5) {
            this.arrowHelper.setColor(0xff0000); // Danger
        } else {
            this.arrowHelper.setColor(0x00ff00); // Good
        }

        this.arrowHelper.setDirection(this.vector);
        this.sphereMesh.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);
    }
}

window.QubitMinigame = QubitMinigame;
