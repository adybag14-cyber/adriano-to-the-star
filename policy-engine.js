/**
 * Policy Engine
 * Policy evaluation engine
 */

class PolicyEngine {
    constructor() {
        this.policies = new Map();
        this.rules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ol_ic_ye_ng_in_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ol_ic_ye_ng_in_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            rules: policyData.rules || [],
            enabled: policyData.enabled !== false,
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        console.log(`Policy created: ${policyId}`);
        return policy;
    }

    createRule(ruleId, ruleData) {
        const rule = {
            id: ruleId,
            ...ruleData,
            name: ruleData.name || ruleId,
            condition: ruleData.condition || {},
            effect: ruleData.effect || 'deny',
            createdAt: new Date()
        };
        
        this.rules.set(ruleId, rule);
        console.log(`Rule created: ${ruleId}`);
        return rule;
    }

    async evaluate(policyId, context) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error('Policy not found');
        }
        
        if (!policy.enabled) {
            return { allowed: false, reason: 'Policy is disabled' };
        }
        
        for (const ruleId of policy.rules) {
            const rule = this.rules.get(ruleId);
            if (rule && this.matchesCondition(rule.condition, context)) {
                return {
                    allowed: rule.effect === 'allow',
                    ruleId: rule.id,
                    reason: rule.name
                };
            }
        }
        
        return { allowed: false, reason: 'No matching rule' };
    }

    matchesCondition(condition, context) {
        if (!condition) {
            return true;
        }
        
        return Object.keys(condition).every(key => {
            return context[key] === condition[key];
        });
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.policyEngine = new PolicyEngine();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolicyEngine;
}

