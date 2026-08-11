/**
 * Alerting System
 * @class AlertingSystem
 * @description Manages alerts with routing and escalation.
 */
class AlertingSystem {
    constructor() {
        this.alerts = new Map();
        this.rules = new Map();
        this.channels = new Map();
        this.init();
    }

    init() {
        this.setupChannels();
        this.trackEvent('alerting_initialized');
    }

    setupChannels() {
        this.channels.set('email', { enabled: true });
        this.channels.set('sms', { enabled: false });
        this.channels.set('slack', { enabled: true });
        this.channels.set('webhook', { enabled: true });
    }

    /**
     * Create alert rule.
     * @param {string} ruleId - Rule identifier.
     * @param {object} ruleData - Rule data.
     */
    createRule(ruleId, ruleData) {
        this.rules.set(ruleId, {
            ...ruleData,
            id: ruleId,
            name: ruleData.name,
            condition: ruleData.condition,
            threshold: ruleData.threshold,
            channels: ruleData.channels || ['email'],
            enabled: true,
            createdAt: new Date()
        });
        this.trackEvent('rule_created', { ruleId });
    }

    /**
     * Trigger alert.
     * @param {string} ruleId - Rule identifier.
     * @param {object} alertData - Alert data.
     */
    triggerAlert(ruleId, alertData) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.enabled) {
            return;
        }

        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const alert = {
            id: alertId,
            ruleId,
            ...alertData,
            severity: alertData.severity || 'medium',
            message: alertData.message,
            triggeredAt: new Date(),
            acknowledged: false
        };

        this.alerts.set(alertId, alert);
        this.trackEvent('alert_triggered', { alertId, ruleId });

        // Send through channels
        rule.channels.forEach(channel => {
            if (this.channels.get(channel)?.enabled) {
                this.sendAlert(channel, alert);
            }
        });
    }

    /**
     * Send alert.
     * @param {string} channel - Channel identifier.
     * @param {object} alert - Alert object.
     */
    sendAlert(channel, alert) {
        // Placeholder for actual alert sending
        console.log(`Alert sent through ${channel}: ${alert.message}`);
    }

    /**
     * Acknowledge alert.
     * @param {string} alertId - Alert identifier.
     * @param {string} userId - User identifier.
     */
    acknowledgeAlert(alertId, userId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = userId;
            alert.acknowledgedAt = new Date();
            this.trackEvent('alert_acknowledged', { alertId, userId });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`alerting_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'alerting_system', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.alertingSystem = new AlertingSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertingSystem;
}

