/**
 * Throttling Pattern
 * Request throttling implementation
 */

class ThrottlingPattern {
    constructor() {
        this.throttlers = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_hr_ot_tl_in_gp_at_te_rn_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_hr_ot_tl_in_gp_at_te_rn_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createThrottler(throttlerId, throttlerData) {
        const throttler = {
            id: throttlerId,
            ...throttlerData,
            name: throttlerData.name || throttlerId,
            maxRequests: throttlerData.maxRequests || 100,
            windowMs: throttlerData.windowMs || 60000,
            requests: [],
            createdAt: new Date()
        };
        
        this.throttlers.set(throttlerId, throttler);
        console.log(`Throttler created: ${throttlerId}`);
        return throttler;
    }

    async throttle(throttlerId, requestId) {
        const throttler = this.throttlers.get(throttlerId);
        if (!throttler) {
            throw new Error('Throttler not found');
        }
        
        const now = Date.now();
        throttler.requests = throttler.requests.filter(
            time => now - time < throttler.windowMs
        );
        
        if (throttler.requests.length >= throttler.maxRequests) {
            throw new Error('Rate limit exceeded');
        }
        
        throttler.requests.push(now);
        
        const request = {
            id: requestId || `request_${Date.now()}`,
            throttlerId,
            timestamp: now,
            createdAt: new Date()
        };
        
        this.requests.set(request.id, request);
        
        return request;
    }

    getThrottler(throttlerId) {
        return this.throttlers.get(throttlerId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.throttlingPattern = new ThrottlingPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThrottlingPattern;
}

