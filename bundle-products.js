/**
 * Bundle Products
 * @class BundleProducts
 * @description Manages product bundles with discounts and package deals.
 */
class BundleProducts {
    constructor() {
        this.bundles = new Map();
        this.init();
    }

    init() {
        this.trackEvent('bundle_prod_initialized');
    }

    /**
     * Create a bundle.
     * @param {string} bundleId - Bundle identifier.
     * @param {object} bundleData - Bundle data.
     */
    createBundle(bundleId, bundleData) {
        this.bundles.set(bundleId, {
            ...bundleData,
            id: bundleId,
            products: bundleData.products || [],
            discount: bundleData.discount || 0,
            price: this.calculateBundlePrice(bundleData.products, bundleData.discount),
            createdAt: new Date()
        });
        console.log(`Bundle created: ${bundleId}`);
    }

    /**
     * Calculate bundle price.
     * @param {Array<object>} products - Products in bundle.
     * @param {number} discount - Discount percentage.
     * @returns {number} Bundle price.
     */
    calculateBundlePrice(products, discount) {
        const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
        return totalPrice * (1 - discount / 100);
    }

    /**
     * Get bundle by ID.
     * @param {string} bundleId - Bundle identifier.
     * @returns {object} Bundle data.
     */
    getBundle(bundleId) {
        return this.bundles.get(bundleId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bundle_prod_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.bundleProducts = new BundleProducts();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BundleProducts;
}

