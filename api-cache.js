/**
 * API Response Caching
 * Cache API responses to reduce server load and improve performance
 */

class APICache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
        this.maxCacheSize = 100; // Maximum number of cached items
        this.hitCount = 0;
        this.missCount = 0;
        this.init();
    }

    init() {
        // Load cache from localStorage
        this.loadCache();
        
        // Clean up expired entries periodically
        setInterval(() => this.cleanup(), 60000); // Every minute
        this.trackEvent('cache_initialized');
    }

    /**
     * Load cache from localStorage
     */
    loadCache() {
        try {
            const cached = localStorage.getItem('api-cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                const now = Date.now();
                
                Object.entries(parsed).forEach(([key, value]) => {
                    if (value.expiresAt > now) {
                        this.cache.set(key, value);
                    }
                });
            }
        } catch (e) {
            console.error('Error loading API cache:', e);
        }
    }

    /**
     * Save cache to localStorage
     */
    saveCache() {
        try {
            const obj = Object.fromEntries(this.cache);
            localStorage.setItem('api-cache', JSON.stringify(obj));
        } catch (e) {
            console.error('Error saving API cache:', e);
            // If cache is too large, remove oldest entries
            if (this.cache.size > this.maxCacheSize) {
                this.evictOldest();
            }
        }
    }

    /**
     * Get cached response
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            this.missCount++;
            this.logStats('miss', key);
            return null;
        }

        // Check if expired
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            this.saveCache();
            this.missCount++;
            this.logStats('miss', key);
            return null;
        }

        this.hitCount++;
        this.logStats('hit', key);
        return cached.data;
    }

    /**
     * Set cached response
     */
    set(key, data, ttl = null) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        
        this.cache.set(key, {
            data,
            expiresAt,
            cachedAt: Date.now()
        });

        // Evict if cache is too large
        if (this.cache.size > this.maxCacheSize) {
            this.evictOldest();
        }

        this.saveCache();
    }

    /**
     * Evict oldest cache entries
     */
    evictOldest() {
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
        
        const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.2)); // Remove 20%
        toRemove.forEach(([key]) => this.cache.delete(key));
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = false;

        this.cache.forEach((value, key) => {
            if (now > value.expiresAt) {
                this.cache.delete(key);
                cleaned = true;
            }
        });

        if (cleaned) {
            this.saveCache();
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        localStorage.removeItem('api-cache');
    }

    /**
     * Generate cache key from URL and options
     */
    generateKey(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }

    /**
     * Cached fetch wrapper
     */
    async fetch(url, options = {}) {
        // Only cache GET requests by default
        if (options.method && options.method.toUpperCase() !== 'GET') {
            return fetch(url, options);
        }

        const cacheKey = this.generateKey(url, options);
        const cached = this.get(cacheKey);

        if (cached) {
            // Return cached response
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch from API
        try {
            const response = await fetch(url, options);
            const data = await response.json();

            // Cache successful responses
            if (response.ok) {
                this.set(cacheKey, data);
            }

            return response;
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    /**
     * Invalidate cache for a specific key pattern
     */
    invalidate(pattern) {
        const regex = new RegExp(pattern);
        let invalidated = false;

        this.cache.forEach((value, key) => {
            if (regex.test(key)) {
                this.cache.delete(key);
                invalidated = true;
            }
        });

        if (invalidated) {
            this.saveCache();
        }
    }

    logStats(type, key) {
        const stats = {
            type,
            key,
            hitCount: this.hitCount,
            missCount: this.missCount,
            timestamp: Date.now()
        };
        window.apiCacheStats = window.apiCacheStats || { events: [] };
        window.apiCacheStats.events.push(stats);
        if (window.apiCacheStats.events.length > 100) {
            window.apiCacheStats.events.shift();
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track(type === 'hit' ? 'API Cache Hit' : 'API Cache Miss', {
                key,
                timestamp: stats.timestamp
            });
        }
    }
}

// Initialize API cache
let apiCacheInstance = null;

function initAPICache() {
    if (!apiCacheInstance) {
        apiCacheInstance = new APICache();
    }
    return apiCacheInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAPICache);
} else {
    initAPICache();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APICache;
}

// Make available globally
APICache.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`api_cache_${eventName}`, 1, data);
        }
    } catch (e) { /* Silent fail */ }
};

window.APICache = APICache;
window.apiCache = () => apiCacheInstance;

