/**
 * Alert Rules Engine
 * Alert rule evaluation and triggering
 */

class AlertRulesEngine {
    constructor() {
        this.rules = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('rules_engine_initialized');
    }

    createRule(ruleId, ruleData) {
        const rule = {
            id: ruleId,
            ...ruleData,
            name: ruleData.name || ruleId,
            condition: ruleData.condition || {},
            threshold: ruleData.threshold || 0,
            severity: ruleData.severity || 'medium',
            enabled: ruleData.enabled !== false,
            createdAt: new Date()
        };
        
        this.rules.set(ruleId, rule);
        this.trackEvent('rule_created', { ruleId });
        return rule;
    }

    evaluate(data, ruleId = null) {
        const rulesToEvaluate = ruleId 
            ? [this.rules.get(ruleId)].filter(Boolean)
            : Array.from(this.rules.values()).filter(r => r.enabled);
        
        const triggeredAlerts = [];
        
        rulesToEvaluate.forEach(rule => {
            if (this.checkCondition(data, rule)) {
                const alert = this.triggerAlert(rule, data);
                triggeredAlerts.push(alert);
            }
        });
        
        return triggeredAlerts;
    }

    checkCondition(data, rule) {
        if (!rule.condition) {
            return false;
        }
        
        const value = this.extractValue(data, rule.condition.field);
        
        if (rule.condition.operator === 'gt') {
            return value > rule.threshold;
        } else if (rule.condition.operator === 'lt') {
            return value < rule.threshold;
        } else if (rule.condition.operator === 'eq') {
            return value === rule.threshold;
        } else if (rule.condition.operator === 'gte') {
            return value >= rule.threshold;
        } else if (rule.condition.operator === 'lte') {
            return value <= rule.threshold;
        }
        
        return false;
    }

    extractValue(data, field) {
        if (!field) return 0;
        const parts = field.split('.');
        let value = data;
        for (const part of parts) {
            value = value?.[part];
        }
        return value || 0;
    }

    triggerAlert(rule, data) {
        const alert = {
            id: `alert_${Date.now()}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `Alert: ${rule.name} condition met`,
            data,
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        this.trackEvent('alert_triggered', { ruleId: rule.id, severity: rule.severity });
        
        return alert;
    }

    getRule(ruleId) {
        return this.rules.get(ruleId);
    }

    getAlert(alertId) {
        return this.alerts.get(alertId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`rules_engine_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'alert_rules_engine', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.alertRulesEngine = new AlertRulesEngine();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertRulesEngine;
}

