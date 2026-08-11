/**
 * Installment Payments
 * @class InstallmentPayments
 * @description Manages installment payment processing and schedules.
 */
class InstallmentPayments {
    constructor() {
        this.installments = new Map();
        this.schedules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ns_ta_ll_me_nt_pa_ym_en_ts_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ns_ta_ll_me_nt_pa_ym_en_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create installment schedule.
     * @param {string} orderId - Order identifier.
     * @param {object} scheduleData - Schedule data.
     */
    createSchedule(orderId, scheduleData) {
        const schedule = {
            orderId,
            totalAmount: scheduleData.totalAmount,
            numberOfInstallments: scheduleData.numberOfInstallments,
            installmentAmount: scheduleData.totalAmount / scheduleData.numberOfInstallments,
            frequency: scheduleData.frequency || 'monthly',
            installments: [],
            status: 'active',
            createdAt: new Date()
        };

        // Generate installments
        for (let i = 0; i < schedule.numberOfInstallments; i++) {
            const dueDate = new Date();
            if (schedule.frequency === 'monthly') {
                dueDate.setMonth(dueDate.getMonth() + i);
            } else if (schedule.frequency === 'weekly') {
                dueDate.setDate(dueDate.getDate() + (i * 7));
            }

            schedule.installments.push({
                number: i + 1,
                amount: schedule.installmentAmount,
                dueDate,
                status: 'pending',
                paidAt: null
            });
        }

        this.schedules.set(orderId, schedule);
        console.log(`Installment schedule created for order ${orderId}`);
    }

    /**
     * Process installment payment.
     * @param {string} orderId - Order identifier.
     * @param {number} installmentNumber - Installment number.
     */
    processInstallment(orderId, installmentNumber) {
        const schedule = this.schedules.get(orderId);
        if (!schedule) {
            throw new Error(`Schedule not found for order: ${orderId}`);
        }

        const installment = schedule.installments.find(inst => inst.number === installmentNumber);
        if (installment) {
            installment.status = 'paid';
            installment.paidAt = new Date();
            console.log(`Installment ${installmentNumber} processed for order ${orderId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.installmentPayments = new InstallmentPayments();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InstallmentPayments;
}

