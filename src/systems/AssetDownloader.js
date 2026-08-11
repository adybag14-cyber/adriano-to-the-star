/**
 * 📥 ASSET DOWNLOADER
 * Era II: The Living Cosmos - Asset Production
 * 
 * Downloads free assets from online sources (OpenGameArt, Sketchfab, Free3D, etc.)
 * and caches them in Cloudflare R2 buckets (25MB+ assets).
 * Used for hero assets while procedural generation handles bulk assets.
 */

class AssetDownloader {
    constructor(game) {
        this.game = game;
        this.cache = new Map();
        this.downloadQueue = [];
        this.isDownloading = false;
        this.maxConcurrentDownloads = 3;
        this.activeDownloads = 0;
        
        // R2 storage for large assets (25MB+ limit bypass)
        this.r2Storage = null;
        this.r2Config = {
            bucketName: 'exoplanet-pioneer-assets',
            maxAssetSize: 25 * 1024 * 1024, // 25MB Cloudflare Pages limit
            useR2ForLargeAssets: true
        };
        
        // Asset sources
        this.sources = {
            opengameart: {
                baseUrl: 'https://opengameart.org',
                apiEndpoint: null
            },
            sketchfab: {
                baseUrl: 'https://sketchfab.com',
                apiEndpoint: 'https://api.sketchfab.com/v3/models'
            },
            free3d: {
                baseUrl: 'https://free3d.com',
                apiEndpoint: null
            },
            kenney: {
                baseUrl: 'https://kenney.nl',
                apiEndpoint: null
            },
            polyhaven: {
                baseUrl: 'https://polyhaven.com',
                apiEndpoint: null
            },
            ambientcg: {
                baseUrl: 'https://ambientcg.com',
                apiEndpoint: null
            }
        };
        
        // Download directory (for small assets)
        this.downloadDir = '/assets/downloaded/';
        
        console.log('📥 Asset Downloader: Initialized (R2 enabled for 25MB+ assets)');
    }

    /**
     * Initialize the asset downloader
     */
    async initialize() {
        // Initialize R2 storage if available
        try {
            const R2AssetStorage = (await import('./R2AssetStorage.js')).default;
            this.r2Storage = new R2AssetStorage(this.game);
            await this.r2Storage.initialize(this.r2Config.bucketName, {
                baseUrl: '/api/r2',
                domain: 'example.com' // Replace with actual domain
            });
            console.log('🗄️ R2 Storage initialized');
        } catch (error) {
            console.warn('R2 Storage not available, using local storage only:', error);
            this.r2Config.useR2ForLargeAssets = false;
        }
        
        // Create download directory if it doesn't exist
        await this.ensureDownloadDirectory();
        
        // Load cached asset manifest
        await this.loadCacheManifest();
    }

    /**
     * Ensure download directory exists
     */
    async ensureDownloadDirectory() {
        // In a real implementation, this would check/create the directory
        console.log('📁 Download directory ready:', this.downloadDir);
    }

    /**
     * Load cached asset manifest
     */
    async loadCacheManifest() {
        // In a real implementation, this would load from localStorage or IndexedDB
        console.log('📋 Cache manifest loaded');
    }

    /**
     * Download an asset from a source
     */
    async downloadAsset(assetId, source = 'opengameart', options = {}) {
        const cacheKey = `${source}_${assetId}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log(`✅ Asset ${assetId} already cached`);
            return this.cache.get(cacheKey);
        }
        
        console.log(`📥 Downloading asset ${assetId} from ${source}...`);
        
        try {
            let assetData;
            
            switch (source) {
                case 'opengameart':
                    assetData = await this.downloadFromOpenGameArt(assetId, options);
                    break;
                case 'sketchfab':
                    assetData = await this.downloadFromSketchfab(assetId, options);
                    break;
                case 'free3d':
                    assetData = await this.downloadFromFree3D(assetId, options);
                    break;
                case 'kenney':
                    assetData = await this.downloadFromKenney(assetId, options);
                    break;
                case 'polyhaven':
                    assetData = await this.downloadFromPolyHaven(assetId, options);
                    break;
                case 'ambientcg':
                    assetData = await this.downloadFromAmbientCG(assetId, options);
                    break;
                default:
                    throw new Error(`Unknown source: ${source}`);
            }
            
            // Check if asset is too large for Cloudflare Pages
            const assetSize = this.calculateAssetSize(assetData);
            
            if (this.r2Config.useR2ForLargeAssets && assetSize > this.r2Config.maxAssetSize) {
                console.log(`🗄️ Asset ${assetId} (${(assetSize / 1024 / 1024).toFixed(2)}MB) exceeds 25MB limit, storing in R2`);
                await this.storeInR2(assetId, assetData, source);
            }
            
            // Cache the asset
            this.cache.set(cacheKey, assetData);
            
            // Save to cache manifest
            await this.saveToCache(cacheKey, assetData);
            
            console.log(`✅ Downloaded asset ${assetId} (${(assetSize / 1024 / 1024).toFixed(2)}MB)`);
            return assetData;
            
        } catch (error) {
            console.error(`❌ Failed to download asset ${assetId}:`, error);
            throw error;
        }
    }

    /**
     * Download asset from OpenGameArt
     */
    async downloadFromOpenGameArt(assetId, options) {
        // OpenGameArt assets typically need to be downloaded via direct URLs
        // This is a placeholder implementation
        
        const assetInfo = options.assetInfo || {
            url: `https://opengameart.org/content/${assetId}`,
            filename: `${assetId}.zip`
        };
        
        // In a real implementation, this would:
        // 1. Fetch the asset page to get the download URL
        // 2. Download the asset file
        // 3. Extract if it's a zip file
        // 4. Parse the 3D model file
        
        // For now, return a placeholder
        return {
            id: assetId,
            source: 'opengameart',
            type: 'model',
            format: 'gltf',
            url: assetInfo.url,
            downloaded: true,
            data: null // Would contain the actual model data
        };
    }

    /**
     * Download asset from Sketchfab
     */
    async downloadFromSketchfab(assetId, options) {
        // Sketchfab has an API but requires authentication
        // For free models, we can use the download URL
        
        const assetInfo = options.assetInfo || {
            modelId: assetId
        };
        
        // In a real implementation, this would:
        // 1. Query the Sketchfab API for model details
        // 2. Get the download URL for the model
        // 3. Download the .glb or .gltf file
        
        return {
            id: assetId,
            source: 'sketchfab',
            type: 'model',
            format: 'glb',
            url: `https://sketchfab.com/3d-models/${assetId}`,
            downloaded: true,
            data: null
        };
    }

    /**
     * Download asset from Kenney
     */
    async downloadFromKenney(assetId, options) {
        const assetInfo = options.assetInfo || {
            url: `https://kenney.nl/assets/space-kit`,
            filename: `${assetId}.zip`
        };
        
        // In a real implementation, this would:
        // 1. Fetch the asset from Kenney
        // 2. Extract if it's a zip file
        // 3. Parse the 3D model file
        
        return {
            id: assetId,
            source: 'kenney',
            type: 'model',
            format: 'blend',
            url: assetInfo.url,
            downloaded: true,
            data: null
        };
    }

    /**
     * Download asset from Poly Haven
     */
    async downloadFromPolyHaven(assetId, options) {
        const assetInfo = options.assetInfo || {
            url: `https://polyhaven.com/textures/${assetId}`,
            filename: `${assetId}.hdr`
        };
        
        // In a real implementation, this would:
        // 1. Fetch the HDR texture from Poly Haven
        // 2. Store for use as environment map or skybox
        
        return {
            id: assetId,
            source: 'polyhaven',
            type: 'skybox',
            format: 'hdr',
            url: assetInfo.url,
            downloaded: true,
            data: null
        };
    }

    /**
     * Download asset from AmbientCG
     */
    async downloadFromAmbientCG(assetId, options) {
        const assetInfo = options.assetInfo || {
            url: `https://ambientcg.com/view?t=${assetId}`,
            filename: `${assetId}.jpg`
        };
        
        // In a real implementation, this would:
        // 1. Fetch the texture from AmbientCG
        // 2. Get all PBR map types (albedo, normal, roughness, etc.)
        
        return {
            id: assetId,
            source: 'ambientcg',
            type: 'texture',
            format: 'jpg',
            url: assetInfo.url,
            downloaded: true,
            data: null
        };
    }

    /**
     * Batch download multiple assets
     */
    async downloadAssets(assets) {
        const results = [];
        
        for (const asset of assets) {
            try {
                const result = await this.downloadAsset(asset.id, asset.source, asset.options);
                results.push({ id: asset.id, success: true, data: result });
            } catch (error) {
                results.push({ id: asset.id, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Get asset from cache
     */
    getCachedAsset(cacheKey) {
        return this.cache.get(cacheKey);
    }

    /**
     * Check if asset is cached
     */
    isCached(cacheKey) {
        return this.cache.has(cacheKey);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }

    /**
     * Save asset to cache
     */
    async saveToCache(key, data) {
        // In a real implementation, this would save to IndexedDB or localStorage
        console.log(`💾 Cached asset: ${key}`);
    }

    /**
     * Get download progress
     */
    getDownloadProgress() {
        return {
            queueLength: this.downloadQueue.length,
            activeDownloads: this.activeDownloads,
            cachedAssets: this.cache.size,
            r2Enabled: !!this.r2Storage,
            r2Config: this.r2Config
        };
    }

    /**
     * Calculate asset size
     */
    calculateAssetSize(assetData) {
        if (assetData.data instanceof ArrayBuffer) {
            return assetData.data.byteLength;
        } else if (assetData.data instanceof Blob) {
            return assetData.data.size;
        } else if (typeof assetData.data === 'string') {
            return assetData.data.length * 2; // UTF-16
        } else if (assetData.data instanceof Object) {
            return JSON.stringify(assetData.data).length * 2;
        }
        return 0;
    }

    /**
     * Store asset in R2 bucket
     */
    async storeInR2(key, assetData, source) {
    if (!this.r2Storage) {
        console.warn('R2 storage not available, skipping R2 upload');
        return;
    }

    try {
        // Convert asset data to Blob if needed
        let blob;
        if (assetData.data instanceof ArrayBuffer) {
            blob = new Blob([assetData.data], { type: 'application/octet-stream' });
        } else if (assetData.data instanceof Blob) {
            blob = assetData.data;
        } else if (typeof assetData.data === 'string') {
            blob = new Blob([assetData.data], { type: 'text/plain' });
        } else {
            blob = new Blob([JSON.stringify(assetData.data)], { type: 'application/json' });
        }

        const metadata = {
            source,
            originalUrl: assetData.url,
            format: assetData.format,
            type: assetData.type,
            timestamp: Date.now()
        };

        await this.r2Storage.uploadAsset(key, blob, metadata);
        
        console.log(`🗄️ Stored ${key} in R2 bucket`);
        
    } catch (error) {
        console.error(`Failed to store ${key} in R2:`, error);
    }
}

/**
 * Retrieve asset from R2 bucket
 */
async retrieveFromR2(key) {
    if (!this.r2Storage) {
        return null;
    }

    try {
        const url = await this.r2Storage.downloadAsset(key);
        console.log(`🗄️ Retrieved ${key} from R2 bucket`);
        return url;
    } catch (error) {
        console.error(`Failed to retrieve ${key} from R2:`, error);
        return null;
    }
}

/**
 * Check if asset is in R2
 */
async isInR2(key) {
    if (!this.r2Storage) {
        return false;
    }

    try {
        return await this.r2Storage.assetExists(key);
    } catch (error) {
        console.error(`Failed to check R2 for ${key}:`, error);
        return false;
    }
}

/**
 * Delete asset from R2
 */
async deleteFromR2(key) {
    if (!this.r2Storage) {
        return false;
    }

    try {
        await this.r2Storage.deleteAsset(key);
        console.log(`🗑️ Deleted ${key} from R2 bucket`);
        return true;
    } catch (error) {
        console.error(`Failed to delete ${key} from R2:`, error);
        return false;
    }
}

/**
 * Get R2 bucket info
 */
async getR2Info() {
    if (!this.r2Storage) {
        return null;
    }

    try {
        return await this.r2Storage.getBucketInfo();
    } catch (error) {
        console.error('Failed to get R2 bucket info:', error);
        return null;
    }
}

/**
 * List all assets in R2
 */
async listR2Assets(prefix = '') {
    if (!this.r2Storage) {
        return [];
    }

    try {
        return await this.r2Storage.listAssets(prefix);
    } catch (error) {
        console.error('Failed to list R2 assets:', error);
        return [];
    }
  }

  /**
   * Cleanup
   */
  dispose() {
        this.cache.clear();
        this.downloadQueue = [];
        if (this.r2Storage) {
            this.r2Storage.dispose();
        }
        console.log('📥 Asset Downloader: Disposed');
    }
}

export default AssetDownloader;
