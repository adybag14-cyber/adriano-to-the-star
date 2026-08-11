/**
 * Payment Plans
 * @class PaymentPlans
 * @description Manages payment plans with installments and flexible payment options.
 */
class PaymentPlans {
    constructor() {
        this.plans = new Map();
        this.installments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ay_me_nt_pl_an_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ay_me_nt_pl_an_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a payment plan.
     * @param {string} planId - Plan identifier.
     * @param {object} planData - Plan data.
     */
    createPlan(planId, planData) {
        this.plans.set(planId, {
            ...planData,
            id: planId,
            totalAmount: planData.totalAmount,
            numberOfInstallments: planData.numberOfInstallments || 1,
            installmentAmount: planData.totalAmount / (planData.numberOfInstallments || 1),
            status: 'active',
            createdAt: new Date()
        });
        console.log(`Payment plan created: ${planId}`);
    }

    /**
     * Create installment plan for order.
     * @param {string} orderId - Order identifier.
     * @param {string} planId - Plan identifier.
     * @returns {object} Installment plan.
     */
    createInstallmentPlan(orderId, planId) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Payment plan not found: ${planId}`);
        }

        const installmentPlan = {
            orderId,
            planId,
            totalAmount: plan.totalAmount,
            installments: [],
            currentInstallment: 0,
            status: 'active',
            createdAt: new Date()
        };

        // Generate installments
        for (let i = 0; i < plan.numberOfInstallments; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            
            installmentPlan.installments.push({
                number: i + 1,
                amount: plan.installmentAmount,
                dueDate,
                status: 'pending',
                paidAt: null
            });
        }

        this.installments.set(orderId, installmentPlan);
        return installmentPlan;
    }

    /**
     * Process installment payment.
     * @param {string} orderId - Order identifier.
     * @param {number} installmentNumber - Installment number.
     * @returns {object} Payment result.
     */
    processInstallment(orderId, installmentNumber) {
        const plan = this.installments.get(orderId);
        if (!plan) {
            throw new Error(`Installment plan not found for order: ${orderId}`);
        }

        const installment = plan.installments.find(inst => inst.number === installmentNumber);
        if (!installment) {
            throw new Error(`Installment not found: ${installmentNumber}`);
        }

        installment.status = 'paid';
        installment.paidAt = new Date();
        plan.currentInstallment = installmentNumber;

        // Check if all installments are paid
        if (plan.installments.every(inst => inst.status === 'paid')) {
            plan.status = 'completed';
        }

        console.log(`Installment ${installmentNumber} processed for order ${orderId}`);
        return { success: true };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.paymentPlans = new PaymentPlans();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentPlans;
}

