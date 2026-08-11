/**
 * Production Asset Manager
 * Handles the loading, caching, and material application for AAA-quality game assets.
 */

class ProductionAssetManager {
    constructor(manifest) {
        this.manifest = manifest;
        this.cache = {
            models: new Map(),
            textures: new Map(),
            materials: new Map()
        };
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.glbtLoader = typeof THREE.GLTFLoader !== 'undefined' ? new THREE.GLTFLoader(this.loadingManager) : null;
        
        this.init();
    }

    init() {
        console.log("🚀 Production Asset Manager initialized.");
        this.setupLoadingCallbacks();
    }

    setupLoadingCallbacks() {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (window.Logger) {
                // Throttle logging or only log milestones
                if (itemsLoaded % 5 === 0 || itemsLoaded === itemsTotal) {
                    console.log(`Loading assets: ${Math.round(progress)}%`);
                }
            }
        };

        this.loadingManager.onError = (url) => {
            console.error(`Error loading asset: ${url}`);
        };
    }

    /**
     * Loads a PBR material from the manifest definitions.
     * @param {string} materialId - ID of the material in the manifest.
     */
    async loadPBRMaterial(materialId) {
        if (this.cache.materials.has(materialId)) {
            return this.cache.materials.get(materialId);
        }

        const matDef = this.findMaterialById(materialId);
        if (!matDef) {
            console.error(`Material definition not found: ${materialId}`);
            return new THREE.MeshStandardMaterial({ color: 0xff00ff }); // Debug magenta
        }

        const material = new THREE.MeshStandardMaterial({
            name: matDef.name
        });

        // Load textures asynchronously if defined
        if (matDef.textures) {
            const texturePromises = [];
            if (matDef.textures.albedo) texturePromises.push(this.loadTexture(matDef.textures.albedo).then(tex => material.map = tex));
            if (matDef.textures.normal) texturePromises.push(this.loadTexture(matDef.textures.normal).then(tex => material.normalMap = tex));
            if (matDef.textures.roughness) texturePromises.push(this.loadTexture(matDef.textures.roughness).then(tex => material.roughnessMap = tex));
            if (matDef.textures.metalness) texturePromises.push(this.loadTexture(matDef.textures.metalness).then(tex => material.metalnessMap = tex));
            if (matDef.textures.ao) texturePromises.push(this.loadTexture(matDef.textures.ao).then(tex => material.aoMap = tex));
            if (matDef.textures.emissive) texturePromises.push(this.loadTexture(matDef.textures.emissive).then(tex => {
                material.emissiveMap = tex;
                material.emissive = new THREE.Color(0xffffff);
            }));

            await Promise.all(texturePromises);
        }
        
        material.needsUpdate = true;
        this.cache.materials.set(materialId, material);
        return material;
    }

    /**
     * Helper to load a texture with caching.
     */
    loadTexture(url) {
        if (this.cache.textures.has(url)) {
            return Promise.resolve(this.cache.textures.get(url));
        }

        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, (texture) => {
                this.cache.textures.set(url, texture);
                resolve(texture);
            }, undefined, (err) => {
                console.error(`Failed to load texture: ${url}`, err);
                resolve(null); // Resolve with null instead of rejecting to allow material to still load
            });
        });
    }

    /**
     * Loads a 3D model with PBR material application support.
     */
    async loadModel(modelPath, materialId = null) {
        const cacheKey = materialId ? `${modelPath}::${materialId}` : modelPath;
        
        if (this.cache.models.has(cacheKey)) {
            return this.cache.models.get(cacheKey).clone();
        }

        if (!this.glbtLoader) {
            console.warn("GLTFLoader not available. Returning placeholder.");
            return this.createPlaceholderModel();
        }

        // Check if the raw model is already cached
        let baseModel;
        if (this.cache.models.has(modelPath)) {
            baseModel = this.cache.models.get(modelPath).clone();
        } else {
            baseModel = await new Promise((resolve, reject) => {
                this.glbtLoader.load(modelPath, (gltf) => {
                    this.cache.models.set(modelPath, gltf.scene);
                    resolve(gltf.scene.clone());
                }, undefined, reject);
            });
        }

        if (materialId) {
            const material = await this.loadPBRMaterial(materialId);
            baseModel.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });
            this.cache.models.set(cacheKey, baseModel);
        }

        return baseModel.clone();
    }

    findMaterialById(id) {
        if (!this.manifest || !this.manifest.materials) {
            console.error("Manifest or materials definition missing!");
            return null;
        }
        return Object.values(this.manifest.materials).find(m => m.id === id);
    }

    findModelById(id) {
        if (!this.manifest || !this.manifest.models) {
            console.error("Manifest or models definition missing!");
            return null;
        }
        for (const category of Object.values(this.manifest.models)) {
            const found = Object.values(category).find(m => m.id === id);
            if (found) return found;
        }
        return null;
    }

    createPlaceholderModel() {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x444444, wireframe: true });
        return new THREE.Mesh(geo, mat);
    }
}

if (typeof window !== 'undefined') {
    window.ProductionAssetManager = ProductionAssetManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionAssetManager;
}
