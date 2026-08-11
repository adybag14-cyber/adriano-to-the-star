/**
 * Cloud Alerts
 * Cloud alert management and notification
 */

class CloudAlerts {
    constructor() {
        this.alerts = new Map();
        this.rules = new Map();
        this.notifications = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cloud_alerts_initialized');
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
        console.log(`Alert rule created: ${ruleId}`);
        return rule;
    }

    evaluate(ruleId, metricValue) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.enabled) {
            return null;
        }
        
        let triggered = false;
        
        if (rule.condition.operator === 'gt') {
            triggered = metricValue > rule.threshold;
        } else if (rule.condition.operator === 'lt') {
            triggered = metricValue < rule.threshold;
        } else if (rule.condition.operator === 'gte') {
            triggered = metricValue >= rule.threshold;
        } else if (rule.condition.operator === 'lte') {
            triggered = metricValue <= rule.threshold;
        }
        
        if (triggered) {
            return this.triggerAlert(rule, metricValue);
        }
        
        return null;
    }

    triggerAlert(rule, metricValue) {
        const alert = {
            id: `alert_${Date.now()}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            metricValue,
            threshold: rule.threshold,
            message: `Alert: ${rule.name} condition met`,
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        this.sendNotification(alert);
        
        return alert;
    }

    sendNotification(alert) {
        const notification = {
            id: `notification_${Date.now()}`,
            alertId: alert.id,
            channel: 'email',
            status: 'sent',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.notifications.set(notification.id, notification);
        return notification;
    }

    getAlert(alertId) {
        return this.alerts.get(alertId);
    }

    getRule(ruleId) {
        return this.rules.get(ruleId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cloud_alerts_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cloudAlerts = new CloudAlerts();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudAlerts;
}

