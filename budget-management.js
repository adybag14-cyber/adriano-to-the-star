/**
 * Budget Management
 * Budget management system
 */

class BudgetManagement {
    constructor() {
        this.budgets = new Map();
        this.allocations = new Map();
        this.tracking = new Map();
        this.init();
    }

    init() {
        this.trackEvent('budget_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`budget_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createBudget(budgetId, budgetData) {
        const budget = {
            id: budgetId,
            ...budgetData,
            name: budgetData.name || budgetId,
            amount: budgetData.amount || 0,
            period: budgetData.period || 'monthly',
            status: 'active',
            createdAt: new Date()
        };
        
        this.budgets.set(budgetId, budget);
        return budget;
    }

    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }

    getAllBudgets() {
        return Array.from(this.budgets.values());
    }
}

module.exports = BudgetManagement;
