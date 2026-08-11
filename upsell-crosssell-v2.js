/**
 * Upsell/Cross-Sell v2
 * Advanced upsell and cross-sell system
 */

class UpsellCrosssellV2 {
    constructor() {
        this.rules = new Map();
        this.offers = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Upsell/Cross-Sell v2 initialized' };
    }

    createRule(name, type, trigger, products) {
        if (!['upsell', 'crosssell'].includes(type)) {
            throw new Error('Type must be upsell or crosssell');
        }
        if (!Array.isArray(products)) {
            throw new Error('Products must be an array');
        }
        const rule = {
            id: Date.now().toString(),
            name,
            type,
            trigger,
            products,
            createdAt: new Date(),
            enabled: true
        };
        this.rules.set(rule.id, rule);
        return rule;
    }

    generateOffers(cart, ruleIds) {
        const applicableRules = ruleIds
            .map(id => this.rules.get(id))
            .filter(rule => rule && rule.enabled && rule.trigger(cart));
        const offers = applicableRules.flatMap(rule => 
            rule.products.map(productId => ({
                ruleId: rule.id,
                type: rule.type,
                productId,
                generatedAt: new Date()
            }))
        );
        this.offers.push({ cart, offers, generatedAt: new Date() });
        return offers;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpsellCrosssellV2;
}

