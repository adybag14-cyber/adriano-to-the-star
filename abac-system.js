/**
 * ABAC System
 * Attribute-Based Access Control system
 */

class ABACSystem {
    constructor() {
        this.policies = new Map();
        this.attributes = new Map();
        this.subjects = new Map();
        this.init();
    }

    init() {
        this.trackEvent('abac_initialized');
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
        this.trackEvent('policy_created', { policyId, name: policyData.name, ruleCount: policyData.rules?.length || 0 });
        return policy;
    }

    registerSubject(subjectId, subjectData) {
        const subject = {
            id: subjectId,
            ...subjectData,
            name: subjectData.name || subjectId,
            attributes: subjectData.attributes || {},
            createdAt: new Date()
        };
        
        this.subjects.set(subjectId, subject);
        this.trackEvent('subject_registered', { subjectId, name: subjectData.name });
        return subject;
    }

    async evaluate(subjectId, resourceId, action) {
        const subject = this.subjects.get(subjectId);
        if (!subject) {
            throw new Error('Subject not found');
        }
        
        const policies = Array.from(this.policies.values())
            .filter(p => p.enabled);
        
        for (const policy of policies) {
            const allowed = this.checkPolicy(policy, subject, resourceId, action);
            if (allowed !== null) {
                return { allowed, policyId: policy.id };
            }
        }
        
        this.trackEvent('access_denied', { subjectId, resourceId, action, reason: 'no_matching_policy' });
        return { allowed: false };
    }

    checkPolicy(policy, subject, resourceId, action) {
        for (const rule of policy.rules) {
            if (this.matchesRule(rule, subject, resourceId, action)) {
                return rule.effect === 'allow';
            }
        }
        return null;
    }

    matchesRule(rule, subject, resourceId, action) {
        if (rule.action && rule.action !== action) {
            return false;
        }
        
        if (rule.conditions) {
            return rule.conditions.every(condition => {
                const value = subject.attributes[condition.attribute];
                return this.evaluateCondition(value, condition);
            });
        }
        
        return true;
    }

    evaluateCondition(value, condition) {
        if (condition.operator === 'equals') {
            return value === condition.value;
        } else if (condition.operator === 'contains') {
            return value && value.includes(condition.value);
        }
        return false;
    }

    getSubject(subjectId) {
        return this.subjects.get(subjectId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`abac_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'abac_system', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.abacSystem = new ABACSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABACSystem;
}

