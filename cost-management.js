/**
 * Cost Management
 * Cost management system
 */

class CostManagement {
    constructor() {
        this.costs = new Map();
        this.categories = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cost_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cost_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async recordCost(costId, costData) {
        const cost = {
            id: costId,
            ...costData,
            amount: costData.amount || 0,
            category: costData.category || '',
            date: costData.date || new Date(),
            createdAt: new Date()
        };
        
        this.costs.set(costId, cost);
        return cost;
    }

    getCost(costId) {
        return this.costs.get(costId);
    }

    getAllCosts() {
        return Array.from(this.costs.values());
    }
}

module.exports = CostManagement;

