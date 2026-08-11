/**
 * Commission System v2
 * Advanced commission system
 */

class CommissionSystemV2 {
    constructor() {
        this.commissions = new Map();
        this.rules = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('commission_v2_initialized');
        return { success: true, message: 'Commission System v2 initialized' };
    }

    createRule(name, rate, type) {
        if (rate < 0 || rate > 1) {
            throw new Error('Commission rate must be between 0 and 1');
        }
        const rule = {
            id: Date.now().toString(),
            name,
            rate,
            type: type || 'percentage',
            createdAt: new Date(),
            active: true
        };
        this.rules.set(rule.id, rule);
        return rule;
    }

    calculateCommission(orderId, amount, ruleId) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.active) {
            throw new Error('Rule not found or inactive');
        }
        const commission = amount * rule.rate;
        const commissionRecord = {
            id: Date.now().toString(),
            orderId,
            amount,
            ruleId,
            commission,
            calculatedAt: new Date()
        };
        this.commissions.set(commissionRecord.id, commissionRecord);
        return commissionRecord;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`commission_v2_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommissionSystemV2;
}

