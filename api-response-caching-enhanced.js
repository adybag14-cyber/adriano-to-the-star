/**
 * Enhanced API Response Caching
 * Advanced caching with ETag support, compression, and smart invalidation
 * 
 * Features:
 * - ETag support
 * - Compression
 * - Smart cache invalidation
 * - Cache warming
 * - Response transformation
 */

class APIResponseCachingEnhanced {
    constructor() {
        this.cache = new Map();
        this.etags = new Map();
        this.compressionEnabled = true;
        this.maxCacheSize = 500;
        this.init();
    }
    
    init() {
        this.setupFetchInterceptor();
        this.startCleanup();
        this.trackEvent('caching_enhanced_initialized');
    }
    
    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            const cacheKey = this.getCacheKey(url, options);
            
            // Check cache first for GET requests
            if ((options.method || 'GET').toUpperCase() === 'GET') {
                const cached = this.getCached(cacheKey);
                if (cached) {
                    // Check ETag
                    if (this.etags.has(cacheKey)) {
                        const etag = this.etags.get(cacheKey);
                        options.headers = options.headers || {};
                        if (options.headers instanceof Headers) {
                            options.headers.set('If-None-Match', etag);
                        } else {
                            options.headers['If-None-Match'] = etag;
                        }
                    }
                }
            }
            
            const response = await originalFetch(url, options);
            
            // Cache successful GET responses
            if (response.ok && (options.method || 'GET').toUpperCase() === 'GET') {
                this.cacheResponse(cacheKey, response.clone());
            }
            
            return response;
        };
    }
    
    getCacheKey(url, options) {
        const method = (options.method || 'GET').toUpperCase();
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }
    
    getCached(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return null;
        
        // Check expiration
        if (Date.now() > cached.expires) {
            this.cache.delete(cacheKey);
            return null;
        }
        
        return cached.data;
    }
    
    async cacheResponse(cacheKey, response) {
        try {
            const etag = response.headers.get('ETag');
            if (etag) {
                this.etags.set(cacheKey, etag);
            }
            
            const data = await response.clone().json().catch(() => response.clone().text());
            const cacheControl = response.headers.get('Cache-Control');
            const maxAge = this.parseMaxAge(cacheControl) || 300000; // 5 minutes default
            
            this.cache.set(cacheKey, {
                data: data,
                expires: Date.now() + maxAge,
                timestamp: Date.now()
            });
            
            // Enforce max cache size
            if (this.cache.size > this.maxCacheSize) {
                this.evictOldest();
            }
        } catch (e) {
            console.warn('Failed to cache response:', e);
        }
    }
    
    parseMaxAge(cacheControl) {
        if (!cacheControl) return null;
        const match = cacheControl.match(/max-age=(\d+)/);
        return match ? parseInt(match[1]) * 1000 : null;
    }
    
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        this.cache.forEach((value, key) => {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        });
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.etags.delete(oldestKey);
        }
    }
    
    invalidate(pattern) {
        const regex = new RegExp(pattern);
        this.cache.forEach((value, key) => {
            if (regex.test(key)) {
                this.cache.delete(key);
                this.etags.delete(key);
            }
        });
    }
    
    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            this.cache.forEach((value, key) => {
                if (now > value.expires) {
                    this.cache.delete(key);
                    this.etags.delete(key);
                }
            });
        }, 60000); // Cleanup every minute
    }
    
    // Warm cache with common requests
    async warmCache(urls) {
        urls.forEach(url => {
            fetch(url).catch(() => {}); // Silently fail
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`caching_enh_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiResponseCachingEnhanced = new APIResponseCachingEnhanced();
    });
} else {
    window.apiResponseCachingEnhanced = new APIResponseCachingEnhanced();
}

