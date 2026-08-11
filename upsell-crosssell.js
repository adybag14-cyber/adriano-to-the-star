/**
 * Upsell and Cross-sell
 * @class UpsellCrosssell
 * @description Manages upsell and cross-sell product suggestions.
 */
class UpsellCrosssell {
    constructor() {
        this.upsells = new Map();
        this.crosssells = new Map();
        this.init();
    }

    init() {
        this.trackEvent('u_ps_el_lc_ro_ss_se_ll_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("u_ps_el_lc_ro_ss_se_ll_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Get upsell products.
     * @param {string} productId - Product identifier.
     * @returns {Array<object>} Upsell products.
     */
    getUpsells(productId) {
        return this.upsells.get(productId) || [];
    }

    /**
     * Get cross-sell products.
     * @param {string} productId - Product identifier.
     * @returns {Array<object>} Cross-sell products.
     */
    getCrosssells(productId) {
        return this.crosssells.get(productId) || [];
    }

    /**
     * Add upsell product.
     * @param {string} productId - Product identifier.
     * @param {string} upsellProductId - Upsell product identifier.
     */
    addUpsell(productId, upsellProductId) {
        if (!this.upsells.has(productId)) {
            this.upsells.set(productId, []);
        }
        this.upsells.get(productId).push(upsellProductId);
    }

    /**
     * Add cross-sell product.
     * @param {string} productId - Product identifier.
     * @param {string} crosssellProductId - Cross-sell product identifier.
     */
    addCrosssell(productId, crosssellProductId) {
        if (!this.crosssells.has(productId)) {
            this.crosssells.set(productId, []);
        }
        this.crosssells.get(productId).push(crosssellProductId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.upsellCrosssell = new UpsellCrosssell();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpsellCrosssell;
}

