/**
 * Low Stock Alerts
 * @class LowStockAlerts
 * @description Manages low stock alerts and notifications.
 */
class LowStockAlerts {
    constructor() {
        this.alerts = [];
        this.thresholds = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ow_st_oc_ka_le_rt_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ow_st_oc_ka_le_rt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Set low stock threshold.
     * @param {string} productId - Product identifier.
     * @param {number} threshold - Threshold value.
     */
    setThreshold(productId, threshold) {
        this.thresholds.set(productId, threshold);
        console.log(`Low stock threshold set for product ${productId}: ${threshold}`);
    }

    /**
     * Check stock and trigger alerts.
     * @param {string} productId - Product identifier.
     * @param {number} currentStock - Current stock level.
     */
    checkStock(productId, currentStock) {
        const threshold = this.thresholds.get(productId) || 10;
        
        if (currentStock <= threshold) {
            const alert = {
                productId,
                currentStock,
                threshold,
                severity: currentStock === 0 ? 'critical' : currentStock <= threshold * 0.5 ? 'high' : 'medium',
                timestamp: new Date()
            };

            this.alerts.push(alert);
            this.sendAlert(alert);
            console.warn(`Low stock alert for product ${productId}: ${currentStock} units`);
        }
    }

    /**
     * Send alert notification.
     * @param {object} alert - Alert object.
     */
    sendAlert(alert) {
        // Placeholder for actual notification logic
        console.log('Sending low stock alert:', alert);
    }

    /**
     * Get active alerts.
     * @returns {Array<object>} Active alerts.
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => {
            // Alerts are active for 24 hours
            const hoursSinceAlert = (Date.now() - alert.timestamp) / (1000 * 60 * 60);
            return hoursSinceAlert < 24;
        });
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.lowStockAlerts = new LowStockAlerts();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LowStockAlerts;
}

