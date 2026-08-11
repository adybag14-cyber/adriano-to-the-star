/**
 * API Request Throttling
 * Throttle API requests to prevent overload
 */

class APIRequestThrottling {
    constructor() {
        this.throttles = new Map();
        this.init();
    }

    init() {
        this.trackEvent('throttling_initialized');
    }

    createThrottle(throttleId, maxRequests, timeWindow) {
        const throttle = {
            id: throttleId,
            maxRequests,
            timeWindow, // milliseconds
            requests: [],
            stats: {
                totalRequests: 0,
                throttled: 0
            },
            createdAt: new Date()
        };
        
        this.throttles.set(throttleId, throttle);
        console.log(`Throttle created: ${throttleId}`);
        return throttle;
    }

    throttle(throttleId) {
        const throttle = this.throttles.get(throttleId);
        if (!throttle) {
            throw new Error('Throttle does not exist');
        }
        
        const now = Date.now();
        const cutoff = now - throttle.timeWindow;
        
        // Remove old requests
        throttle.requests = throttle.requests.filter(timestamp => timestamp > cutoff);
        
        throttle.stats.totalRequests++;
        
        if (throttle.requests.length >= throttle.maxRequests) {
            throttle.stats.throttled++;
            const oldestRequest = throttle.requests[0];
            const waitTime = throttle.timeWindow - (now - oldestRequest);
            
            console.log(`Request throttled: ${throttleId}, wait time: ${waitTime}ms`);
            return {
                throttled: true,
                waitTime: Math.max(0, waitTime),
                retryAfter: Math.ceil(waitTime / 1000)
            };
        }
        
        throttle.requests.push(now);
        console.log(`Request allowed: ${throttleId}, count: ${throttle.requests.length}/${throttle.maxRequests}`);
        return {
            throttled: false,
            waitTime: 0,
            retryAfter: 0
        };
    }

    getThrottleStats(throttleId) {
        const throttle = this.throttles.get(throttleId);
        if (!throttle) {
            throw new Error('Throttle does not exist');
        }
        
        const now = Date.now();
        const cutoff = now - throttle.timeWindow;
        throttle.requests = throttle.requests.filter(timestamp => timestamp > cutoff);
        
        const throttleRate = throttle.stats.totalRequests > 0
            ? (throttle.stats.throttled / throttle.stats.totalRequests) * 100
            : 0;
        
        return {
            id: throttle.id,
            maxRequests: throttle.maxRequests,
            current: throttle.requests.length,
            timeWindow: throttle.timeWindow,
            throttleRate: throttleRate.toFixed(2) + '%',
            stats: throttle.stats
        };
    }

    getThrottle(throttleId) {
        return this.throttles.get(throttleId);
    }

    getAllThrottles() {
        return Array.from(this.throttles.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`throttling_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestThrottling = new APIRequestThrottling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestThrottling;
}

