/**
 * AI Model Monitoring
 * AI model performance and health monitoring
 */

class AIModelMonitoring {
    constructor() {
        this.monitors = new Map();
        this.metrics = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('model_monitoring_initialized');
    }

    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            modelId: monitorData.modelId,
            metrics: monitorData.metrics || [],
            thresholds: monitorData.thresholds || {},
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        this.trackEvent('monitor_created', { monitorId });
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
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metrics.set(metric.id, metric);
        
        this.checkThresholds(monitorId, metric);
        
        return metric;
    }

    checkThresholds(monitorId, metric) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            return;
        }
        
        Object.keys(monitor.thresholds).forEach(metricName => {
            const value = metric[metricName];
            const threshold = monitor.thresholds[metricName];
            
            if (value !== undefined && threshold !== undefined) {
                if (value > threshold.max || value < threshold.min) {
                    this.createAlert(monitorId, metricName, value, threshold);
                }
            }
        });
    }

    createAlert(monitorId, metric, value, threshold) {
        const alert = {
            id: `alert_${Date.now()}`,
            monitorId,
            metric,
            value,
            threshold,
            severity: 'medium',
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        this.trackEvent('alert_created', { monitorId, metric, severity: alert.severity });
        return alert;
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }

    getMetrics(monitorId) {
        return Array.from(this.metrics.values())
            .filter(m => m.monitorId === monitorId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`model_monitoring_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_model_monitoring', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.aiModelMonitoring = new AIModelMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelMonitoring;
}


