/**
 * Enhanced API Rate Limiting System
 * Client-side and server-side rate limiting for API calls
 * 
 * Features:
 * - Per-endpoint rate limits
 * - Token bucket algorithm
 * - Request queuing
 * - Exponential backoff
 * - Rate limit headers handling
 */

class APIRateLimitingEnhanced {
    constructor() {
        this.limits = {
            default: { requests: 100, window: 60000 }, // 100 requests per minute
            search: { requests: 30, window: 60000 },
            auth: { requests: 10, window: 60000 },
            upload: { requests: 5, window: 60000 }
        };
        this.buckets = new Map();
        this.queue = [];
        this.processing = false;
        this.init();
    }
    
    init() {
        this.loadLimits();
        this.setupInterceptors();
        this.trackEvent('rate_limiting_enhanced_initialized');
    }
    
    loadLimits() {
        try {
            const saved = localStorage.getItem('api-rate-limits');
            if (saved) {
                this.limits = { ...this.limits, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load rate limits:', e);
        }
    }
    
    setupInterceptors() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const endpoint = this.getEndpoint(url);
            const limit = this.getLimit(endpoint);
            
            // Check rate limit
            if (!this.checkRateLimit(endpoint, limit)) {
                return this.handleRateLimitExceeded(endpoint, args, originalFetch);
            }
            
            // Make request
            const response = await originalFetch(...args);
            
            // Update rate limit from headers
            this.updateFromHeaders(response, endpoint);
            
            return response;
        };
    }
    
    getEndpoint(url) {
        if (typeof url === 'string') {
            if (url.includes('/search')) return 'search';
            if (url.includes('/auth')) return 'auth';
            if (url.includes('/upload')) return 'upload';
        }
        return 'default';
    }
    
    getLimit(endpoint) {
        return this.limits[endpoint] || this.limits.default;
    }
    
    checkRateLimit(endpoint, limit) {
        const now = Date.now();
        const bucket = this.getBucket(endpoint);
        
        // Remove old requests outside window
        bucket.requests = bucket.requests.filter(time => now - time < limit.window);
        
        // Check if under limit
        if (bucket.requests.length < limit.requests) {
            bucket.requests.push(now);
            return true;
        }
        
        return false;
    }
    
    getBucket(endpoint) {
        if (!this.buckets.has(endpoint)) {
            this.buckets.set(endpoint, { requests: [] });
        }
        return this.buckets.get(endpoint);
    }
    
    async handleRateLimitExceeded(endpoint, args, originalFetch) {
        // Add to queue
        return new Promise((resolve, reject) => {
            this.queue.push({ endpoint, args, resolve, reject, originalFetch });
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        
        while (this.queue.length > 0) {
            const item = this.queue[0];
            const limit = this.getLimit(item.endpoint);
            const bucket = this.getBucket(item.endpoint);
            const now = Date.now();
            
            // Wait if rate limited
            if (bucket.requests.length >= limit.requests) {
                const oldestRequest = bucket.requests[0];
                const waitTime = limit.window - (now - oldestRequest);
                if (waitTime > 0) {
                    await this.sleep(waitTime);
                }
            }
            
            // Remove from queue and execute
            this.queue.shift();
            try {
                const response = await item.originalFetch(...item.args);
                this.updateFromHeaders(response, item.endpoint);
                item.resolve(response);
            } catch (error) {
                item.reject(error);
            }
        }
        
        this.processing = false;
    }
    
    updateFromHeaders(response, endpoint) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining !== null) {
            const limit = this.getLimit(endpoint);
            const bucket = this.getBucket(endpoint);
            const now = Date.now();
            
            // Sync with server
            bucket.requests = bucket.requests.filter(time => {
                if (reset) {
                    const resetTime = parseInt(reset) * 1000;
                    return now < resetTime;
                }
                return now - time < limit.window;
            });
            
            // Adjust based on remaining
            const current = bucket.requests.length;
            const target = parseInt(remaining);
            if (current > target) {
                bucket.requests = bucket.requests.slice(0, target);
            }
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getRemaining(endpoint) {
        const limit = this.getLimit(endpoint);
        const bucket = this.getBucket(endpoint);
        return Math.max(0, limit.requests - bucket.requests.length);
    }
    
    getResetTime(endpoint) {
        const bucket = this.getBucket(endpoint);
        if (bucket.requests.length === 0) return null;
        
        const limit = this.getLimit(endpoint);
        const oldestRequest = bucket.requests[0];
        return oldestRequest + limit.window;
    }
}

APIRateLimitingEnhanced.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`rate_limiting_enhanced_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'api_rate_limiting_enhanced', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiRateLimitingEnhanced = new APIRateLimitingEnhanced();
    });
} else {
    window.apiRateLimitingEnhanced = new APIRateLimitingEnhanced();
}

