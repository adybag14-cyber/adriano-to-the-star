/**
 * Fluid Dynamics System
 * Simulates water flow, sea level changes, and flooding using Cellular Automata.
 */

class FluidDynamicsSystem {
    constructor() {
        this.seaLevelRadius = 50.0;
        this.waterMesh = null;
        this.isInitialized = false;
        this.lastVisualUpdate = 0;
    }

    init(planetMesh) {
        // Rebind on every generated world; only the render mesh/loop are singleton resources.
        this.planet = planetMesh;
        const targetScene = this.planet?.parent || window.game?.scene || window.planet3DViewer?.scene || null;
        if (this.waterMesh && targetScene && this.waterMesh.parent !== targetScene) {
            targetScene.add(this.waterMesh);
        }
        if (this.isInitialized) return;

        console.log("🌊 Fluid Dynamics & Global Ocean Initialized");
        this.createWaterMesh();

        this.isInitialized = true;
        this.simulationLoop();
    }

    createWaterMesh() {
        if (!window.THREE) return;
        const THREE = window.THREE;

        // Use a slightly lower radius initially to avoid Z-fighting with flat terrain
        const geometry = new THREE.SphereGeometry(this.seaLevelRadius, 96, 96);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0b6f9f,
            transparent: true,
            opacity: 0.82,
            shininess: 140,
            specular: 0x9ee7ff,
            emissive: 0x06243a,
            emissiveIntensity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.waterMesh = new THREE.Mesh(geometry, material);
        this.waterMesh.name = "GlobalOcean";

        const targetScene = this.planet?.parent || window.game?.scene || window.planet3DViewer?.scene || null;
        if (targetScene) targetScene.add(this.waterMesh);
    }

    onTerrainModified(point, radius) {
        // Visual feedback if digging hits water
        const dist = point.length();
        if (dist <= this.seaLevelRadius + 0.5) {
            console.log("💧 Hit Water Table!");
            // Could spawn splash particles here
        }
    }

    updateFluids() {
        // Roadmap Item 2: Link sea level to water stats and pressure
        if (window.game && window.game.terraforming) {
            const tf = window.game.terraforming;
            const waterLevel = tf.stats.water / 100; // 0.0 to 1.0
            const pressure = tf.stats.pressure / 100; // 0.0 to 1.0

            // Sea level radius varies slightly based on water volume and pressure (compression)
            // Target is 50.0 radius at 60% coverage.
            const targetRadius = 48.0 + (waterLevel * 4.0) - (pressure * 0.5);
            
            // Lerp towards target radius for stability
            this.seaLevelRadius = this.seaLevelRadius + (targetRadius - this.seaLevelRadius) * 0.01;
            
            if (this.waterMesh) {
                this.waterMesh.scale.setScalar(this.seaLevelRadius / 50.0);
                
                // Color based on pressure and biomass ( Roadmap Item 2 depth)
                if (this.waterMesh.material.color) {
                    const bio = tf.stats.biomass / 100;
                    // High bio = greener water, High pressure = darker water
                    const r = 0.0 * (1 - bio) + 0.1 * bio;
                    const g = 0.2 * (1 - bio) + 0.4 * bio;
                    const b = 0.6 * (1 - pressure * 0.5);
                    this.waterMesh.material.color.setRGB(r, g, b);
                }
            }
        }

        // Simulate tides and slow ocean drift using elapsed time, not frame count.
        if (this.waterMesh) {
            const now = performance.now() * 0.001;
            const visualDt = this.lastVisualUpdate > 0 ? Math.min(0.1, now - this.lastVisualUpdate) : 0;
            this.lastVisualUpdate = now;
            const tide = Math.sin(now * 0.45) * 0.05;
            const baseScale = this.seaLevelRadius / 50.0;
            this.waterMesh.scale.setScalar(baseScale + tide * 0.001);
            this.waterMesh.rotation.y += visualDt * 0.012;
            this.waterMesh.rotation.z = Math.sin(now * 0.08) * 0.0025;
        }
    }

    simulationLoop() {
        // Run update loop
        const loop = () => {
            this.updateFluids();
            requestAnimationFrame(loop);
        };
        loop();
    }
}

if (typeof window !== 'undefined') {
    window.FluidDynamicsSystem = FluidDynamicsSystem;
    window.fluidDynamicsSystem = new FluidDynamicsSystem();
}
