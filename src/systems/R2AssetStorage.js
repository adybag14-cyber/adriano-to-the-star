/**
 * 🗄️ R2 ASSET STORAGE
 * Era II: The Living Cosmos - Cloudflare R2 Integration
 * 
 * Manages asset storage in Cloudflare R2 buckets.
 * Handles large asset files that exceed Cloudflare Pages 25MB limit.
 */

class R2AssetStorage {
    constructor(game) {
        this.game = game;
        this.bucketName = null;
        this.baseUrl = null;
        this.publicUrl = null;
        this.cache = new Map();
        
        console.log('🗄️ R2 Asset Storage: Initialized');
    }

    /**
     * Initialize R2 storage
     */
    async initialize(bucketName, config = {}) {
        this.bucketName = bucketName;
        this.baseUrl = config.baseUrl || '/api/r2';
        this.publicUrl = config.publicUrl || `https://r2.${config.domain || 'example.com'}/${bucketName}`;
        
        console.log(`🗄️ R2 Storage configured: ${this.bucketName}`);
    }

    /**
     * Upload asset to R2
     */
    async uploadAsset(key, data, metadata = {}) {
        const formData = new FormData();
        formData.append('file', data);
        formData.append('key', key);
        formData.append('metadata', JSON.stringify(metadata));
        
        try {
            const response = await fetch(`${this.baseUrl}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Cache the asset URL
            this.cache.set(key, result.url);
            
            console.log(`✅ Uploaded to R2: ${key}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to upload ${key} to R2:`, error);
            throw error;
        }
    }

    /**
     * Download asset from R2
     */
    async downloadAsset(key) {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/download/${key}`);
            
            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Cache the URL
            this.cache.set(key, url);
            
            console.log(`✅ Downloaded from R2: ${key}`);
            return url;
            
        } catch (error) {
            console.error(`❌ Failed to download ${key} from R2:`, error);
            throw error;
        }
    }

    /**
     * Get public URL for asset
     */
    getPublicUrl(key) {
        return `${this.publicUrl}/${key}`;
    }

    /**
     * Check if asset exists in R2
     */
    async assetExists(key) {
        try {
            const response = await fetch(`${this.baseUrl}/exists/${key}`);
            
            if (!response.ok) {
                return false;
            }
            
            const result = await response.json();
            return result.exists;
            
        } catch (error) {
            console.error(`Failed to check existence of ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete asset from R2
     */
    async deleteAsset(key) {
        try {
            const response = await fetch(`${this.baseUrl}/delete/${key}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Delete failed: ${response.statusText}`);
            }
            
            // Remove from cache
            this.cache.delete(key);
            
            console.log(`🗑️ Deleted from R2: ${key}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to delete ${key} from R2:`, error);
            throw error;
        }
    }

    /**
     * List all assets in bucket
     */
    async listAssets(prefix = '') {
        try {
            const response = await fetch(`${this.baseUrl}/list?prefix=${encodeURIComponent(prefix)}`);
            
            if (!response.ok) {
                throw new Error(`List failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result.assets;
            
        } catch (error) {
            console.error('Failed to list assets:', error);
            return [];
        }
    }

    /**
     * Get bucket info
     */
    async getBucketInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/info`);
            
            if (!response.ok) {
                throw new Error(`Info failed: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Failed to get bucket info:', error);
            return null;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        // Revoke all blob URLs
        for (const url of this.cache.values()) {
            URL.revokeObjectURL(url);
        }
        
        this.cache.clear();
        console.log('🗑️ R2 cache cleared');
    }

    /**
     * Dispose
     */
    dispose() {
        this.clearCache();
        console.log('🗄️ R2 Asset Storage: Disposed');
    }
}

export default R2AssetStorage;
