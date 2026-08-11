/**
 * Preorder System
 * @class PreorderSystem
 * @description Manages preorders for upcoming products.
 */
class PreorderSystem {
    constructor() {
        this.preorders = new Map();
        this.products = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_re_or_de_rs_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_re_or_de_rs_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Enable preorder for product.
     * @param {string} productId - Product identifier.
     * @param {object} preorderData - Preorder data.
     */
    enablePreorder(productId, preorderData) {
        this.products.set(productId, {
            productId,
            enabled: true,
            releaseDate: preorderData.releaseDate,
            maxPreorders: preorderData.maxPreorders || null,
            depositRequired: preorderData.depositRequired || false,
            depositAmount: preorderData.depositAmount || 0,
            createdAt: new Date()
        });
        console.log(`Preorder enabled for product: ${productId}`);
    }

    /**
     * Create preorder.
     * @param {string} productId - Product identifier.
     * @param {string} userId - User identifier.
     * @param {number} quantity - Quantity.
     * @returns {string} Preorder identifier.
     */
    createPreorder(productId, userId, quantity) {
        const product = this.products.get(productId);
        if (!product || !product.enabled) {
            throw new Error('Preorder not available for this product');
        }

        // Check max preorders
        const currentPreorders = Array.from(this.preorders.values())
            .filter(po => po.productId === productId && po.status === 'active').length;

        if (product.maxPreorders && currentPreorders >= product.maxPreorders) {
            throw new Error('Maximum preorders reached');
        }

        const preorderId = `preorder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.preorders.set(preorderId, {
            id: preorderId,
            productId,
            userId,
            quantity,
            status: 'active',
            releaseDate: product.releaseDate,
            depositPaid: product.depositRequired,
            createdAt: new Date()
        });
        console.log(`Preorder created: ${preorderId}`);
        return preorderId;
    }

    /**
     * Convert preorder to order.
     * @param {string} preorderId - Preorder identifier.
     * @returns {string} Order identifier.
     */
    convertToOrder(preorderId) {
        const preorder = this.preorders.get(preorderId);
        if (preorder) {
            preorder.status = 'converted';
            preorder.convertedAt = new Date();
            console.log(`Preorder converted to order: ${preorderId}`);
            return `order_${preorderId}`;
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.preorderSystem = new PreorderSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreorderSystem;
}
