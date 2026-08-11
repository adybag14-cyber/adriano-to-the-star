/**
 * API Throttling Advanced
 * Advanced API throttling system
 */

class APIThrottlingAdvanced {
    constructor() {
        this.throttlers = new Map();
        this.policies = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_throttling_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_throttling_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            rate: policyData.rate || 10,
            burst: policyData.burst || 20,
            status: 'active',
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        return policy;
    }

    async throttle(policyId, requestId) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error(`Policy ${policyId} not found`);
        }

        const request = {
            id: requestId,
            policyId,
            timestamp: new Date()
        };

        const throttled = this.evaluateThrottle(policy, request);
        this.requests.set(requestId, request);
        
        return {
            requestId,
            policyId,
            throttled,
            delay: throttled ? this.computeDelay(policy) : 0,
            timestamp: new Date()
        };
    }

    evaluateThrottle(policy, request) {
        const recentCount = this.getRecentRequestCount(policy);
        return recentCount >= policy.rate;
    }

    getRecentRequestCount(policy) {
        const windowMs = 1000;
        const cutoff = Date.now() - windowMs;
        return Array.from(this.requests.values())
            .filter(r => r.policyId === policy.id && r.timestamp.getTime() > cutoff).length;
    }

    computeDelay(policy) {
        return Math.random() * 1000 + 500;
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    getAllPolicies() {
        return Array.from(this.policies.values());
    }
}

module.exports = APIThrottlingAdvanced;

