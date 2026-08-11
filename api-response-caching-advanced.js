/**
 * API Response Caching Advanced
 * Advanced caching strategies for API responses
 */

class APIResponseCachingAdvanced {
    constructor() {
        this.cache = new Map();
        this.cachePolicies = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            invalidations: 0
        };
        this.init();
    }

    init() {
        this.trackEvent('caching_advanced_initialized');
    }

    createCachePolicy(policyId, config) {
        const policy = {
            id: policyId,
            ttl: config.ttl || 3600000, // 1 hour default
            maxAge: config.maxAge || 86400000, // 24 hours default
            staleWhileRevalidate: config.staleWhileRevalidate || false,
            vary: config.vary || [],
            tags: config.tags || [],
            enabled: true,
            createdAt: new Date()
        };
        
        this.cachePolicies.set(policyId, policy);
        console.log(`Cache policy created: ${policyId}`);
        return policy;
    }

    getCachedResponse(cacheKey, varyHeaders = {}) {
        const cached = this.cache.get(cacheKey);
        
        if (!cached) {
            this.cacheStats.misses++;
            return null;
        }
        
        // Check if cache is expired
        if (this.isExpired(cached)) {
            this.cache.delete(cacheKey);
            this.cacheStats.misses++;
            return null;
        }
        
        // Check vary headers
        if (!this.matchesVary(cached.vary, varyHeaders)) {
            this.cacheStats.misses++;
            return null;
        }
        
        this.cacheStats.hits++;
        console.log(`Cache hit for key: ${cacheKey}`);
        return cached.data;
    }

    setCachedResponse(cacheKey, data, policyId, varyHeaders = {}) {
        const policy = this.cachePolicies.get(policyId);
        if (!policy || !policy.enabled) {
            return;
        }
        
        const cached = {
            data,
            policyId,
            vary: varyHeaders,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + policy.ttl),
            staleAt: policy.staleWhileRevalidate 
                ? new Date(Date.now() + policy.maxAge) 
                : null,
            tags: policy.tags
        };
        
        this.cache.set(cacheKey, cached);
        console.log(`Response cached with key: ${cacheKey}`);
    }

    isExpired(cached) {
        return new Date() > cached.expiresAt;
    }

    isStale(cached) {
        if (!cached.staleAt) {
            return false;
        }
        return new Date() > cached.staleAt;
    }

    matchesVary(cachedVary, requestVary) {
        for (const key in cachedVary) {
            if (cachedVary[key] !== requestVary[key]) {
                return false;
            }
        }
        return true;
    }

    invalidateByTag(tag) {
        let invalidated = 0;
        for (const [key, cached] of this.cache.entries()) {
            if (cached.tags.includes(tag)) {
                this.cache.delete(key);
                invalidated++;
            }
        }
        this.cacheStats.invalidations += invalidated;
        console.log(`Invalidated ${invalidated} cache entries by tag: ${tag}`);
        return invalidated;
    }

    invalidateByPattern(pattern) {
        let invalidated = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                invalidated++;
            }
        }
        this.cacheStats.invalidations += invalidated;
        console.log(`Invalidated ${invalidated} cache entries by pattern: ${pattern}`);
        return invalidated;
    }

    getCacheStats() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        const hitRate = total > 0 
            ? (this.cacheStats.hits / total) * 100 
            : 0;
        
        return {
            ...this.cacheStats,
            total,
            hitRate: hitRate.toFixed(2) + '%',
            cacheSize: this.cache.size
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('All cache cleared');
    }

    getCachePolicy(policyId) {
        return this.cachePolicies.get(policyId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`caching_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseCachingAdvanced = new APIResponseCachingAdvanced();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseCachingAdvanced;
}

