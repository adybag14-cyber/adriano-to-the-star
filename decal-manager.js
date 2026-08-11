/**
 * Decal Manager
 * Handles the application of decals (logos, stripes, hazard signs) to meshes.
 * Part of the Asset Production Roadmap - Category 1 (Items 37-38).
 */

class DecalManager {
    constructor(scene) {
        this.scene = scene;
        this.decals = [];
        this.textureLoader = new THREE.TextureLoader();
        this.init();
    }

    init() {
        console.log("🏷️ Decal Manager initialized.");
    }

    /**
     * Projects a decal onto a target mesh.
     * @param {THREE.Mesh} target - The mesh to apply the decal to.
     * @param {THREE.Vector3} position - Position of projection.
     * @param {THREE.Euler} orientation - Orientation of projection.
     * @param {THREE.Vector3} size - Size of the decal box.
     * @param {string} texturePath - URL to the decal texture.
     */
    applyDecal(target, position, orientation, size, texturePath) {
        const material = new THREE.MeshPhongMaterial({
            map: this.textureLoader.load(texturePath),
            transparent: true,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            wireframe: false
        });

        // Use THREE.DecalGeometry if available (usually requires including the example script)
        if (typeof THREE.DecalGeometry !== 'undefined') {
            const geometry = new THREE.DecalGeometry(target, position, orientation, size);
            const decalMesh = new THREE.Mesh(geometry, material);
            this.scene.add(decalMesh);
            this.decals.push(decalMesh);
            return decalMesh;
        } else {
            console.warn("THREE.DecalGeometry not found. Decal logic stubbed.");
            return null;
        }
    }

    removeDecals() {
        this.decals.forEach(d => this.scene.remove(d));
        this.decals = [];
    }
}

if (typeof window !== 'undefined') {
    window.DecalManager = DecalManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecalManager;
}
