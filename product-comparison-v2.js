/**
 * Product Comparison v2
 * Advanced product comparison system
 */

class ProductComparisonV2 {
    constructor() {
        this.comparisons = new Map();
        this.sessions = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Product Comparison v2 initialized' };
    }

    createComparison(userId, productIds) {
        if (!Array.isArray(productIds) || productIds.length < 2) {
            throw new Error('Must compare at least 2 products');
        }
        const comparison = {
            id: Date.now().toString(),
            userId,
            productIds,
            createdAt: new Date()
        };
        this.comparisons.set(comparison.id, comparison);
        return comparison;
    }

    addProduct(comparisonId, productId) {
        const comparison = this.comparisons.get(comparisonId);
        if (!comparison) {
            throw new Error('Comparison not found');
        }
        if (comparison.productIds.includes(productId)) {
            throw new Error('Product already in comparison');
        }
        comparison.productIds.push(productId);
        return comparison;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductComparisonV2;
}

