/**
 * API Monitoring Advanced
 * Advanced API monitoring system
 */

class APIMonitoringAdvanced {
    constructor() {
        this.monitors = new Map();
        this.metrics = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_monitoring_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_monitoring_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            apiId: monitorData.apiId || '',
            thresholds: monitorData.thresholds || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        return monitor;
    }

    async record(monitorId, metricData) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error(`Monitor ${monitorId} not found`);
        }

        const metric = {
            id: `metric_${Date.now()}`,
            monitorId,
            ...metricData,
            timestamp: new Date()
        };

        this.metrics.set(metric.id, metric);
        await this.checkThresholds(monitor, metric);
        return metric;
    }

    async checkThresholds(monitor, metric) {
        const exceeded = Object.keys(monitor.thresholds).some(key => {
            return (metric[key] || 0) > monitor.thresholds[key];
        });

        if (exceeded) {
            const alert = {
                id: `alert_${Date.now()}`,
                monitorId: monitor.id,
                metricId: metric.id,
                message: 'Threshold exceeded',
                timestamp: new Date()
            };
            this.alerts.set(alert.id, alert);
        }
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }

    getAllMonitors() {
        return Array.from(this.monitors.values());
    }
}

module.exports = APIMonitoringAdvanced;

