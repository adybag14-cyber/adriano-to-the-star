/**
 * Referrer Policy
 * Referrer-Policy header implementation
 */

class ReferrerPolicy {
    constructor() {
        this.policies = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Referrer Policy initialized' };
    }

    setPolicy(resource, policy) {
        const validPolicies = ['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url'];
        if (!validPolicies.includes(policy)) {
            throw new Error('Invalid referrer policy');
        }
        const policyObj = {
            id: Date.now().toString(),
            resource,
            policy,
            setAt: new Date()
        };
        this.policies.set(policyObj.id, policyObj);
        return policyObj;
    }

    generateHeader(policyId) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error('Policy not found');
        }
        return `Referrer-Policy: ${policy.policy}`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferrerPolicy;
}

