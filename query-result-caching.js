/**
 * Query Result Caching
 * Intelligent caching of database query results
 */

class QueryResultCaching {
    constructor() {
        this.cache = new Map();
        this.cacheConfig = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        this.init();
    }

    init() {
        this.trackEvent('q_ue_ry_re_su_lt_ca_ch_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("q_ue_ry_re_su_lt_ca_ch_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    configureCache(queryPattern, ttl, maxSize) {
        this.cacheConfig.set(queryPattern, {
            ttl,
            maxSize,
            enabled: true
        });
        console.log(`Cache configured for pattern: ${queryPattern}`);
    }

    getCachedResult(query, params) {
        const cacheKey = this.generateCacheKey(query, params);
        const cached = this.cache.get(cacheKey);
        
        if (cached && !this.isExpired(cached)) {
            this.cacheStats.hits++;
            console.log(`Cache hit for query: ${query.substring(0, 50)}...`);
            return cached.data;
        }
        
        if (cached && this.isExpired(cached)) {
            this.cache.delete(cacheKey);
        }
        
        this.cacheStats.misses++;
        return null;
    }

    setCachedResult(query, params, data) {
        const cacheKey = this.generateCacheKey(query, params);
        const config = this.getCacheConfig(query);
        
        if (!config || !config.enabled) {
            return;
        }
        
        const cached = {
            data,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + config.ttl)
        };
        
        // Check cache size limit
        if (this.cache.size >= config.maxSize) {
            this.evictOldest();
        }
        
        this.cache.set(cacheKey, cached);
        console.log(`Query result cached: ${query.substring(0, 50)}...`);
    }

    generateCacheKey(query, params) {
        const paramsStr = params ? JSON.stringify(params) : '';
        return `query_${btoa(query + paramsStr).replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    isExpired(cached) {
        return new Date() > cached.expiresAt;
    }

    getCacheConfig(query) {
        for (const [pattern, config] of this.cacheConfig.entries()) {
            if (query.includes(pattern)) {
                return config;
            }
        }
        return null;
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, cached] of this.cache.entries()) {
            if (cached.cachedAt.getTime() < oldestTime) {
                oldestTime = cached.cachedAt.getTime();
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.cacheStats.evictions++;
            console.log(`Evicted oldest cache entry`);
        }
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
            console.log(`Cache cleared for pattern: ${pattern}`);
        } else {
            this.cache.clear();
            console.log('All cache cleared');
        }
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

    invalidateCache(queryPattern) {
        let invalidated = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(queryPattern)) {
                this.cache.delete(key);
                invalidated++;
            }
        }
        console.log(`Invalidated ${invalidated} cache entries for pattern: ${queryPattern}`);
        return invalidated;
    }
}

if (typeof window !== 'undefined') {
    window.queryResultCaching = new QueryResultCaching();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueryResultCaching;
}

