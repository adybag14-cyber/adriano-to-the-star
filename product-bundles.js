/**
 * Product Bundles
 * @class ProductBundles
 * @description Manages product bundles with discounts and cross-sell opportunities.
 */
class ProductBundles {
    constructor() {
        this.bundles = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_bu_nd_le_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_bu_nd_le_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create bundle.
     * @param {string} bundleId - Bundle identifier.
     * @param {object} bundleData - Bundle data.
     */
    createBundle(bundleId, bundleData) {
        this.bundles.set(bundleId, {
            ...bundleData,
            id: bundleId,
            name: bundleData.name,
            products: bundleData.products || [],
            originalPrice: bundleData.originalPrice,
            bundlePrice: bundleData.bundlePrice,
            discount: bundleData.discount || 0,
            status: 'active',
            createdAt: new Date()
        });
        console.log(`Product bundle created: ${bundleId}`);
    }

    /**
     * Calculate bundle savings.
     * @param {string} bundleId - Bundle identifier.
     * @returns {object} Savings information.
     */
    calculateSavings(bundleId) {
        const bundle = this.bundles.get(bundleId);
        if (!bundle) {
            throw new Error(`Bundle not found: ${bundleId}`);
        }

        const savings = bundle.originalPrice - bundle.bundlePrice;
        const savingsPercentage = (savings / bundle.originalPrice) * 100;

        return {
            bundleId,
            originalPrice: bundle.originalPrice,
            bundlePrice: bundle.bundlePrice,
            savings,
            savingsPercentage: Math.round(savingsPercentage)
        };
    }

    /**
     * Get available bundles.
     * @returns {Array<object>} Available bundles.
     */
    getAvailableBundles() {
        return Array.from(this.bundles.values())
            .filter(bundle => bundle.status === 'active');
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.productBundles = new ProductBundles();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductBundles;
}

