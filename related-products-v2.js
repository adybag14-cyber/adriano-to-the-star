/**
 * Related Products v2
 * Advanced related products system
 */

class RelatedProductsV2 {
    constructor() {
        this.relations = new Map();
        this.graph = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Related Products v2 initialized' };
    }

    addRelation(productId, relatedProductId, strength) {
        if (strength < 0 || strength > 1) {
            throw new Error('Strength must be between 0 and 1');
        }
        const relation = {
            productId,
            relatedProductId,
            strength,
            addedAt: new Date()
        };
        const key = `${productId}-${relatedProductId}`;
        this.relations.set(key, relation);
        if (!this.graph.has(productId)) {
            this.graph.set(productId, []);
        }
        this.graph.get(productId).push({ productId: relatedProductId, strength });
        return relation;
    }

    getRelated(productId, limit) {
        if (limit < 1) {
            throw new Error('Limit must be at least 1');
        }
        const related = this.graph.get(productId) || [];
        return related
            .sort((a, b) => b.strength - a.strength)
            .slice(0, limit)
            .map(r => r.productId);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelatedProductsV2;
}

