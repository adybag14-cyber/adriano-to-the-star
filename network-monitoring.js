/**
 * Network Monitoring
 * Blockchain network monitoring system
 */

class NetworkMonitoring {
    constructor() {
        this.monitors = new Map();
        this.metrics = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_et_wo_rk_mo_ni_to_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_et_wo_rk_mo_ni_to_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            networkId: monitorData.networkId,
            metrics: monitorData.metrics || [],
            thresholds: monitorData.thresholds || {},
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Network monitor created: ${monitorId}`);
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
        
        const threshold = monitor.thresholds[metric.name];
        if (threshold) {
            if (metric.value > threshold.max || metric.value < threshold.min) {
                this.createAlert(monitorId, metric, threshold);
            }
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

    getMetrics(monitorId, startDate = null, endDate = null) {
        let metrics = Array.from(this.metrics.values())
            .filter(m => m.monitorId === monitorId);
        
        if (startDate) {
            metrics = metrics.filter(m => m.timestamp >= startDate);
        }
        
        if (endDate) {
            metrics = metrics.filter(m => m.timestamp <= endDate);
        }
        
        return metrics;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.networkMonitoring = new NetworkMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkMonitoring;
}


