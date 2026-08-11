/**
 * Product Variants
 * @class ProductVariants
 * @description Manages product variants (size, color, etc.) with inventory tracking.
 */
class ProductVariants {
    constructor() {
        this.variants = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_va_ri_an_ts_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_va_ri_an_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add variant to product.
     * @param {string} productId - Product identifier.
     * @param {object} variantData - Variant data.
     */
    addVariant(productId, variantData) {
        const variantId = `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!this.variants.has(productId)) {
            this.variants.set(productId, []);
        }

        this.variants.get(productId).push({
            id: variantId,
            ...variantData,
            attributes: variantData.attributes || {}, // e.g., { size: 'L', color: 'red' }
            price: variantData.price,
            sku: variantData.sku,
            inventory: variantData.inventory || 0
        });
        console.log(`Variant added to product ${productId}`);
    }

    /**
     * Get variants for product.
     * @param {string} productId - Product identifier.
     * @returns {Array<object>} Product variants.
     */
    getVariants(productId) {
        return this.variants.get(productId) || [];
    }

    /**
     * Find variant by attributes.
     * @param {string} productId - Product identifier.
     * @param {object} attributes - Variant attributes.
     * @returns {object} Variant or null.
     */
    findVariantByAttributes(productId, attributes) {
        const variants = this.getVariants(productId);
        return variants.find(variant => {
            return Object.keys(attributes).every(key => 
                variant.attributes[key] === attributes[key]
            );
        }) || null;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.productVariants = new ProductVariants();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductVariants;
}

