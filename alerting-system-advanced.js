/**
 * Alerting System Advanced
 * Advanced alerting system
 */

class AlertingSystemAdvanced {
    constructor() {
        this.alerts = [];
        this.rules = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('alerting_advanced_initialized');
        return { success: true, message: 'Alerting System Advanced initialized' };
    }

    createRule(name, condition, action) {
        if (typeof condition !== 'function' || typeof action !== 'function') {
            throw new Error('Condition and action must be functions');
        }
        const rule = {
            id: Date.now().toString(),
            name,
            condition,
            action,
            enabled: true,
            createdAt: new Date()
        };
        this.rules.set(rule.id, rule);
        return rule;
    }

    evaluateRule(ruleId, data) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.enabled) {
            return null;
        }
        if (rule.condition(data)) {
            const alert = {
                id: Date.now().toString(),
                ruleId,
                data,
                triggeredAt: new Date()
            };
            this.alerts.push(alert);
            rule.action(alert);
            this.trackEvent('alert_triggered', { ruleId });
            return alert;
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`alerting_advanced_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'alerting_system_advanced', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertingSystemAdvanced;
}

