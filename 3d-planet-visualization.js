/**
 * 3D Planet Visualization with WebGL
 * Interactive 3D planet rendering
 * 
 * Features:
 * - WebGL 3D rendering
 * - Interactive rotation
 * - Zoom controls
 * - Multiple planet models
 */

class Planet3DVisualization {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.useWebGL = true; // Tracks which rendering method is active
        this.fallbackCanvas = null; // Separate canvas for 2D rendering
        this.fallbackCtx = null; // 2D context from the fallback canvas
        this.planets = [];
        this.selectedPlanet = null;
        this.rotation = { x: 0, y: 0 };
        this.zoom = 1.0;
        this.init();
    }

    init() {
        // Create 3D visualization widget
        this.createVisualizationWidget();

        // Initialize WebGL
        this.initializeWebGL();

        this.trackEvent('planet_visualization_initialized');
    }

    createVisualizationWidget() {
        const container = document.createElement('div');
        container.id = '3d-planet-widget';
        container.className = '3d-planet-widget';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
        `;

        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">🌍 3D Planet Visualization</h2>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-bottom: 1.5rem;">
                <div>
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">Select Planet</h3>
                    <div id="planet-selector" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">
                            Loading planets...
                        </div>
                    </div>
                </div>
                <div>
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">3D View</h3>
                    <div id="3d-container" style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 2rem; min-height: 500px; position: relative;">
                        <canvas id="planet-3d-canvas" style="width: 100%; height: 500px; border-radius: 5px;"></canvas>
                        <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.8); padding: 1rem; border-radius: 5px; border: 1px solid rgba(186,148,79,0.5);">
                            <div style="font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">
                                <strong>Controls:</strong>
                            </div>
                            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.6;">
                                • Click & drag to rotate<br>
                                • Scroll to zoom<br>
                                • Right-click to reset
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                        <button id="reset-view-btn" style="background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                            🔄 Reset View
                        </button>
                        <button id="auto-rotate-btn" style="background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                            ⏯️ Auto Rotate
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert into page
        const main = document.querySelector('main') || document.body;
        const tradingWidget = document.getElementById('trading-marketplace-widget');
        if (tradingWidget) {
            tradingWidget.insertAdjacentElement('afterend', container);
        } else {
            const firstSection = main.querySelector('section');
            if (firstSection) {
                firstSection.insertAdjacentElement('afterend', container);
            } else {
                main.appendChild(container);
            }
        }

        // Setup controls
        document.getElementById('reset-view-btn').addEventListener('click', () => {
            this.resetView();
        });
        document.getElementById('auto-rotate-btn').addEventListener('click', () => {
            this.toggleAutoRotate();
        });
    }

    initializeWebGL() {
        this.canvas = document.getElementById('planet-3d-canvas');
        if (!this.canvas) return;

        const container = document.getElementById('3d-container');
        const width = container.clientWidth - 64;
        const height = 500;
        this.canvas.width = width;
        this.canvas.height = height;

        // Three.js Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020617); // Dark space blue-black

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(5, 3, 5);
        this.scene.add(sunLight);

        // Orbit Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
        }

        this.loadPlanets();
        this.setupEventListeners();
        this.animate();
    }

    loadPlanets() {
        this.planets = [
            {
                id: 'kepler-452b',
                name: 'Kepler-452b',
                type: 'Super-Earth',
                color: [0.2, 0.6, 0.9], // Blue-green
                radius: 1.6
            },
            {
                id: 'proxima-b',
                name: 'Proxima Centauri b',
                type: 'Terrestrial',
                color: [0.8, 0.4, 0.2], // Red-orange
                radius: 1.3
            },
            {
                id: 'trappist-1e',
                name: 'TRAPPIST-1e',
                type: 'Terrestrial',
                color: [0.3, 0.7, 0.5], // Green
                radius: 0.92
            },
            {
                id: 'earth',
                name: 'Earth',
                type: 'Terrestrial',
                color: [0.2, 0.5, 0.9], // Blue
                radius: 1.0
            }
        ];

        this.renderPlanetSelector();
        this.selectedPlanet = this.planets[0];
        this.drawSimpleSphere(this.selectedPlanet);
    }

    renderPlanetSelector() {
        const container = document.getElementById('planet-selector');
        if (!container) return;

        container.innerHTML = this.planets.map(planet => `
            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1rem; border: 1px solid rgba(186,148,79,0.3); cursor: pointer; transition: all 0.3s;" 
                 onclick="window.planet3DViz.selectPlanet('${planet.id}')"
                 onmouseover="this.style.borderColor='rgba(186,148,79,0.8)'; this.style.background='rgba(0,0,0,0.5)'"
                 onmouseout="this.style.borderColor='rgba(186,148,79,0.3)'; this.style.background='rgba(0,0,0,0.3)'">
                <div style="color: #ba944f; font-weight: bold; margin-bottom: 0.25rem;">${planet.name}</div>
                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8);">${planet.type}</div>
            </div>
        `).join('');
    }

    selectPlanet(planetId) {
        const planet = this.planets.find(p => p.id === planetId);
        if (!planet) return;

        this.selectedPlanet = planet;
        this.trackEvent('planet_selected', { planetId, planetName: planet.name });
        this.drawSimpleSphere(this.selectedPlanet);
    }

    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse/Touch events for rotation
        let isDragging = false;
        let lastX = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging && this.planetMesh) {
                const deltaX = e.clientX - lastX;
                this.planetMesh.rotation.y += deltaX * 0.005;
                lastX = e.clientX;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Zoom (Wheel)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z += e.deltaY * 0.01;
            this.camera.position.z = Math.max(2, Math.min(10, this.camera.position.z));
        }, { passive: false });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.planetMesh) {
            this.planetMesh.rotation.y += 0.002;
        }

        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    drawSimpleSphere(planet) {
        if (!this.scene) return;

        // Remove old planet
        if (this.planetMesh) {
            this.scene.remove(this.planetMesh);
            if (this.planetMesh.geometry) this.planetMesh.geometry.dispose();
            if (this.planetMesh.material) this.planetMesh.material.dispose();
        }

        // Create Geometry
        const geometry = new THREE.IcosahedronGeometry(1.5, 4); // Smoother sphere

        // Material based on color
        const color = new THREE.Color().fromArray(planet.color);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1,
            flatShading: false
        });

        this.planetMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.planetMesh);

        // Update Title
        const container = document.getElementById('3d-container');
        if (container) {
            const title = container.querySelector('h3');
            if (title) {
                title.textContent = `Viewing: ${planet.name}`;
            }
        }
        // Simple fix to ensure we don't break layout if structure changes
    }

    showFallback() {
        const container = document.getElementById('3d-container');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: rgba(255,255,255,0.8);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🌍</div>
                <h3 style="color: #ba944f; margin-bottom: 1rem;">3D Visualization</h3>
                <p style="margin-bottom: 1.5rem;">Full WebGL 3D planet visualization coming soon!</p>
                <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6);">
                    This will include interactive 3D planet models with realistic textures,<br>
                    rotation controls, zoom functionality, and multiple viewing modes.
                </p>
            </div>
        `;
    }

    resetView() {
        this.rotation = { x: 0, y: 0 };
        this.zoom = 1.0;
        this.trackEvent('view_reset');
        this.render();
    }

    toggleAutoRotate() {
        this.trackEvent('auto_rotate_toggled');
        alert('Auto-rotation feature coming soon!');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`planet_3d_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: '3d_planet_visualization', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planet3DViz = new Planet3DVisualization();
    });
} else {
    window.planet3DViz = new Planet3DVisualization();
}
