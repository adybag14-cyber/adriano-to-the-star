/**
 * API Rate Limiting Advanced
 * Advanced API rate limiting system
 */

class APIRateLimitingAdvanced {
    constructor() {
        this.limiters = new Map();
        this.policies = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_rate_limiting_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_rate_limiting_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            limit: policyData.limit || 100,
            window: policyData.window || 60,
            unit: policyData.unit || 'seconds',
            status: 'active',
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        return policy;
    }

    async check(policyId, requestId) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error(`Policy ${policyId} not found`);
        }

        const request = {
            id: requestId,
            policyId,
            timestamp: new Date()
        };

        const allowed = this.evaluateLimit(policy, request);
        this.requests.set(requestId, request);
        
        return {
            requestId,
            policyId,
            allowed,
            remaining: allowed ? policy.limit - this.getRequestCount(policy) : 0,
            timestamp: new Date()
        };
    }

    evaluateLimit(policy, request) {
        const count = this.getRequestCount(policy);
        return count < policy.limit;
    }

    getRequestCount(policy) {
        const windowMs = policy.unit === 'seconds' ? policy.window * 1000 : policy.window * 60 * 1000;
        const cutoff = Date.now() - windowMs;
        return Array.from(this.requests.values())
            .filter(r => r.policyId === policy.id && r.timestamp.getTime() > cutoff).length;
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    getAllPolicies() {
        return Array.from(this.policies.values());
    }
}

module.exports = APIRateLimitingAdvanced;
