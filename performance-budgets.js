/**
 * Performance Budgets
 * Performance budget management
 */

class PerformanceBudgets {
    constructor() {
        this.budgets = new Map();
        this.checks = new Map();
        this.violations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_bu_dg_et_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_bu_dg_et_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createBudget(budgetId, budgetData) {
        const budget = {
            id: budgetId,
            ...budgetData,
            name: budgetData.name || budgetId,
            limits: budgetData.limits || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.budgets.set(budgetId, budget);
        return budget;
    }

    async check(budgetId, metrics) {
        const budget = this.budgets.get(budgetId);
        if (!budget) {
            throw new Error(`Budget ${budgetId} not found`);
        }

        const check = {
            id: `check_${Date.now()}`,
            budgetId,
            metrics,
            violations: this.detectViolations(budget, metrics),
            timestamp: new Date()
        };

        this.checks.set(check.id, check);
        if (check.violations.length > 0) {
            this.violations.set(check.id, check);
        }
        return check;
    }

    detectViolations(budget, metrics) {
        return Object.keys(budget.limits).filter(key => {
            return (metrics[key] || 0) > budget.limits[key];
        }).map(key => ({
            metric: key,
            limit: budget.limits[key],
            actual: metrics[key]
        }));
    }

    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }

    getAllBudgets() {
        return Array.from(this.budgets.values());
    }
}

module.exports = PerformanceBudgets;

