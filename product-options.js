/**
 * Product Options
 * @class ProductOptions
 * @description Manages product options and customizations.
 */
class ProductOptions {
    constructor() {
        this.options = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_op_ti_on_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_op_ti_on_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add option to product.
     * @param {string} productId - Product identifier.
     * @param {object} optionData - Option data.
     */
    addOption(productId, optionData) {
        if (!this.options.has(productId)) {
            this.options.set(productId, []);
        }

        this.options.get(productId).push({
            ...optionData,
            id: optionData.id || `opt_${Date.now()}`,
            name: optionData.name,
            type: optionData.type || 'select', // select, radio, checkbox, text
            values: optionData.values || [],
            required: optionData.required || false
        });
        console.log(`Option added to product ${productId}`);
    }

    /**
     * Get options for product.
     * @param {string} productId - Product identifier.
     * @returns {Array<object>} Product options.
     */
    getOptions(productId) {
        return this.options.get(productId) || [];
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.productOptions = new ProductOptions();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductOptions;
}

