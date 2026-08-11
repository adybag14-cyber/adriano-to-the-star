/**
 * Product Comparison Tool
 * @class ProductComparisonTool
 * @description Allows users to compare multiple products side-by-side.
 */
class ProductComparisonTool {
    constructor() {
        this.comparisons = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_co_mp_ar_is_on_to_ol_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_co_mp_ar_is_on_to_ol_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add product to comparison.
     * @param {string} userId - User identifier.
     * @param {string} productId - Product identifier.
     * @param {object} productData - Product data.
     */
    addToComparison(userId, productId, productData) {
        const comparisonKey = `compare_${userId}`;
        const comparison = this.comparisons.get(comparisonKey) || {
            userId,
            products: [],
            maxProducts: 4,
            createdAt: new Date()
        };

        if (comparison.products.length >= comparison.maxProducts) {
            throw new Error('Maximum number of products for comparison reached');
        }

        if (!comparison.products.find(p => p.id === productId)) {
            comparison.products.push({
                id: productId,
                ...productData,
                addedAt: new Date()
            });
            this.comparisons.set(comparisonKey, comparison);
            console.log(`Product added to comparison: ${productId}`);
        }
    }

    /**
     * Get comparison.
     * @param {string} userId - User identifier.
     * @returns {object} Comparison data.
     */
    getComparison(userId) {
        const comparisonKey = `compare_${userId}`;
        return this.comparisons.get(comparisonKey) || {
            userId,
            products: []
        };
    }

    /**
     * Remove product from comparison.
     * @param {string} userId - User identifier.
     * @param {string} productId - Product identifier.
     */
    removeFromComparison(userId, productId) {
        const comparisonKey = `compare_${userId}`;
        const comparison = this.comparisons.get(comparisonKey);
        if (comparison) {
            comparison.products = comparison.products.filter(p => p.id !== productId);
            this.comparisons.set(comparisonKey, comparison);
            console.log(`Product removed from comparison: ${productId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.productComparisonTool = new ProductComparisonTool();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductComparisonTool;
}

