/**
 * Infrastructure Performance Monitoring
 * Infrastructure performance monitoring system
 */

class InfrastructurePerformanceMonitoring {
    constructor() {
        this.monitors = new Map();
        this.resources = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('infra_perf_mon_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`infra_perf_mon_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            resources: monitorData.resources || [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        return monitor;
    }

    async collect(monitorId, resourceId, metrics) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error(`Monitor ${monitorId} not found`);
        }

        const metric = {
            id: `metric_${Date.now()}`,
            monitorId,
            resourceId,
            ...metrics,
            timestamp: new Date()
        };

        this.metrics.set(metric.id, metric);
        return metric;
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }

    getAllMonitors() {
        return Array.from(this.monitors.values());
    }
}

module.exports = InfrastructurePerformanceMonitoring;

