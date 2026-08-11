/**
 * Monitoring and Alerting
 * @class MonitoringAlerting
 * @description Monitors system health and sends alerts for issues.
 */
class MonitoringAlerting {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.alertRules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_on_it_or_in_ga_le_rt_in_g_initialized');
        this.setupDefaultAlertRules();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_on_it_or_in_ga_le_rt_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultAlertRules() {
        this.alertRules.set('high_error_rate', {
            name: 'High Error Rate',
            metric: 'error_rate',
            threshold: 0.05, // 5%
            condition: 'gt'
        });

        this.alertRules.set('high_response_time', {
            name: 'High Response Time',
            metric: 'response_time',
            threshold: 1000, // 1 second
            condition: 'gt'
        });
    }

    /**
     * Record a metric.
     * @param {string} metricName - Metric name.
     * @param {number} value - Metric value.
     * @param {object} tags - Optional tags.
     */
    recordMetric(metricName, value, tags = {}) {
        const metric = {
            name: metricName,
            value,
            tags,
            timestamp: new Date()
        };

        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }

        this.metrics.get(metricName).push(metric);

        // Check alert rules
        this.checkAlerts(metricName, value);
    }

    /**
     * Check alerts.
     * @param {string} metricName - Metric name.
     * @param {number} value - Metric value.
     */
    checkAlerts(metricName, value) {
        for (const rule of this.alertRules.values()) {
            if (rule.metric === metricName) {
                let shouldAlert = false;

                if (rule.condition === 'gt' && value > rule.threshold) {
                    shouldAlert = true;
                } else if (rule.condition === 'lt' && value < rule.threshold) {
                    shouldAlert = true;
                }

                if (shouldAlert) {
                    this.triggerAlert(rule, value);
                }
            }
        }
    }

    /**
     * Trigger an alert.
     * @param {object} rule - Alert rule.
     * @param {number} value - Current value.
     */
    triggerAlert(rule, value) {
        const alert = {
            rule: rule.name,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            timestamp: new Date()
        };

        this.alerts.push(alert);
        console.warn(`Alert triggered: ${rule.name}`, alert);
        
        // Send notification (placeholder)
        this.sendAlertNotification(alert);
    }

    /**
     * Send alert notification.
     * @param {object} alert - Alert object.
     */
    sendAlertNotification(alert) {
        // Placeholder for actual notification logic
        console.log('Sending alert notification:', alert);
    }

    /**
     * Get metrics.
     * @param {string} metricName - Metric name (optional).
     * @returns {Array<object>} Metrics.
     */
    getMetrics(metricName = null) {
        if (metricName) {
            return this.metrics.get(metricName) || [];
        }
        return Array.from(this.metrics.values()).flat();
    }

    /**
     * Get alerts.
     * @param {object} filters - Filter options.
     * @returns {Array<object>} Alerts.
     */
    getAlerts(filters = {}) {
        let alerts = this.alerts;

        if (filters.startDate) {
            alerts = alerts.filter(alert => alert.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            alerts = alerts.filter(alert => alert.timestamp <= filters.endDate);
        }

        return alerts.sort((a, b) => b.timestamp - a.timestamp);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.monitoringAlerting = new MonitoringAlerting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringAlerting;
}
