/**
 * Order Status Updates
 * @class OrderStatusUpdates
 * @description Manages order status updates and notifications.
 */
class OrderStatusUpdates {
    constructor() {
        this.statuses = new Map();
        this.history = new Map();
        this.init();
    }

    init() {
        this.trackEvent('o_rd_er_st_at_us_up_da_te_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("o_rd_er_st_at_us_up_da_te_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Update order status.
     * @param {string} orderId - Order identifier.
     * @param {string} status - New status.
     * @param {object} updateData - Additional update data.
     */
    updateStatus(orderId, status, updateData = {}) {
        const statusUpdate = {
            orderId,
            status,
            ...updateData,
            updatedAt: new Date()
        };

        this.statuses.set(orderId, statusUpdate);

        // Add to history
        if (!this.history.has(orderId)) {
            this.history.set(orderId, []);
        }
        this.history.get(orderId).push(statusUpdate);

        console.log(`Order status updated: ${orderId} -> ${status}`);
    }

    /**
     * Get status history.
     * @param {string} orderId - Order identifier.
     * @returns {Array<object>} Status history.
     */
    getStatusHistory(orderId) {
        return this.history.get(orderId) || [];
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.orderStatusUpdates = new OrderStatusUpdates();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderStatusUpdates;
}

