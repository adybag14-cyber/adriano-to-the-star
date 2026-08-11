/**
 * Auto-Scaling Policies
 * Auto-scaling policy management
 */

class AutoScalingPolicies {
    constructor() {
        this.policies = new Map();
        this.actions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('autoscale_policies_initialized');
    }

    createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            metric: policyData.metric || 'cpu',
            threshold: policyData.threshold || 80,
            scaleUpThreshold: policyData.scaleUpThreshold || 80,
            scaleDownThreshold: policyData.scaleDownThreshold || 30,
            minInstances: policyData.minInstances || 1,
            maxInstances: policyData.maxInstances || 10,
            scaleUpStep: policyData.scaleUpStep || 1,
            scaleDownStep: policyData.scaleDownStep || 1,
            cooldown: policyData.cooldown || 300,
            enabled: policyData.enabled !== false,
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        console.log(`Auto-scaling policy created: ${policyId}`);
        return policy;
    }

    evaluatePolicy(policyId, currentMetric, currentInstances) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error('Policy not found');
        }
        
        if (!policy.enabled) {
            return { action: 'none', reason: 'policy_disabled' };
        }
        
        let action = 'none';
        let targetInstances = currentInstances;
        
        if (currentMetric >= policy.scaleUpThreshold && 
            currentInstances < policy.maxInstances) {
            action = 'scale_up';
            targetInstances = Math.min(
                currentInstances + policy.scaleUpStep,
                policy.maxInstances
            );
        } else if (currentMetric <= policy.scaleDownThreshold && 
                   currentInstances > policy.minInstances) {
            action = 'scale_down';
            targetInstances = Math.max(
                currentInstances - policy.scaleDownStep,
                policy.minInstances
            );
        }
        
        if (action !== 'none') {
            const scalingAction = {
                id: `action_${Date.now()}`,
                policyId,
                action,
                currentInstances,
                targetInstances,
                metric: currentMetric,
                timestamp: new Date(),
                createdAt: new Date()
            };
            
            this.actions.set(scalingAction.id, scalingAction);
        }
        
        return { action, targetInstances, currentInstances };
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    getActions(policyId = null) {
        if (policyId) {
            return Array.from(this.actions.values())
                .filter(a => a.policyId === policyId);
        }
        return Array.from(this.actions.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`autoscale_pol_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.autoScalingPolicies = new AutoScalingPolicies();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoScalingPolicies;
}


