class PerformanceBudgetsEnforcer {
    constructor() {
        this.budgets = {
            lcp: 2500,
            cls: 0.1,
            fcp: 2000,
            ttfb: 800
        };
        this.results = [];
    }
    setBudgets(budgets) {
        this.budgets = { ...this.budgets, ...(budgets || {}) };
    }
    evaluate(metrics) {
        const result = {
            lcp: metrics.lcp <= this.budgets.lcp,
            cls: (metrics.cls || 0) <= this.budgets.cls,
            fcp: metrics.fcp <= this.budgets.fcp,
            ttfb: metrics.ttfb <= this.budgets.ttfb,
            timestamp: new Date()
        };
        this.results.push(result);
        return result;
    }
    latest() {
        return this.results[this.results.length - 1] || null;
    }
    clear() {
        this.results = [];
    }
}
const performanceBudgetsEnforcer = new PerformanceBudgetsEnforcer();
if (typeof window !== 'undefined') {
    window.performanceBudgetsEnforcer = performanceBudgetsEnforcer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceBudgetsEnforcer;
}
