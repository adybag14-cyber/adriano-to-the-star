/**
 * Rate Limiting Pattern
 * Rate limiting implementation
 */

class RateLimitingPattern {
    constructor() {
        this.limiters = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_at_el_im_it_in_gp_at_te_rn_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_at_el_im_it_in_gp_at_te_rn_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createLimiter(limiterId, limiterData) {
        const limiter = {
            id: limiterId,
            ...limiterData,
            name: limiterData.name || limiterId,
            limit: limiterData.limit || 100,
            windowMs: limiterData.windowMs || 60000,
            requests: [],
            createdAt: new Date()
        };
        
        this.limiters.set(limiterId, limiter);
        console.log(`Rate limiter created: ${limiterId}`);
        return limiter;
    }

    async checkLimit(limiterId, identifier) {
        const limiter = this.limiters.get(limiterId);
        if (!limiter) {
            throw new Error('Limiter not found');
        }
        
        const now = Date.now();
        const windowStart = now - limiter.windowMs;
        
        limiter.requests = limiter.requests.filter(
            req => req.timestamp > windowStart
        );
        
        const count = limiter.requests.filter(
            req => req.identifier === identifier
        ).length;
        
        if (count >= limiter.limit) {
            throw new Error('Rate limit exceeded');
        }
        
        const request = {
            id: `request_${Date.now()}`,
            limiterId,
            identifier,
            timestamp: now,
            createdAt: new Date()
        };
        
        this.requests.set(request.id, request);
        limiter.requests.push(request);
        
        return {
            allowed: true,
            remaining: limiter.limit - count - 1
        };
    }

    getLimiter(limiterId) {
        return this.limiters.get(limiterId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.rateLimitingPattern = new RateLimitingPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimitingPattern;
}

