/**
 * API Rate Limiting (Enhanced v2)
 * Enhanced rate limiting for Agent 2
 */

class APIRateLimitingEnhancedV2 {
    constructor() {
        this.limits = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('rate_limiting_v2_initialized');
    }

    setLimit(identifier, limit, window) {
        this.limits.set(identifier, {
            limit,
            window, // in milliseconds
            requests: []
        });
    }

    checkLimit(identifier) {
        const limitConfig = this.limits.get(identifier);
        if (!limitConfig) return { allowed: true };

        const now = Date.now();
        const windowStart = now - limitConfig.window;
        
        // Remove old requests
        limitConfig.requests = limitConfig.requests.filter(
            time => time > windowStart
        );

        if (limitConfig.requests.length >= limitConfig.limit) {
            return {
                allowed: false,
                retryAfter: limitConfig.requests[0] + limitConfig.window - now
            };
        }

        limitConfig.requests.push(now);
        return { allowed: true };
    }

    getLimitStatus(identifier) {
        const limitConfig = this.limits.get(identifier);
        if (!limitConfig) return null;

        return {
            limit: limitConfig.limit,
            used: limitConfig.requests.length,
            remaining: limitConfig.limit - limitConfig.requests.length
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`rate_limiting_v2_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_rate_limiting_enhanced_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiRateLimitingEnhancedV2 = new APIRateLimitingEnhancedV2();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRateLimitingEnhancedV2;
}


