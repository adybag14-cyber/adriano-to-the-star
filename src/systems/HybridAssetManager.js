/**
 * 🔄 HYBRID ASSET MANAGER
 * Era II: The Living Cosmos - Asset Production
 * 
 * Combines procedural generation and downloaded assets.
 * Uses downloaded hero assets for key elements, procedural generation for bulk assets.
 */

import ProceduralAssetGenerator from './ProceduralAssetGenerator.js';
import ProceduralTerrainTextureGenerator from './ProceduralTerrainTextureGenerator.js';
import AssetDownloader from './AssetDownloader.js';
import THREETerrain from './THREE.Terrain.js';

class HybridAssetManager {
    constructor(game) {
        this.game = game;
        
        // Asset systems
        this.proceduralGenerator = new ProceduralAssetGenerator(game);
        this.terrainGenerator = new ProceduralTerrainTextureGenerator();
        this.assetDownloader = new AssetDownloader(game);
        this.terrainMeshGenerator = new THREETerrain();
        
        // Asset cache
        this.assetCache = new Map();
        this.loadingPromises = new Map();
        
        // Asset manifest
        this.assetManifest = null;
        
        // Hero assets (downloaded)
        this.heroAssets = new Set([
            'ship-viper-interceptor',
            'character-pioneer-suit',
            'megastructure-dyson-ring'
        ]);
        
        console.log('🔄 Hybrid Asset Manager: Initialized');
    }

    /**
     * Initialize the hybrid asset manager
     */
    async initialize() {
        // Initialize all systems
        this.proceduralGenerator.initialize();
        await this.assetDownloader.initialize();
        
        // Load asset manifest
        await this.loadAssetManifest();
        
        console.log('🔄 Hybrid Asset Manager: Ready');
    }

    /**
     * Load asset manifest
     */
    async loadAssetManifest() {
        try {
            const response = await fetch('/assets/manifest.json');
            this.assetManifest = await response.json();
            console.log('📋 Asset manifest loaded:', Object.keys(this.assetManifest.assets).length, 'categories');
        } catch (error) {
            console.error('Failed to load asset manifest:', error);
            this.assetManifest = { assets: {} };
        }
    }

    /**
     * Get an asset (hybrid approach)
     */
    async getAsset(assetId, type = 'model', options = {}) {
        const cacheKey = `${type}_${assetId}`;
        
        // Check cache first
        if (this.assetCache.has(cacheKey)) {
            return this.assetCache.get(cacheKey);
        }
        
        // Check if already loading
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }
        
        // Determine source (hero assets = downloaded, others = procedural)
        const useDownloaded = this.heroAssets.has(assetId) && options.forceProcedural !== true;
        
        const loadingPromise = useDownloaded 
            ? this.getDownloadedAsset(assetId, type, options)
            : this.getProceduralAsset(assetId, type, options);
        
        this.loadingPromises.set(cacheKey, loadingPromise);
        
        try {
            const asset = await loadingPromise;
            this.assetCache.set(cacheKey, asset);
            this.loadingPromises.delete(cacheKey);
            return asset;
        } catch (error) {
            this.loadingPromises.delete(cacheKey);
            console.error(`Failed to load asset ${assetId}:`, error);
            
            // Fallback to procedural if download fails
            if (useDownloaded && type === 'model') {
                console.log(`⚠️ Falling back to procedural generation for ${assetId}`);
                return this.getProceduralAsset(assetId, type, options);
            }
            
            throw error;
        }
    }

    /**
     * Get downloaded asset
     */
    async getDownloadedAsset(assetId, type, options) {
        console.log(`📥 Loading downloaded asset: ${assetId}`);
        
        try {
            const assetData = await this.assetDownloader.downloadAsset(assetId, options.source || 'opengameart', options);
            
            // Convert to Three.js object
            switch (type) {
                case 'model':
                    return this.parseModelAsset(assetData);
                case 'texture':
                    return this.parseTextureAsset(assetData);
                case 'audio':
                    return this.parseAudioAsset(assetData);
                default:
                    return assetData;
            }
        } catch (error) {
            console.error(`Failed to load downloaded asset ${assetId}:`, error);
            throw error;
        }
    }

    /**
     * Get procedural asset
     */
    async getProceduralAsset(assetId, type, options) {
        console.log(`🎨 Generating procedural asset: ${assetId}`);
        
        switch (type) {
            case 'model':
                return this.proceduralGenerator.generateModel(options.modelType || 'default', options);
            case 'texture':
                return this.proceduralGenerator.generateTexture(options.textureType || 'noise', options);
            case 'terrain':
                return this.terrainGenerator.generateTerrainTexture(options.biome || 'earth', options);
            case 'terrain-mesh':
                return this.terrainMeshGenerator.generateMesh(options);
            case 'audio':
                return this.proceduralGenerator.generateAudio(options.audioType || 'ui', options);
            case 'skybox':
                return this.proceduralGenerator.generateSkybox(options.skyboxType || 'nebula', options);
            case 'material':
                return this.terrainGenerator.generateTerrainMaterial(options.biome || 'earth', options);
            default:
                throw new Error(`Unknown asset type: ${type}`);
        }
    }

    /**
     * Parse model asset
     */
    parseModelAsset(assetData) {
        // In a real implementation, this would parse GLTF/GLB/OBJ/FBX files
        // For now, return a placeholder
        
        if (assetData.data) {
            // Parse the actual model data
            return assetData.data;
        }
        
        // Fallback to procedural
        console.log('⚠️ Model data not available, using procedural fallback');
        return this.proceduralGenerator.generateModel('default', {});
    }

    /**
     * Parse texture asset
     */
    parseTextureAsset(assetData) {
        if (assetData.data) {
            return assetData.data;
        }
        
        return this.proceduralGenerator.generateTexture('noise', {});
    }

    /**
     * Parse audio asset
     */
    parseAudioAsset(assetData) {
        if (assetData.data) {
            return assetData.data;
        }
        
        return this.proceduralGenerator.generateAudio('ui', {});
    }

    /**
     * Preload hero assets
     */
    async preloadHeroAssets() {
        console.log('📦 Preloading hero assets...');
        
        const preloadPromises = Array.from(this.heroAssets).map(async (assetId) => {
            try {
                await this.getAsset(assetId, 'model');
                console.log(`✅ Preloaded: ${assetId}`);
            } catch (error) {
                console.warn(`⚠️ Failed to preload ${assetId}:`, error);
            }
        });
        
        await Promise.all(preloadPromises);
        console.log('📦 Hero asset preload complete');
    }

    /**
     * Get asset by category
     */
    async getAssetByCategory(category, assetId, options = {}) {
        if (!this.assetManifest || !this.assetManifest.assets[category]) {
            console.warn(`Unknown category: ${category}`);
            return this.getAsset(assetId, 'model', options);
        }
        
        const categoryAssets = this.assetManifest.assets[category];
        const assetInfo = categoryAssets.find(a => a.id === assetId);
        
        if (!assetInfo) {
            console.warn(`Asset ${assetId} not found in category ${category}`);
            return this.getAsset(assetId, 'model', options);
        }
        
        const type = this.getAssetTypeFromCategory(category);
        return this.getAsset(assetId, type, { ...options, ...assetInfo });
    }

    /**
     * Get asset type from category
     */
    getAssetTypeFromCategory(category) {
        const typeMap = {
            models: 'model',
            textures: 'texture',
            audio: 'audio',
            skyboxes: 'skybox'
        };
        
        return typeMap[category] || 'model';
    }

    /**
     * Batch load assets
     */
    async loadAssets(assetList) {
        const results = [];
        
        for (const asset of assetList) {
            try {
                const loadedAsset = await this.getAsset(asset.id, asset.type, asset.options);
                results.push({ id: asset.id, success: true, data: loadedAsset });
            } catch (error) {
                results.push({ id: asset.id, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Clear asset cache
     */
    clearCache() {
        this.assetCache.clear();
        console.log('🗑️ Asset cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cachedAssets: this.assetCache.size,
            loadingAssets: this.loadingPromises.size,
            heroAssets: this.heroAssets.size,
            downloadProgress: this.assetDownloader.getDownloadProgress()
        };
    }

    /**
     * Add hero asset
     */
    addHeroAsset(assetId) {
        this.heroAssets.add(assetId);
        console.log(`⭐ Added hero asset: ${assetId}`);
    }

    /**
     * Remove hero asset
     */
    removeHeroAsset(assetId) {
        this.heroAssets.delete(assetId);
        console.log(`❌ Removed hero asset: ${assetId}`);
    }

    /**
     * Get all hero assets
     */
    getHeroAssets() {
        return Array.from(this.heroAssets);
    }

    /**
     * Download and cache hero assets
     */
    async downloadHeroAssets() {
        console.log('📥 Downloading hero assets...');
        
        const downloadList = Array.from(this.heroAssets).map(assetId => ({
            id: assetId,
            source: 'opengameart',
            options: {}
        }));
        
        const results = await this.assetDownloader.downloadAssets(downloadList);
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`📥 Download complete: ${successful} successful, ${failed} failed`);
        
        return results;
    }

    /**
     * Generate terrain mesh
     */
    async generateTerrain(options = {}) {
        return this.terrainMeshGenerator.generateMesh(options);
    }

    /**
     * Generate terrain texture
     */
    async generateTerrainTexture(biome, options = {}) {
        return this.terrainGenerator.generateTerrainTexture(biome, options);
    }

    /**
     * Generate PBR material
     */
    async generatePBRMaterial(biome, options = {}) {
        return this.terrainGenerator.generateTerrainMaterial(biome, options);
    }

    /**
     * Play audio
     */
    playAudio(audioBuffer, volume = 1.0) {
        this.proceduralGenerator.playAudio(audioBuffer, volume);
    }

    /**
     * Cleanup
     */
    dispose() {
        // Clear cache
        this.assetCache.clear();
        this.loadingPromises.clear();
        
        // Dispose systems
        this.proceduralGenerator.dispose();
        this.terrainGenerator.dispose();
        this.assetDownloader.dispose();
        this.terrainMeshGenerator.dispose();
        
        console.log('🔄 Hybrid Asset Manager: Disposed');
    }
}

export default HybridAssetManager;
