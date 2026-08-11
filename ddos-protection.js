/**
 * DDoS Protection
 * DDoS protection system
 */

class DDoSProtection {
    constructor() {
        this.rateLimits = new Map();
        this.blocked = new Set();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'DDoS Protection initialized' };
    }

    setRateLimit(identifier, maxRequests, windowMs) {
        const limit = {
            id: Date.now().toString(),
            identifier,
            maxRequests,
            windowMs,
            requests: [],
            setAt: new Date()
        };
        this.rateLimits.set(identifier, limit);
        return limit;
    }

    checkRateLimit(identifier) {
        const limit = this.rateLimits.get(identifier);
        if (!limit) {
            return { allowed: true };
        }
        const now = Date.now();
        limit.requests = limit.requests.filter(time => now - time < limit.windowMs);
        if (limit.requests.length >= limit.maxRequests) {
            this.blocked.add(identifier);
            return { allowed: false, reason: 'Rate limit exceeded' };
        }
        limit.requests.push(now);
        return { allowed: true };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DDoSProtection;
}

