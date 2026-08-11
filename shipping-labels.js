/**
 * Shipping Labels
 * @class ShippingLabels
 * @description Generates and manages shipping labels for orders.
 */
class ShippingLabels {
    constructor() {
        this.labels = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_hi_pp_in_gl_ab_el_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_hi_pp_in_gl_ab_el_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Generate shipping label.
     * @param {string} orderId - Order identifier.
     * @param {object} shippingData - Shipping data.
     * @returns {object} Label information.
     */
    generateLabel(orderId, shippingData) {
        const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const label = {
            id: labelId,
            orderId,
            carrier: shippingData.carrier,
            trackingNumber: this.generateTrackingNumber(shippingData.carrier),
            labelUrl: shippingData.labelUrl,
            format: shippingData.format || 'pdf',
            createdAt: new Date()
        };

        this.labels.set(labelId, label);
        console.log(`Shipping label generated: ${labelId}`);
        return label;
    }

    /**
     * Generate tracking number.
     * @param {string} carrier - Shipping carrier.
     * @returns {string} Tracking number.
     */
    generateTrackingNumber(carrier) {
        const prefix = carrier.toUpperCase().substring(0, 3);
        return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    /**
     * Get label by order ID.
     * @param {string} orderId - Order identifier.
     * @returns {object} Label information.
     */
    getLabelByOrder(orderId) {
        for (const label of this.labels.values()) {
            if (label.orderId === orderId) {
                return label;
            }
        }
        return null;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.shippingLabels = new ShippingLabels();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingLabels;
}

