/**
 * Cloud Monitoring
 * Cloud resource monitoring
 */

class CloudMonitoring {
    constructor() {
        this.monitors = new Map();
        this.metrics = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cloud_mon_initialized');
    }

    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            resourceId: monitorData.resourceId || '',
            metrics: monitorData.metrics || [],
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Cloud monitor created: ${monitorId}`);
        return monitor;
    }

    recordMetric(monitorId, metricData) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }
        
        const metric = {
            id: `metric_${Date.now()}`,
            monitorId,
            ...metricData,
            name: metricData.name || 'unknown',
            value: metricData.value || 0,
            unit: metricData.unit || '',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metrics.set(metric.id, metric);
        
        this.checkThresholds(monitor, metric);
        
        return metric;
    }

    checkThresholds(monitor, metric) {
        const threshold = monitor.thresholds?.[metric.name];
        if (threshold && metric.value > threshold) {
            this.createAlert(monitor.id, metric, threshold);
        }
    }

    createAlert(monitorId, metric, threshold) {
        const alert = {
            id: `alert_${Date.now()}`,
            monitorId,
            metricId: metric.id,
            metricName: metric.name,
            value: metric.value,
            threshold,
            severity: 'medium',
            message: `Metric ${metric.name} exceeded threshold`,
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        return alert;
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }

    getMetric(metricId) {
        return this.metrics.get(metricId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cloud_mon_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cloudMonitoring = new CloudMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudMonitoring;
}

