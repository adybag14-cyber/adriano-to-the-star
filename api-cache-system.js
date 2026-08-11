/**
 * API Cache System with Cache Invalidation
 * 
 * Implements caching strategy for API responses with cache invalidation.
 * 
 * @module APICacheSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class APICacheSystem {
    constructor() {
        this.cache = new Map();
        this.cacheMetadata = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = 100; // Maximum number of cached items
        this.isInitialized = false;
        this.hitCount = 0;
        this.missCount = 0;
    }

    /**
     * Initialize cache system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('APICacheSystem already initialized');
            return;
        }

        this.defaultTTL = options.defaultTTL || this.defaultTTL;
        this.maxCacheSize = options.maxCacheSize || this.maxCacheSize;
        this.startCleanupTimer();
        this.loadFromStorage();
        
        this.isInitialized = true;
        this.trackEvent('cache_system_initialized');
    }

    /**
     * Generate cache key
     * @private
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {string} Cache key
     */
    generateCacheKey(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }

    /**
     * Get cached response
     * @public
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Object|null} Cached response or null
     */
    get(url, options = {}) {
        const key = this.generateCacheKey(url, options);
        const metadata = this.cacheMetadata.get(key);

        if (!metadata) {
            this.missCount++;
            this.logStats('miss', key, url);
            return null;
        }

        // Check if expired
        if (Date.now() > metadata.expiresAt) {
            this.delete(key);
            this.missCount++;
            this.logStats('miss', key, url);
            return null;
        }

        this.hitCount++;
        this.logStats('hit', key, url);
        return this.cache.get(key);
    }

    /**
     * Set cached response
     * @public
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @param {*} response - Response data
     * @param {Object} cacheOptions - Cache options
     */
    set(url, options = {}, response, cacheOptions = {}) {
        const key = this.generateCacheKey(url, options);
        const ttl = cacheOptions.ttl || this.defaultTTL;
        const expiresAt = Date.now() + ttl;

        // Check cache size
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest();
        }

        const namespace = cacheOptions.namespace || cacheOptions.ns || 'default';
        const tags = Array.isArray(cacheOptions.tags) ? cacheOptions.tags.slice() : [];
        const nsTag = `ns:${namespace}`;
        if (!tags.includes(nsTag)) {
            tags.push(nsTag);
        }

        this.cache.set(key, response);
        this.cacheMetadata.set(key, {
            expiresAt,
            createdAt: Date.now(),
            url,
            options: { ...options },
            tags,
            namespace
        });

        // Save to storage
        this.saveToStorage();
    }

    /**
     * Delete cache entry
     * @public
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        this.cacheMetadata.delete(key);
        this.saveToStorage();
    }

    /**
     * Invalidate cache by tags
     * @public
     * @param {Array} tags - Tags to invalidate
     */
    invalidateByTags(tags) {
        const keysToDelete = [];
        
        this.cacheMetadata.forEach((metadata, key) => {
            if (metadata.tags.some(tag => tags.includes(tag))) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Invalidate cache by URL pattern
     * @public
     * @param {string|RegExp} pattern - URL pattern
     */
    invalidateByPattern(pattern) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const keysToDelete = [];

        this.cacheMetadata.forEach((metadata, key) => {
            if (regex.test(metadata.url)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
    }

    invalidateNamespace(namespace) {
        if (!namespace) {
            return;
        }

        const keysToDelete = [];

        this.cacheMetadata.forEach((metadata, key) => {
            if (metadata.namespace === namespace) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Clear all cache
     * @public
     */
    clear() {
        this.cache.clear();
        this.cacheMetadata.clear();
        this.saveToStorage();
    }

    /**
     * Evict oldest cache entry
     * @private
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        this.cacheMetadata.forEach((metadata, key) => {
            if (metadata.createdAt < oldestTime) {
                oldestTime = metadata.createdAt;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    /**
     * Start cleanup timer
     * @private
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Cleanup every minute
    }

    /**
     * Cleanup expired entries
     * @private
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        this.cacheMetadata.forEach((metadata, key) => {
            if (now > metadata.expiresAt) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Save to storage
     * @private
     */
    saveToStorage() {
        try {
            const data = {
                cache: Array.from(this.cache.entries()),
                metadata: Array.from(this.cacheMetadata.entries())
            };
            localStorage.setItem('api-cache', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save cache to storage:', e);
        }
    }

    /**
     * Load from storage
     * @private
     */
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('api-cache') || 'null');
            if (data) {
                this.cache = new Map(data.cache);
                this.cacheMetadata = new Map(data.metadata);
                // Cleanup expired entries
                this.cleanup();
            }
        } catch (e) {
            console.warn('Failed to load cache from storage:', e);
        }
    }

    /**
     * Wrap fetch with caching
     * @public
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {Object} cacheOptions - Cache options
     * @returns {Promise<Response>} Fetch response
     */
    async cachedFetch(url, options = {}, cacheOptions = {}) {
        // Check cache first
        const cached = this.get(url, options);
        if (cached) {
            return new Response(JSON.stringify(cached), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Make request
        const response = await fetch(url, options);
        const data = await response.json();

        // Cache response
        if (response.ok && cacheOptions.enabled !== false) {
            this.set(url, options, data, cacheOptions);
        }

        return response;
    }

    namespace(namespaceName) {
        const self = this;
        const ns = namespaceName || 'default';

        return {
            cachedFetch(url, options = {}, cacheOptions = {}) {
                const tags = Array.isArray(cacheOptions.tags) ? cacheOptions.tags.slice() : [];
                const nsTag = `ns:${ns}`;
                if (!tags.includes(nsTag)) {
                    tags.push(nsTag);
                }

                const mergedOptions = Object.assign({}, cacheOptions, {
                    namespace: ns,
                    tags
                });

                return self.cachedFetch(url, options, mergedOptions);
            },

            invalidate() {
                self.invalidateNamespace(ns);
            },

            invalidateTags(tags) {
                const baseTags = Array.isArray(tags) ? tags.slice() : [];
                const nsTag = `ns:${ns}`;
                if (!baseTags.includes(nsTag)) {
                    baseTags.push(nsTag);
                }
                self.invalidateByTags(baseTags);
            },

            clear() {
                self.invalidateNamespace(ns);
            }
        };
    }

    logStats(type, key, url) {
        const stats = {
            type,
            key,
            url,
            hitCount: this.hitCount,
            missCount: this.missCount,
            timestamp: Date.now()
        };
        window.apiCacheSystemStats = window.apiCacheSystemStats || { events: [] };
        window.apiCacheSystemStats.events.push(stats);
        if (window.apiCacheSystemStats.events.length > 100) {
            window.apiCacheSystemStats.events.shift();
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track(type === 'hit' ? 'API CacheSystem Hit' : 'API CacheSystem Miss', {
                url,
                timestamp: stats.timestamp
            });
        }
    }
}

APICacheSystem.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`cache_system_${eventName}`, 1, data);
        }
    } catch (e) { /* Silent fail */ }
};

// Create global instance
window.APICacheSystem = APICacheSystem;
window.apiCache = new APICacheSystem();
window.apiCache.init();

