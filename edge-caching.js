/**
 * Edge Caching
 * Edge device caching system
 */

class EdgeCaching {
    constructor() {
        this.caches = new Map();
        this.policies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_caching_initialized');
    }

    createCache(cacheId, cacheData) {
        const cache = {
            id: cacheId,
            ...cacheData,
            name: cacheData.name || cacheId,
            maxSize: cacheData.maxSize || 1000,
            ttl: cacheData.ttl || 3600,
            entries: new Map(),
            createdAt: new Date()
        };
        
        this.caches.set(cacheId, cache);
        console.log(`Edge cache created: ${cacheId}`);
        return cache;
    }

    set(cacheId, key, value, ttl = null) {
        const cache = this.caches.get(cacheId);
        if (!cache) {
            throw new Error('Cache not found');
        }
        
        const entry = {
            key,
            value,
            ttl: ttl || cache.ttl,
            expiresAt: new Date(Date.now() + (ttl || cache.ttl) * 1000),
            createdAt: new Date()
        };
        
        cache.entries.set(key, entry);
        
        if (cache.entries.size > cache.maxSize) {
            const firstKey = cache.entries.keys().next().value;
            cache.entries.delete(firstKey);
        }
        
        return entry;
    }

    get(cacheId, key) {
        const cache = this.caches.get(cacheId);
        if (!cache) {
            throw new Error('Cache not found');
        }
        
        const entry = cache.entries.get(key);
        if (!entry) {
            return null;
        }
        
        if (new Date() > entry.expiresAt) {
            cache.entries.delete(key);
            return null;
        }
        
        return entry.value;
    }

    delete(cacheId, key) {
        const cache = this.caches.get(cacheId);
        if (!cache) {
            throw new Error('Cache not found');
        }
        
        return cache.entries.delete(key);
    }

    clear(cacheId) {
        const cache = this.caches.get(cacheId);
        if (!cache) {
            throw new Error('Cache not found');
        }
        
        cache.entries.clear();
        return true;
    }

    getCache(cacheId) {
        return this.caches.get(cacheId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_caching_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.edgeCaching = new EdgeCaching();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeCaching;
}


