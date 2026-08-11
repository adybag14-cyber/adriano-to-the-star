/**
 * Cloud Cost Management
 * Cloud cost tracking and optimization
 */

class CloudCostManagement {
    constructor() {
        this.accounts = new Map();
        this.costs = new Map();
        this.budgets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cloud_cost_mgmt_initialized');
    }

    registerAccount(accountId, accountData) {
        const account = {
            id: accountId,
            ...accountData,
            name: accountData.name || accountId,
            provider: accountData.provider || 'aws',
            totalCost: 0,
            createdAt: new Date()
        };
        
        this.accounts.set(accountId, account);
        console.log(`Cloud account registered: ${accountId}`);
        return account;
    }

    recordCost(accountId, costData) {
        const account = this.accounts.get(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        
        const cost = {
            id: `cost_${Date.now()}`,
            accountId,
            ...costData,
            service: costData.service || 'compute',
            amount: costData.amount || 0,
            currency: costData.currency || 'USD',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.costs.set(cost.id, cost);
        account.totalCost += cost.amount;
        
        return cost;
    }

    createBudget(accountId, budgetId, budgetData) {
        const account = this.accounts.get(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        
        const budget = {
            id: budgetId,
            accountId,
            ...budgetData,
            name: budgetData.name || budgetId,
            limit: budgetData.limit || 1000,
            period: budgetData.period || 'monthly',
            alerts: budgetData.alerts || [],
            createdAt: new Date()
        };
        
        this.budgets.set(budgetId, budget);
        
        return budget;
    }

    checkBudgets(accountId) {
        const account = this.accounts.get(accountId);
        if (!account) {
            throw new Error('Account not found');
        }
        
        const budgets = Array.from(this.budgets.values())
            .filter(b => b.accountId === accountId);
        
        return budgets.map(budget => {
            const usage = (account.totalCost / budget.limit) * 100;
            return {
                budgetId: budget.id,
                limit: budget.limit,
                current: account.totalCost,
                usage: usage.toFixed(2) + '%',
                exceeded: account.totalCost > budget.limit
            };
        });
    }

    getAccount(accountId) {
        return this.accounts.get(accountId);
    }

    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cloud_cost_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cloudCostManagement = new CloudCostManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudCostManagement;
}

