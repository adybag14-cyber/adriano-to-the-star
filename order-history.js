/**
 * Order History
 * @class OrderHistory
 * @description Manages order history with search and filtering.
 */
class OrderHistory {
    constructor() {
        this.orders = new Map();
        this.init();
    }

    init() {
        this.trackEvent('o_rd_er_hi_st_or_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("o_rd_er_hi_st_or_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add order to history.
     * @param {string} orderId - Order identifier.
     * @param {object} orderData - Order data.
     */
    addOrder(orderId, orderData) {
        this.orders.set(orderId, {
            ...orderData,
            id: orderId,
            userId: orderData.userId,
            items: orderData.items || [],
            total: orderData.total,
            status: orderData.status,
            createdAt: orderData.createdAt || new Date()
        });
        console.log(`Order added to history: ${orderId}`);
    }

    /**
     * Get user order history.
     * @param {string} userId - User identifier.
     * @param {object} filters - Filter options.
     * @returns {Array<object>} Order history.
     */
    getUserHistory(userId, filters = {}) {
        let orders = Array.from(this.orders.values())
            .filter(order => order.userId === userId);

        if (filters.status) {
            orders = orders.filter(order => order.status === filters.status);
        }

        if (filters.startDate) {
            orders = orders.filter(order => order.createdAt >= filters.startDate);
        }

        if (filters.endDate) {
            orders = orders.filter(order => order.createdAt <= filters.endDate);
        }

        return orders.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Get order by ID.
     * @param {string} orderId - Order identifier.
     * @returns {object} Order data.
     */
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.orderHistory = new OrderHistory();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderHistory;
}

