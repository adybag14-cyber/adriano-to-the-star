/**
 * API Request Deduplication
 * Prevent duplicate API requests
 */

class APIRequestDeduplication {
    constructor() {
        this.pendingRequests = new Map();
        this.requestCache = new Map();
        this.deduplicationWindow = 5000; // 5 seconds
        this.init();
    }

    init() {
        this.trackEvent('deduplication_initialized');
    }

    async executeDeduplicated(requestKey, fn) {
        // Check if request is already pending
        if (this.pendingRequests.has(requestKey)) {
            console.log(`Deduplicating request: ${requestKey}`);
            return this.pendingRequests.get(requestKey);
        }
        
        // Check cache
        const cached = this.requestCache.get(requestKey);
        if (cached && !this.isExpired(cached)) {
            console.log(`Returning cached result for: ${requestKey}`);
            return cached.result;
        }
        
        // Execute request
        const promise = fn();
        this.pendingRequests.set(requestKey, promise);
        
        try {
            const result = await promise;
            
            // Cache result
            this.requestCache.set(requestKey, {
                result,
                cachedAt: new Date(),
                expiresAt: new Date(Date.now() + this.deduplicationWindow)
            });
            
            return result;
        } finally {
            // Remove from pending after a delay
            setTimeout(() => {
                this.pendingRequests.delete(requestKey);
            }, this.deduplicationWindow);
        }
    }

    isExpired(cached) {
        return new Date() > cached.expiresAt;
    }

    generateRequestKey(method, url, params, body) {
        const key = `${method}_${url}_${JSON.stringify(params)}_${JSON.stringify(body)}`;
        return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.requestCache.keys()) {
                if (key.includes(pattern)) {
                    this.requestCache.delete(key);
                }
            }
            console.log(`Cache cleared for pattern: ${pattern}`);
        } else {
            this.requestCache.clear();
            console.log('All cache cleared');
        }
    }

    getDeduplicationStats() {
        return {
            pendingRequests: this.pendingRequests.size,
            cachedRequests: this.requestCache.size
        };
    }

    setDeduplicationWindow(window) {
        this.deduplicationWindow = window;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dedup_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestDeduplication = new APIRequestDeduplication();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestDeduplication;
}

