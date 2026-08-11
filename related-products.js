/**
 * Related Products
 * @class RelatedProducts
 * @description Finds and displays related products.
 */
class RelatedProducts {
    constructor() {
        this.relations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_el_at_ed_pr_od_uc_ts_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_el_at_ed_pr_od_uc_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create product relation.
     * @param {string} productId - Product identifier.
     * @param {string} relatedProductId - Related product identifier.
     * @param {string} relationType - Relation type (similar, complementary, alternative).
     */
    createRelation(productId, relatedProductId, relationType) {
        const relationKey = `${productId}_${relatedProductId}`;
        this.relations.set(relationKey, {
            productId,
            relatedProductId,
            relationType,
            strength: 1.0,
            createdAt: new Date()
        });
        console.log(`Product relation created: ${productId} -> ${relatedProductId}`);
    }

    /**
     * Get related products.
     * @param {string} productId - Product identifier.
     * @param {string} relationType - Relation type (optional).
     * @param {number} limit - Number of products to return.
     * @returns {Array<object>} Related products.
     */
    getRelatedProducts(productId, relationType = null, limit = 5) {
        let relations = Array.from(this.relations.values())
            .filter(rel => rel.productId === productId);

        if (relationType) {
            relations = relations.filter(rel => rel.relationType === relationType);
        }

        return relations
            .sort((a, b) => b.strength - a.strength)
            .slice(0, limit)
            .map(rel => ({
                productId: rel.relatedProductId,
                relationType: rel.relationType,
                strength: rel.strength
            }));
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.relatedProducts = new RelatedProducts();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelatedProducts;
}
