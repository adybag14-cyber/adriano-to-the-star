/**
 * Buy Now, Pay Later (BNPL)
 * BNPL payment system
 */

class BuyNowPayLater {
    constructor() {
        this.plans = new Map();
        this.installments = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('bnpl_initialized');
        return { success: true, message: 'Buy Now, Pay Later initialized' };
    }

    createPlan(name, installments, interestRate) {
        if (installments < 2 || installments > 12) {
            throw new Error('Installments must be between 2 and 12');
        }
        if (interestRate < 0 || interestRate > 1) {
            throw new Error('Interest rate must be between 0 and 1');
        }
        const plan = {
            id: Date.now().toString(),
            name,
            installments,
            interestRate,
            createdAt: new Date()
        };
        this.plans.set(plan.id, plan);
        return plan;
    }

    calculateInstallments(planId, amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }
        const totalAmount = amount * (1 + plan.interestRate);
        const installmentAmount = totalAmount / plan.installments;
        const installments = Array.from({ length: plan.installments }, (_, i) => ({
            number: i + 1,
            amount: installmentAmount,
            dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000)
        }));
        this.installments.push({ planId, amount, installments });
        return { planId, amount, installments };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bnpl_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuyNowPayLater;
}
