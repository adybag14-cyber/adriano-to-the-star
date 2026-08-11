/**
 * 💾 ASSET CACHE
 * Era II: The Living Cosmos - Asset Production
 * 
 * Caching system for downloaded and procedurally generated assets.
 * Uses IndexedDB for persistent storage across sessions.
 */

class AssetCache {
    constructor() {
        this.cacheName = 'ExoplanetPioneerAssets';
        this.db = null;
        this.memoryCache = new Map();
        this.maxMemoryCacheSize = 100;
        
        console.log('💾 Asset Cache: Initialized');
    }

    /**
     * Initialize the cache
     */
    async initialize() {
        try {
            // Open IndexedDB
            const request = indexedDB.open(this.cacheName, 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores for different asset types
                if (!db.objectStoreNames.contains('models')) {
                    db.createObjectStore('models', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('textures')) {
                    db.createObjectStore('textures', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('audio')) {
                    db.createObjectStore('audio', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('skyboxes')) {
                    db.createObjectStore('skyboxes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'id' });
                }
            };
            
            this.db = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            console.log('💾 Asset Cache: IndexedDB initialized');
            
            // Load frequently used assets into memory cache
            await this.loadMemoryCache();
            
        } catch (error) {
            console.error('Failed to initialize asset cache:', error);
        }
    }

    /**
     * Load frequently used assets into memory cache
     */
    async loadMemoryCache() {
        try {
            // In a real implementation, this would load frequently accessed assets
            console.log('💾 Memory cache loaded');
        } catch (error) {
            console.error('Failed to load memory cache:', error);
        }
    }

    /**
     * Store asset in cache
     */
    async store(key, data, type = 'metadata', options = {}) {
        const { persistent = true, priority = 'normal' } = options;
        
        // Store in memory cache
        if (this.memoryCache.size >= this.maxMemoryCacheSize) {
            // Remove least recently used item
            const lruKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(lruKey);
        }
        
        this.memoryCache.set(key, {
            data,
            type,
            priority,
            timestamp: Date.now()
        });
        
        // Store in IndexedDB if persistent
        if (persistent && this.db) {
            try {
                const store = this.db.transaction([type], 'readwrite').objectStore(type);
                
                const assetData = {
                    id: key,
                    data: data,
                    timestamp: Date.now(),
                    size: this.calculateSize(data)
                };
                
                await new Promise((resolve, reject) => {
                    const request = store.put(assetData);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
                
            } catch (error) {
                console.error(`Failed to store ${key} in IndexedDB:`, error);
            }
        }
    }

    /**
     * Retrieve asset from cache
     */
    async retrieve(key, type = 'metadata') {
        // Check memory cache first
        if (this.memoryCache.has(key)) {
            const cached = this.memoryCache.get(key);
            // Update timestamp for LRU
            cached.timestamp = Date.now();
            return cached.data;
        }
        
        // Check IndexedDB
        if (this.db) {
            try {
                const store = this.db.transaction([type], 'readonly').objectStore(type);
                
                const assetData = await new Promise((resolve, reject) => {
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                if (assetData) {
                    // Store in memory cache for faster access
                    this.memoryCache.set(key, {
                        data: assetData.data,
                        type,
                        priority: 'normal',
                        timestamp: Date.now()
                    });
                    
                    return assetData.data;
                }
                
            } catch (error) {
                console.error(`Failed to retrieve ${key} from IndexedDB:`, error);
            }
        }
        
        return null;
    }

    /**
     * Check if asset is cached
     */
    async has(key, type = 'metadata') {
        // Check memory cache
        if (this.memoryCache.has(key)) {
            return true;
        }
        
        // Check IndexedDB
        if (this.db) {
            try {
                const store = this.db.transaction([type], 'readonly').objectStore(type);
                
                const exists = await new Promise((resolve, reject) => {
                    const request = store.count(key);
                    request.onsuccess = () => resolve(request.result > 0);
                    request.onerror = () => reject(request.error);
                });
                
                return exists;
                
            } catch (error) {
                console.error(`Failed to check ${key} in IndexedDB:`, error);
            }
        }
        
        return false;
    }

    /**
     * Remove asset from cache
     */
    async remove(key, type = 'metadata') {
        // Remove from memory cache
        this.memoryCache.delete(key);
        
        // Remove from IndexedDB
        if (this.db) {
            try {
                const store = this.db.transaction([type], 'readwrite').objectStore(type);
                
                await new Promise((resolve, reject) => {
                    const request = store.delete(key);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
                
            } catch (error) {
                console.error(`Failed to remove ${key} from IndexedDB:`, error);
            }
        }
    }

    /**
     * Clear all cached assets
     */
    async clear() {
        // Clear memory cache
        this.memoryCache.clear();
        
        // Clear IndexedDB
        if (this.db) {
            try {
                const stores = ['models', 'textures', 'audio', 'skyboxes', 'metadata'];
                
                for (const storeName of stores) {
                    const store = this.db.transaction([storeName], 'readwrite').objectStore(storeName);
                    
                    await new Promise((resolve, reject) => {
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
                
                console.log('💾 Cache cleared');
                
            } catch (error) {
                console.error('Failed to clear cache:', error);
            }
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        const stats = {
            memoryCache: {
                size: this.memoryCache.size,
                maxSize: this.maxMemoryCacheSize,
                items: Array.from(this.memoryCache.entries()).map(([key, value]) => ({
                    key,
                    type: value.type,
                    priority: value.priority,
                    timestamp: value.timestamp
                }))
            },
            indexedDB: {
                models: 0,
                textures: 0,
                audio: 0,
                skyboxes: 0,
                metadata: 0
            }
        };
        
        // Get IndexedDB counts
        if (this.db) {
            try {
                const stores = ['models', 'textures', 'audio', 'skyboxes', 'metadata'];
                
                for (const storeName of stores) {
                    const store = this.db.transaction([storeName], 'readonly').objectStore(storeName);
                    
                    const count = await new Promise((resolve, reject) => {
                        const request = store.count();
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });
                    
                    stats.indexedDB[storeName] = count;
                }
                
            } catch (error) {
                console.error('Failed to get IndexedDB stats:', error);
            }
        }
        
        return stats;
    }

    /**
     * Calculate size of data
     */
    calculateSize(data) {
        if (typeof data === 'string') {
            return data.length * 2; // UTF-16
        } else if (data instanceof ArrayBuffer) {
            return data.byteLength;
        } else if (data instanceof Blob) {
            return data.size;
        } else if (data instanceof Object) {
            return JSON.stringify(data).length * 2;
        }
        return 0;
    }

    /**
     * Get total cache size
     */
    async getTotalSize() {
        const stats = await this.getStats();
        
        // Calculate memory cache size
        let memorySize = 0;
        for (const [key, value] of this.memoryCache) {
            memorySize += this.calculateSize(value.data);
        }
        
        // IndexedDB size estimation
        const indexedDBSize = Object.values(stats.indexedDB).reduce((sum, count) => sum + count * 1024, 0);
        
        return {
            memory: memorySize,
            indexedDB: indexedDBSize,
            total: memorySize + indexedDBSize
        };
    }

    /**
     * Cleanup old assets
     */
    async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const now = Date.now();
        const cutoffTime = now - maxAge;
        
        // Cleanup memory cache
        for (const [key, value] of this.memoryCache) {
            if (value.timestamp < cutoffTime && value.priority !== 'high') {
                this.memoryCache.delete(key);
            }
        }
        
        // Cleanup IndexedDB
        if (this.db) {
            try {
                const stores = ['models', 'textures', 'audio', 'skyboxes', 'metadata'];
                
                for (const storeName of stores) {
                    const store = this.db.transaction([storeName], 'readwrite').objectStore(storeName);
                    const index = store.index('timestamp');
                    
                    const range = IDBKeyRange.upperBound(cutoffTime);
                    const request = index.openCursor(range);
                    
                    await new Promise((resolve, reject) => {
                        request.onsuccess = (event) => {
                            const cursor = event.target.result;
                            if (cursor) {
                                cursor.delete();
                                cursor.continue();
                            } else {
                                resolve();
                            }
                        };
                        request.onerror = () => reject(request.error);
                    });
                }
                
                console.log('💾 Old assets cleaned up');
                
            } catch (error) {
                console.error('Failed to cleanup old assets:', error);
            }
        }
    }

    /**
     * Export cache to JSON (for backup)
     */
    async export() {
        const exportData = {
            version: '1.0',
            timestamp: Date.now(),
            assets: {}
        };
        
        // Export memory cache
        for (const [key, value] of this.memoryCache) {
            // Only export metadata, not large binary data
            if (value.type === 'metadata') {
                exportData.assets[key] = {
                    data: value.data,
                    type: value.type,
                    timestamp: value.timestamp
                };
            }
        }
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import cache from JSON
     */
    async import(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            for (const [key, asset] of Object.entries(importData.assets)) {
                await this.store(key, asset.data, asset.type, {
                    persistent: true,
                    priority: 'normal'
                });
            }
            
            console.log('💾 Cache imported successfully');
            
        } catch (error) {
            console.error('Failed to import cache:', error);
        }
    }

    /**
     * Dispose
     */
    dispose() {
        this.memoryCache.clear();
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        console.log('💾 Asset Cache: Disposed');
    }
}

export default AssetCache;
