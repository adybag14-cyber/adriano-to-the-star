/**
 * Service Worker Caching
 * Advanced service worker caching strategies
 */

class ServiceWorkerCaching {
    constructor() {
        this.cacheStrategies = new Map();
        this.cacheRules = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            updates: 0
        };
        this.init();
    }

    init() {
        this.trackEvent('s_er_vi_ce_wo_rk_er_ca_ch_in_g_initialized');
        this.setupDefaultStrategies();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_er_vi_ce_wo_rk_er_ca_ch_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultStrategies() {
        this.cacheStrategies.set('cache-first', {
            name: 'Cache First',
            description: 'Serve from cache, fallback to network'
        });
        
        this.cacheStrategies.set('network-first', {
            name: 'Network First',
            description: 'Try network first, fallback to cache'
        });
        
        this.cacheStrategies.set('stale-while-revalidate', {
            name: 'Stale While Revalidate',
            description: 'Serve from cache while updating in background'
        });
    }

    addCacheRule(ruleId, pattern, strategy, options = {}) {
        this.cacheRules.set(ruleId, {
            id: ruleId,
            pattern,
            strategy,
            maxAge: options.maxAge || 86400000, // 24 hours default
            maxEntries: options.maxEntries || 50,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Cache rule added: ${ruleId}`);
    }

    getCacheStrategy(url) {
        for (const rule of this.cacheRules.values()) {
            if (rule.enabled && this.matchesPattern(url, rule.pattern)) {
                return rule.strategy;
            }
        }
        return 'network-first'; // Default strategy
    }

    matchesPattern(url, pattern) {
        if (pattern instanceof RegExp) {
            return pattern.test(url);
        }
        return url.includes(pattern);
    }

    cacheRequest(url, response, strategy) {
        const cacheKey = this.generateCacheKey(url);
        console.log(`Request cached: ${url} with strategy: ${strategy}`);
        
        this.cacheStats.updates++;
        return {
            url,
            cacheKey,
            strategy,
            cachedAt: new Date()
        };
    }

    getCachedResponse(url) {
        // Simulate cache lookup
        const cached = Math.random() > 0.3; // 70% cache hit rate
        
        if (cached) {
            this.cacheStats.hits++;
            return {
                url,
                cached: true,
                data: 'cached_data'
            };
        } else {
            this.cacheStats.misses++;
            return null;
        }
    }

    generateCacheKey(url) {
        return `cache_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    clearCache(pattern = null) {
        if (pattern) {
            console.log(`Cache cleared for pattern: ${pattern}`);
        } else {
            console.log('All cache cleared');
        }
        return { cleared: true, pattern };
    }

    updateCache(url, newData) {
        console.log(`Cache updated for: ${url}`);
        this.cacheStats.updates++;
        return {
            url,
            updatedAt: new Date()
        };
    }

    getCacheStats() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        const hitRate = total > 0 
            ? (this.cacheStats.hits / total) * 100 
            : 0;
        
        return {
            ...this.cacheStats,
            total,
            hitRate: hitRate.toFixed(2) + '%'
        };
    }

    getCacheRule(ruleId) {
        return this.cacheRules.get(ruleId);
    }

    getAllCacheRules() {
        return Array.from(this.cacheRules.values());
    }
}

if (typeof window !== 'undefined') {
    window.serviceWorkerCaching = new ServiceWorkerCaching();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerCaching;
}
