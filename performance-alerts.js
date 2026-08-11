class PerformanceAlerts {
    constructor() {
        this.rules = [];
        this.history = [];
    }
    configure(rules = []) {
        this.rules = Array.isArray(rules) ? rules : [];
    }
    evaluate(metrics) {
        const triggered = [];
        for (const rule of this.rules) {
            const value = metrics[rule.field];
            if (typeof value !== 'number') continue;
            let ok = false;
            if (rule.operator === 'gt') ok = value > rule.threshold;
            else if (rule.operator === 'gte') ok = value >= rule.threshold;
            else if (rule.operator === 'lt') ok = value < rule.threshold;
            else if (rule.operator === 'lte') ok = value <= rule.threshold;
            else if (rule.operator === 'eq') ok = value === rule.threshold;
            if (ok) {
                const alert = {
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                    field: rule.field,
                    message: rule.message || `Performance rule triggered: ${rule.field}`,
                    value,
                    threshold: rule.threshold,
                    severity: rule.severity || 'medium',
                    timestamp: new Date()
                };
                this.history.push(alert);
                triggered.push(alert);
            }
        }
        return triggered;
    }
    recent(limit = 20) {
        return this.history.slice(-limit).reverse();
    }
    clear() {
        this.history = [];
    }
}
const performanceAlerts = new PerformanceAlerts();
if (typeof window !== 'undefined') {
    window.performanceAlerts = performanceAlerts;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceAlerts;
}
