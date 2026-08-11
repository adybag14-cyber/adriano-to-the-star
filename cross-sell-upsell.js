/**
 * Cross-Sell and Upsell
 * @class CrossSellUpsell
 * @description Manages cross-sell and upsell opportunities.
 */
class CrossSellUpsell {
    constructor() {
        this.rules = new Map();
        this.opportunities = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cross_sell_upsell_initialized');
    }

    /**
     * Create cross-sell rule.
     * @param {string} ruleId - Rule identifier.
     * @param {object} ruleData - Rule data.
     */
    createRule(ruleId, ruleData) {
        this.rules.set(ruleId, {
            ...ruleData,
            id: ruleId,
            type: ruleData.type || 'cross-sell', // cross-sell, upsell
            triggerProduct: ruleData.triggerProduct,
            suggestedProduct: ruleData.suggestedProduct,
            priority: ruleData.priority || 'medium',
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Cross-sell/upsell rule created: ${ruleId}`);
    }

    /**
     * Get suggestions.
     * @param {string} productId - Product identifier.
     * @param {string} type - Suggestion type.
     * @returns {Array<object>} Suggestions.
     */
    getSuggestions(productId, type = 'cross-sell') {
        return Array.from(this.rules.values())
            .filter(rule => 
                rule.triggerProduct === productId && 
                rule.type === type && 
                rule.enabled
            )
            .map(rule => ({
                productId: rule.suggestedProduct,
                type: rule.type,
                priority: rule.priority
            }))
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cross_sell_upsell_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.crossSellUpsell = new CrossSellUpsell();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossSellUpsell;
}

