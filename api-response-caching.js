/**
 * API Response Caching
 * Caches API responses to reduce server load and improve performance
 */

class APIResponseCaching {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 300; // 5 minutes
        this.init();
    }
    
    init() {
        this.interceptFetch();
        this.trackEvent('caching_initialized');
    }
    
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            // Check cache first
            if (options.method === 'GET' || !options.method) {
                const cached = await self.getCached(url);
                if (cached) {
                    return new Response(JSON.stringify(cached.data), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Execute request
            const response = await originalFetch(url, options);
            
            // Cache response if GET request
            if (options.method === 'GET' || !options.method) {
                const data = await response.clone().json().catch(() => null);
                if (data) {
                    await self.cacheResponse(url, data);
                }
            }
            
            return response;
        };
    }
    
    async getCached(url) {
        const entry = this.cache.get(url);
        
        if (!entry) {
            return null;
        }
        
        // Check if expired
        if (entry.expires && Date.now() > entry.expires) {
            this.cache.delete(url);
            return null;
        }
        
        return entry;
    }
    
    async cacheResponse(url, data, ttl = this.defaultTTL) {
        this.cache.set(url, {
            data,
            expires: Date.now() + (ttl * 1000),
            cachedAt: Date.now()
        });
    }
    
    invalidateCache(url) {
        this.cache.delete(url);
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`caching_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.apiResponseCaching = new APIResponseCaching(); });
} else {
    window.apiResponseCaching = new APIResponseCaching();
}
