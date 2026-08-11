/**
 * Data Integration Monitoring
 * @class DataIntegrationMonitoring
 * @description Monitors data integration processes, pipelines, and workflows.
 */
class DataIntegrationMonitoring {
    constructor() {
        this.monitors = new Map();
        this.metrics = [];
        this.alerts = [];
        this.init();
    }

    init() {
        this.trackEvent('data_integ_monitoring_initialized');
    }

    /**
     * Register a monitor.
     * @param {string} monitorId - Unique monitor identifier.
     * @param {object} config - Monitor configuration.
     */
    registerMonitor(monitorId, config) {
        this.monitors.set(monitorId, {
            ...config,
            status: 'active',
            metrics: []
        });
        console.log(`Monitor registered: ${monitorId}`);
    }

    /**
     * Record a metric.
     * @param {string} monitorId - Monitor identifier.
     * @param {string} metricName - Metric name.
     * @param {number} value - Metric value.
     */
    recordMetric(monitorId, metricName, value) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error(`Monitor not found: ${monitorId}`);
        }

        const metric = {
            monitorId,
            metricName,
            value,
            timestamp: new Date()
        };

        monitor.metrics.push(metric);
        this.metrics.push(metric);

        // Check for alerts
        this.checkAlerts(monitorId, metricName, value);
    }

    /**
     * Check for alert conditions.
     * @param {string} monitorId - Monitor identifier.
     * @param {string} metricName - Metric name.
     * @param {number} value - Metric value.
     */
    checkAlerts(monitorId, metricName, value) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor || !monitor.alerts) return;

        for (const alert of monitor.alerts) {
            if (alert.metric === metricName) {
                if (alert.condition === 'gt' && value > alert.threshold) {
                    this.triggerAlert(monitorId, alert, value);
                } else if (alert.condition === 'lt' && value < alert.threshold) {
                    this.triggerAlert(monitorId, alert, value);
                }
            }
        }
    }

    /**
     * Trigger an alert.
     * @param {string} monitorId - Monitor identifier.
     * @param {object} alert - Alert configuration.
     * @param {number} value - Current value.
     */
    triggerAlert(monitorId, alert, value) {
        const alertRecord = {
            monitorId,
            alert: alert.name,
            value,
            threshold: alert.threshold,
            timestamp: new Date()
        };

        this.alerts.push(alertRecord);
        console.warn(`Alert triggered: ${alert.name}`, alertRecord);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_integ_monitoring_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataIntegrationMonitoring = new DataIntegrationMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataIntegrationMonitoring;
}
