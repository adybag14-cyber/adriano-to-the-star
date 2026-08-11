/**
 * Multiple Shipping Options
 * @class MultipleShippingOptions
 * @description Provides multiple shipping options with different speeds and costs.
 */
class MultipleShippingOptions {
    constructor() {
        this.options = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_ul_ti_pl_es_hi_pp_in_go_pt_io_ns_initialized');
        this.setupDefaultOptions();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_ul_ti_pl_es_hi_pp_in_go_pt_io_ns_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultOptions() {
        this.options.set('standard', {
            id: 'standard',
            name: 'Standard Shipping',
            cost: 5.99,
            estimatedDays: 5,
            description: 'Standard delivery within 5-7 business days'
        });

        this.options.set('express', {
            id: 'express',
            name: 'Express Shipping',
            cost: 12.99,
            estimatedDays: 2,
            description: 'Express delivery within 2-3 business days'
        });

        this.options.set('overnight', {
            id: 'overnight',
            name: 'Overnight Shipping',
            cost: 24.99,
            estimatedDays: 1,
            description: 'Next business day delivery'
        });

        this.options.set('free', {
            id: 'free',
            name: 'Free Shipping',
            cost: 0,
            estimatedDays: 7,
            description: 'Free shipping on orders over $50',
            minOrderAmount: 50
        });
    }

    /**
     * Get available shipping options.
     * @param {number} orderTotal - Order total amount.
     * @returns {Array<object>} Available shipping options.
     */
    getAvailableOptions(orderTotal = 0) {
        return Array.from(this.options.values()).filter(option => {
            if (option.minOrderAmount) {
                return orderTotal >= option.minOrderAmount;
            }
            return true;
        });
    }

    /**
     * Get shipping option by ID.
     * @param {string} optionId - Option identifier.
     * @returns {object} Shipping option.
     */
    getOption(optionId) {
        return this.options.get(optionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.multipleShippingOptions = new MultipleShippingOptions();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultipleShippingOptions;
}

