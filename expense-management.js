/**
 * Expense Management
 * Expense management system
 */

class ExpenseManagement {
    constructor() {
        this.expenses = new Map();
        this.reports = new Map();
        this.approvals = new Map();
        this.init();
    }

    init() {
        this.trackEvent('expense_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`expense_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createExpense(expenseId, expenseData) {
        const expense = {
            id: expenseId,
            ...expenseData,
            amount: expenseData.amount || 0,
            category: expenseData.category || '',
            status: 'pending',
            createdAt: new Date()
        };
        
        this.expenses.set(expenseId, expense);
        return expense;
    }

    async approve(expenseId) {
        const expense = this.expenses.get(expenseId);
        if (!expense) {
            throw new Error(`Expense ${expenseId} not found`);
        }

        expense.status = 'approved';
        expense.approvedAt = new Date();
        return expense;
    }

    getExpense(expenseId) {
        return this.expenses.get(expenseId);
    }

    getAllExpenses() {
        return Array.from(this.expenses.values());
    }
}

module.exports = ExpenseManagement;

