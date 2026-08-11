/**
 * API Retry Advanced
 * Advanced API retry system
 */

class APIRetryAdvanced {
    constructor() {
        this.retries = new Map();
        this.policies = new Map();
        this.attempts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_retry_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_retry_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            maxAttempts: policyData.maxAttempts || 3,
            backoff: policyData.backoff || 'exponential',
            status: 'active',
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        return policy;
    }

    async retry(policyId, request, operation) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error(`Policy ${policyId} not found`);
        }

        let attempt = 0;
        let lastError = null;

        while (attempt < policy.maxAttempts) {
            attempt++;
            try {
                const result = await this.executeOperation(operation);
                return {
                    policyId,
                    request,
                    attempt,
                    success: true,
                    result,
                    timestamp: new Date()
                };
            } catch (error) {
                lastError = error;
                if (attempt < policy.maxAttempts) {
                    await this.wait(attempt, policy);
                }
            }
        }

        return {
            policyId,
            request,
            attempt,
            success: false,
            error: lastError,
            timestamp: new Date()
        };
    }

    async executeOperation(operation) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (Math.random() > 0.3) {
            return { result: 'success' };
        }
        throw new Error('Operation failed');
    }

    async wait(attempt, policy) {
        let delay = 1000;
        if (policy.backoff === 'exponential') {
            delay = Math.pow(2, attempt) * 1000;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    getAllPolicies() {
        return Array.from(this.policies.values());
    }
}

module.exports = APIRetryAdvanced;

