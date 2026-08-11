/**
 * Low Stock Alerts System
 * @class LowStockAlertsSystem
 * @description Monitors inventory and sends alerts when stock is low.
 */
class LowStockAlertsSystem {
    constructor() {
        this.thresholds = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ow_st_oc_ka_le_rt_ss_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ow_st_oc_ka_le_rt_ss_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Set low stock threshold.
     * @param {string} productId - Product identifier.
     * @param {number} threshold - Threshold quantity.
     */
    setThreshold(productId, threshold) {
        this.thresholds.set(productId, {
            productId,
            threshold,
            updatedAt: new Date()
        });
        console.log(`Low stock threshold set: ${productId} = ${threshold}`);
    }

    /**
     * Check stock levels.
     * @param {string} productId - Product identifier.
     * @param {number} currentStock - Current stock level.
     */
    checkStock(productId, currentStock) {
        const threshold = this.thresholds.get(productId);
        if (!threshold) return;

        if (currentStock <= threshold.threshold) {
            this.triggerAlert(productId, currentStock, threshold.threshold);
        }
    }

    /**
     * Trigger alert.
     * @param {string} productId - Product identifier.
     * @param {number} currentStock - Current stock.
     * @param {number} threshold - Threshold value.
     */
    triggerAlert(productId, currentStock, threshold) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.alerts.set(alertId, {
            id: alertId,
            productId,
            currentStock,
            threshold,
            severity: currentStock === 0 ? 'critical' : currentStock <= threshold * 0.5 ? 'high' : 'medium',
            triggeredAt: new Date(),
            acknowledged: false
        });
        console.log(`Low stock alert triggered: ${productId} (${currentStock} <= ${threshold})`);
    }

    /**
     * Get active alerts.
     * @returns {Array<object>} Active alerts.
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.acknowledged)
            .sort((a, b) => {
                const severityOrder = { critical: 3, high: 2, medium: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.lowStockAlertsSystem = new LowStockAlertsSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LowStockAlertsSystem;
}

