/**
 * Product Options and Customization
 * @class ProductOptionsCustomization
 * @description Manages product options and customization features.
 */
class ProductOptionsCustomization {
    constructor() {
        this.options = new Map();
        this.customizations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_op_ti_on_sc_us_to_mi_za_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_op_ti_on_sc_us_to_mi_za_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add product option.
     * @param {string} productId - Product identifier.
     * @param {object} optionData - Option data.
     */
    addOption(productId, optionData) {
        const optionId = `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.options.set(optionId, {
            id: optionId,
            productId,
            name: optionData.name,
            type: optionData.type || 'select', // select, text, checkbox, radio
            values: optionData.values || [],
            required: optionData.required || false,
            priceModifier: optionData.priceModifier || 0,
            createdAt: new Date()
        });
        console.log(`Product option added: ${optionId}`);
    }

    /**
     * Create customization.
     * @param {string} productId - Product identifier.
     * @param {string} userId - User identifier.
     * @param {object} customizationData - Customization data.
     */
    createCustomization(productId, userId, customizationData) {
        const customizationId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.customizations.set(customizationId, {
            id: customizationId,
            productId,
            userId,
            options: customizationData.options || {},
            priceAdjustment: this.calculatePriceAdjustment(customizationData.options),
            createdAt: new Date()
        });
        console.log(`Customization created: ${customizationId}`);
        return customizationId;
    }

    /**
     * Calculate price adjustment.
     * @param {object} options - Selected options.
     * @returns {number} Price adjustment.
     */
    calculatePriceAdjustment(options) {
        let adjustment = 0;
        for (const optionId of Object.keys(options)) {
            const option = Array.from(this.options.values()).find(o => o.id === optionId);
            if (option) {
                adjustment += option.priceModifier || 0;
            }
        }
        return adjustment;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.productOptionsCustomization = new ProductOptionsCustomization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductOptionsCustomization;
}

