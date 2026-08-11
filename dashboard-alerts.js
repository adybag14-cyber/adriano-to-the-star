/**
 * Dashboard Alerts
 * Alerts based on dashboard metrics
 */

class DashboardAlerts {
    constructor() {
        this.alerts = [];
        this.rules = [];
        this.init();
    }

    init() {
        this.trackEvent('dashboard_alerts_initialized');
    }

    createAlertRule(ruleId, config) {
        const rule = {
            id: ruleId,
            dashboardId: config.dashboardId,
            metric: config.metric,
            condition: config.condition, // >, <, ==, !=
            threshold: config.threshold,
            action: config.action,
            enabled: true,
            createdAt: new Date()
        };
        
        this.rules.push(rule);
        return rule;
    }

    checkMetrics(dashboardId, metrics) {
        const rules = this.rules.filter(r => 
            r.dashboardId === dashboardId && r.enabled
        );
        
        rules.forEach(rule => {
            const value = metrics[rule.metric];
            if (this.evaluateCondition(value, rule.condition, rule.threshold)) {
                this.triggerAlert(rule, value);
            }
        });
    }

    evaluateCondition(value, condition, threshold) {
        switch (condition) {
            case '>':
                return value > threshold;
            case '<':
                return value < threshold;
            case '==':
                return value === threshold;
            case '!=':
                return value !== threshold;
            default:
                return false;
        }
    }

    triggerAlert(rule, value) {
        const alert = {
            id: `alert_${Date.now()}`,
            ruleId: rule.id,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            triggeredAt: new Date()
        };
        
        this.alerts.push(alert);
        this.executeAction(rule.action, alert);
        return alert;
    }

    executeAction(action, alert) {
        switch (action.type) {
            case 'email':
                console.log('[Dashboard Alert Email]', alert);
                break;
            case 'webhook':
                console.log('[Dashboard Alert Webhook]', alert);
                break;
            case 'notification':
                console.log('[Dashboard Alert Notification]', alert);
                break;
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_alerts_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dashboardAlerts = new DashboardAlerts();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardAlerts;
}


