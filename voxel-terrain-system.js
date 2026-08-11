/**
 * Voxel/Deformable Terrain System
 * Allows real-time modification of planet surface geometry.
 * Simulates "Digging" and "Raising" terrain.
 */

class VoxelTerrainSystem {
    constructor() {
        this.activePlanet = null;
        this.brushSize = 5;
        this.toolbar = null;
        
        // Roadmap Item 1: Voxel Grid Foundation
        this.chunks = new Map(); // Map 'x,y,z' -> { data: Uint8Array, mesh: THREE.Mesh }
        this.chunkSize = 16;
        this.voxelScale = 1.0;
    }

    init(planetObject) {
        this.activePlanet = planetObject; // Expects a THREE.Mesh
        console.log("🏔️ Voxel Terrain System Initialized linked to", planetObject);
        this.createToolbar();

        // Ensure we can update vertices
        if (this.activePlanet && this.activePlanet.geometry) {
            this.activePlanet.geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        }
        
        // Placeholder for future true voxel rendering transition
        console.log("Voxel Grid Foundation: Ready for chunking (Item 1)");
    }

    getChunkKey(x, y, z) {
        const cx = Math.floor(x / (this.chunkSize * this.voxelScale));
        const cy = Math.floor(y / (this.chunkSize * this.voxelScale));
        const cz = Math.floor(z / (this.chunkSize * this.voxelScale));
        return `${cx},${cy},${cz}`;
    }

    getOrCreateChunk(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        if (!this.chunks.has(key)) {
            const size = this.chunkSize * this.chunkSize * this.chunkSize;
            this.chunks.set(key, {
                data: new Uint8Array(size).fill(0), // 0 = empty, 1 = solid, etc
                mesh: null
            });
        }
        return this.chunks.get(key);
    }

    createToolbar() {
        if (document.getElementById('terraform-toolbar')) return;

        const div = document.createElement('div');
        div.id = 'terraform-toolbar';
        div.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0, 10, 20, 0.9); border: 1px solid #00fff2;
            padding: 12px; border-radius: 12px; display: flex; gap: 12px;
            z-index: 1000; pointer-events: auto; font-family: 'Inter', sans-serif;
            box-shadow: 0 0 20px rgba(0, 255, 242, 0.2);
        `;

        div.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="color:#00fff2; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Mode</label>
                <div style="display:flex; gap:8px;">
                     <button id="btn-raise" onclick="window.voxelTerrainSystem.setMode('raise')" style="background:#0f172a; color:#fff; border:1px solid #1e293b; padding:6px 12px; border-radius:6px; cursor:pointer;">⬆️ Raise</button>
                     <button id="btn-lower" onclick="window.voxelTerrainSystem.setMode('lower')" style="background:#0f172a; color:#fff; border:1px solid #1e293b; padding:6px 12px; border-radius:6px; cursor:pointer;">⬇️ Dig</button>
                     <button id="btn-flatten" onclick="window.voxelTerrainSystem.setMode('flatten')" style="background:#0f172a; color:#fff; border:1px solid #1e293b; padding:6px 12px; border-radius:6px; cursor:pointer;">⏹️ Flatten</button>
                </div>
            </div>
            <div style="width:1px; background:#1e293b;"></div>
            <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="color:#00fff2; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Brush Size</label>
                <input type="range" min="1" max="8" value="5" onchange="window.voxelTerrainSystem.brushSize=parseFloat(this.value)" style="accent-color:#00fff2;">
            </div>
        `;

        // Only show when in planet view (will be toggled by game)
        div.style.display = 'none';
        document.body.appendChild(div);
        this.toolbar = div;

        // Initial highlight
        this.setMode('lower');
    }

    showToolbar(visible) {
        if (this.toolbar) this.toolbar.style.display = visible ? 'flex' : 'none';
    }

    setMode(mode) {
        this.mode = mode;
        console.log(`Terraform Mode: ${mode}`);

        // UI Feedback
        ['raise', 'lower', 'flatten'].forEach(m => {
            const btn = document.getElementById(`btn-${m}`);
            if (btn) btn.style.borderColor = m === mode ? '#00fff2' : '#1e293b';
        });
    }

    modifyTerrain(point, strength = 1.0) {
        if (!this.activePlanet) return;

        // "strength" from click is generic; apply sign based on mode
        let amount = 0;
        if (this.mode === 'raise') amount = strength;
        else if (this.mode === 'lower') amount = -strength;
        else if (this.mode === 'flatten') amount = 0; // Special handling needed

        const localPoint = point.clone().applyMatrix4(this.activePlanet.matrixWorld.clone().invert());

        const geometry = this.activePlanet.geometry;
        const posAttr = geometry.attributes.position;
        const position = new THREE.Vector3();

        // Performance: Optimization required for large meshes? 
        // 256x256 segments = 65k vertices. Iterating all in JS is ~5-10ms. Acceptable for click events.

        const radiusSq = this.brushSize * this.brushSize;
        let modified = false;

        // Target height for flattening (average of area)
        let targetHeight = 0;
        if (this.mode === 'flatten') {
            let totalH = 0;
            let count = 0;
            for (let i = 0; i < posAttr.count; i++) {
                position.fromBufferAttribute(posAttr, i);
                if (position.distanceToSquared(localPoint) < radiusSq) {
                    totalH += position.length();
                    count++;
                }
            }
            if (count > 0) targetHeight = totalH / count;
        }

        for (let i = 0; i < posAttr.count; i++) {
            position.fromBufferAttribute(posAttr, i);

            // Check distance
            if (position.distanceToSquared(localPoint) < radiusSq) {
                const dist = position.distanceTo(localPoint);
                const falloff = 0.5 + 0.5 * Math.cos((Math.PI * dist) / this.brushSize); // Smooth bell curve

                const currentLen = position.length();
                let newLen = currentLen;

                if (this.mode === 'flatten') {
                    // Lerp towards target height
                    newLen = currentLen + (targetHeight - currentLen) * 0.1 * falloff;
                } else {
                    // Add/Sub displacement
                    newLen = currentLen + amount * falloff;
                }

                // Keep player edits within the visual terrain envelope.
                if (newLen < 48.75) newLen = 48.75;
                if (newLen > 52.5) newLen = 52.5;

                position.setLength(newLen);

                posAttr.setXYZ(i, position.x, position.y, position.z);
                modified = true;
            }
        }

        if (modified) {
            posAttr.needsUpdate = true;
            geometry.computeVertexNormals();

            // Visual FX
            this.spawnParticles(point, this.mode === 'raise' ? 0x00ff00 : 0xff0000);

            // Notify Fluid System
            if (window.fluidDynamicsSystem) {
                window.fluidDynamicsSystem.onTerrainModified(point, this.brushSize);
            }
        }
    }

    applyBrush(point, amount, radius) {
        if (!this.activePlanet) return;
        const radiusSq = radius * radius;
        const localPoint = point.clone().applyMatrix4(this.activePlanet.matrixWorld.clone().invert());
        const geometry = this.activePlanet.geometry;
        const posAttr = geometry.attributes.position;
        const position = new THREE.Vector3();
        let modified = false;

        for (let i = 0; i < posAttr.count; i++) {
            position.fromBufferAttribute(posAttr, i);
            if (position.distanceToSquared(localPoint) < radiusSq) {
                const dist = position.distanceTo(localPoint);
                const falloff = 0.5 + 0.5 * Math.cos((Math.PI * dist) / radius);
                const currentLen = position.length();
                let newLen = currentLen + amount * falloff;

                if (newLen < 48.75) newLen = 48.75;
                if (newLen > 52.5) newLen = 52.5;

                position.setLength(newLen);
                posAttr.setXYZ(i, position.x, position.y, position.z);
                modified = true;
            }
        }
        if (modified) {
            posAttr.needsUpdate = true;
            geometry.computeVertexNormals();
            this.spawnParticles(point, amount > 0 ? 0x00ff00 : 0xff0000);
            if (window.fluidDynamicsSystem) {
                window.fluidDynamicsSystem.onTerrainModified(point, radius);
            }
        }
    }

    spawnParticles(point, color) {
        // Simple particle burst
        if (!window.game || !window.game.scene) return;

        const particleCount = 10;
        const geo = new THREE.BufferGeometry();
        const positions = [];
        for (let i = 0; i < particleCount; i++) {
            positions.push(point.x, point.y, point.z);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: color, size: 0.5, transparent: true });
        const mesh = new THREE.Points(geo, mat);
        window.game.scene.add(mesh);

        // Animate and remove
        let frame = 0;
        const animate = () => {
            frame++;
            const positions = mesh.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += (Math.random() - 0.5) * 0.5;
                positions[i * 3 + 1] += (Math.random() - 0.5) * 0.5;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.5;
            }
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.material.opacity -= 0.05;

            if (mesh.material.opacity > 0) requestAnimationFrame(animate);
            else {
                window.game.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            }
        };
        animate();
    }
}

if (typeof window !== 'undefined') {
    window.VoxelTerrainSystem = VoxelTerrainSystem;
    window.voxelTerrainSystem = new VoxelTerrainSystem();
}
