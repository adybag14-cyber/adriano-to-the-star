/**
 * API Timeout Advanced
 * Advanced API timeout system
 */

class APITimeoutAdvanced {
    constructor() {
        this.timeouts = new Map();
        this.policies = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_timeout_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_timeout_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            timeout: policyData.timeout || 5000,
            action: policyData.action || 'cancel',
            status: 'active',
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        return policy;
    }

    async execute(policyId, request, operation) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error(`Policy ${policyId} not found`);
        }

        const req = {
            id: `req_${Date.now()}`,
            policyId,
            request,
            status: 'executing',
            createdAt: new Date()
        };

        this.requests.set(req.id, req);

        try {
            const result = await Promise.race([
                this.executeOperation(operation),
                this.createTimeout(policy.timeout)
            ]);

            req.status = 'completed';
            req.completedAt = new Date();
            return {
                policyId,
                request,
                success: true,
                result,
                timestamp: new Date()
            };
        } catch (error) {
            req.status = 'timeout';
            req.completedAt = new Date();
            return {
                policyId,
                request,
                success: false,
                error: 'timeout',
                timestamp: new Date()
            };
        }
    }

    async executeOperation(operation) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { result: 'success' };
    }

    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), ms);
        });
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    getAllPolicies() {
        return Array.from(this.policies.values());
    }
}

module.exports = APITimeoutAdvanced;

