/**
 * Performance Budget
 * Performance budget tracking and enforcement
 */

class PerformanceBudget {
    constructor() {
        this.budgets = new Map();
        this.measurements = new Map();
        this.violations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_bu_dg_et_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_bu_dg_et_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createBudget(budgetId, budgetData) {
        const budget = {
            id: budgetId,
            ...budgetData,
            name: budgetData.name || budgetId,
            metrics: budgetData.metrics || {},
            thresholds: budgetData.thresholds || {},
            createdAt: new Date()
        };
        
        this.budgets.set(budgetId, budget);
        console.log(`Performance budget created: ${budgetId}`);
        return budget;
    }

    recordMeasurement(budgetId, measurement) {
        const budget = this.budgets.get(budgetId);
        if (!budget) {
            throw new Error('Budget not found');
        }
        
        const measurementData = {
            id: `measurement_${Date.now()}`,
            budgetId,
            ...measurement,
            timestamp: new Date(),
            violations: [],
            createdAt: new Date()
        };
        
        Object.keys(budget.thresholds).forEach(metric => {
            const value = measurement[metric];
            const threshold = budget.thresholds[metric];
            
            if (value !== undefined && threshold !== undefined) {
                if (value > threshold) {
                    measurementData.violations.push({
                        metric,
                        value,
                        threshold,
                        exceeded: value - threshold
                    });
                    
                    this.recordViolation(budgetId, metric, value, threshold);
                }
            }
        });
        
        this.measurements.set(measurementData.id, measurementData);
        
        return measurementData;
    }

    recordViolation(budgetId, metric, value, threshold) {
        const violation = {
            id: `violation_${Date.now()}`,
            budgetId,
            metric,
            value,
            threshold,
            exceeded: value - threshold,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.violations.set(violation.id, violation);
        return violation;
    }

    getViolations(budgetId = null) {
        if (budgetId) {
            return Array.from(this.violations.values())
                .filter(v => v.budgetId === budgetId);
        }
        return Array.from(this.violations.values());
    }

    getBudget(budgetId) {
        return this.budgets.get(budgetId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.performanceBudget = new PerformanceBudget();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceBudget;
}


