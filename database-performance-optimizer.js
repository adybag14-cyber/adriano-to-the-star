/**
 * Database Performance Optimizer
 * Optimize database queries, implement caching, reduce API calls
 */

class DatabasePerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.queryCache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.debounceTimers = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize performance optimizer
     */
    init() {
        // Setup cache cleanup
        this.setupCacheCleanup();
        
        // Setup request batching
        this.setupRequestBatching();
        
        this.isInitialized = true;
        this.trackEvent('db_perf_optimizer_initialized');
    }

    /**
     * Setup cache cleanup
     */
    setupCacheCleanup() {
        // Clean expired cache entries every 5 minutes
        setInterval(() => {
            this.cleanExpiredCache();
        }, 5 * 60 * 1000);
    }

    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (now > expiry) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }

    /**
     * Get cached data
     */
    getCached(key) {
        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            return null;
        }
        return this.cache.get(key) || null;
    }

    /**
     * Set cached data
     */
    setCached(key, value, ttl = 5 * 60 * 1000) {
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[db-perf-optimizer] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[db-perf-optimizer] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[db-perf-optimizer] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Cached fetch with automatic caching
     */
    async cachedFetch(url, options = {}, ttl = 5 * 60 * 1000) {
        try {
            const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;

            if (window.apiCache && typeof window.apiCache.namespace === 'function') {
                const nsHelper = window.apiCache.namespace('db-performance');
                const response = await nsHelper.cachedFetch(url, options, {
                    ttl,
                    tags: ['db-performance', cacheKey]
                });
                return await response.json();
            }

            const cached = this.getCached(cacheKey);
            if (cached) {
                return cached;
            }

            const data = await this.fetchJSON(url, options);
            this.setCached(cacheKey, data, ttl);
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    /**
     * Debounced function call
     */
    debounce(key, fn, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        const timer = setTimeout(() => {
            fn();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    /**
     * Setup request batching
     */
    setupRequestBatching() {
        // Process queue every 100ms
        setInterval(() => {
            if (this.requestQueue.length > 0 && !this.isProcessingQueue) {
                this.processRequestQueue();
            }
        }, 100);
    }

    /**
     * Add request to queue
     */
    addToQueue(request) {
        this.requestQueue.push(request);
    }

    /**
     * Process request queue
     */
    async processRequestQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        // Batch similar requests
        const batches = this.batchRequests(this.requestQueue);
        
        for (const batch of batches) {
            try {
                await this.processBatch(batch);
            } catch (error) {
                console.error('Batch processing error:', error);
            }
        }

        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Batch similar requests
     */
    batchRequests(requests) {
        const batches = new Map();

        for (const request of requests) {
            const key = `${request.type}:${request.endpoint}`;
            if (!batches.has(key)) {
                batches.set(key, []);
            }
            batches.get(key).push(request);
        }

        return Array.from(batches.values());
    }

    /**
     * Process batch
     */
    async processBatch(batch) {
        // In production, this would combine multiple requests into one
        // For now, process sequentially
        for (const request of batch) {
            try {
                const result = await this.executeRequest(request);
                if (request.resolve) {
                    request.resolve(result);
                }
            } catch (error) {
                if (request.reject) {
                    request.reject(error);
                }
            }
        }
    }

    /**
     * Execute request
     */
    async executeRequest(request) {
        // Execute the actual request
        return await this.fetchJSON(request.endpoint, request.options);
    }

    /**
     * Optimize database query
     */
    optimizeQuery(query, params = {}) {
        const cacheKey = `query:${query}:${JSON.stringify(params)}`;
        
        // Check query cache
        const cached = this.getCached(cacheKey);
        if (cached) {
            return Promise.resolve(cached);
        }

        // Execute query and cache result
        return this.executeQuery(query, params).then(result => {
            this.setCached(cacheKey, result, 2 * 60 * 1000); // 2 minute cache
            return result;
        });
    }

    /**
     * Execute query (placeholder)
     */
    async executeQuery(query, params) {
        // In production, this would execute the actual database query
        // For now, return mock
        return { data: [], count: 0 };
    }

    /**
     * Prefetch data
     */
    async prefetch(urls) {
        const promises = urls.map(url => 
            this.cachedFetch(url, {}, 10 * 60 * 1000) // 10 minute cache for prefetched data
        );

        return Promise.all(promises);
    }

    /**
     * Optimize planet data loading
     */
    optimizePlanetDataLoading(planets) {
        // Use virtual scrolling for large datasets
        if (planets.length > 1000) {
            return {
                useVirtualScrolling: true,
                chunkSize: 50,
                initialLoad: 100
            };
        }

        return {
            useVirtualScrolling: false,
            chunkSize: planets.length,
            initialLoad: planets.length
        };
    }

    /**
     * Get performance stats
     */
    getPerformanceStats() {
        return {
            cacheSize: this.cache.size,
            cacheHitRate: this.calculateCacheHitRate(),
            queueSize: this.requestQueue.length,
            activeDebounces: this.debounceTimers.size
        };
    }

    /**
     * Calculate cache hit rate
     */
    calculateCacheHitRate() {
        // In production, track hits/misses
        return 0.75; // Placeholder
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
        this.queryCache.clear();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_perf_optimizer_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.databasePerformanceOptimizer = new DatabasePerformanceOptimizer();
    
    // Make available globally
    window.getDatabasePerformanceOptimizer = () => window.databasePerformanceOptimizer;
}

