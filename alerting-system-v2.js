/**
 * Alerting System v2
 * Advanced alerting system
 */

class AlertingSystemV2 {
    constructor() {
        this.rules = new Map();
        this.alerts = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('alerting_v2_initialized');
        return { success: true, message: 'Alerting System v2 initialized' };
    }

    createRule(name, condition, threshold, channels) {
        if (typeof condition !== 'function') {
            throw new Error('Condition must be a function');
        }
        if (!Array.isArray(channels)) {
            throw new Error('Channels must be an array');
        }
        const rule = {
            id: Date.now().toString(),
            name,
            condition,
            threshold,
            channels,
            createdAt: new Date(),
            enabled: true
        };
        this.rules.set(rule.id, rule);
        return rule;
    }

    evaluateRule(ruleId, value) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.enabled) {
            throw new Error('Rule not found or disabled');
        }
        if (rule.condition(value, rule.threshold)) {
            const alert = {
                id: Date.now().toString(),
                ruleId,
                value,
                threshold: rule.threshold,
                channels: rule.channels,
                triggeredAt: new Date()
            };
            this.alerts.push(alert);
            this.trackEvent('alert_triggered', { ruleId });
            return alert;
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`alerting_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'alerting_system_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertingSystemV2;
}

