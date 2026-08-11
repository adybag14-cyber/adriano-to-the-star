/**
 * Edge Performance Metrics
 * Edge device performance metrics collection
 */

class EdgePerformanceMetrics {
    constructor() {
        this.metrics = new Map();
        this.devices = new Map();
        this.analytics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_perf_metrics_initialized');
    }

    async collect(deviceId, metricData) {
        const metric = {
            id: `metric_${Date.now()}`,
            deviceId,
            ...metricData,
            latency: metricData.latency || 0,
            throughput: metricData.throughput || 0,
            timestamp: new Date()
        };

        this.metrics.set(metric.id, metric);
        return metric;
    }

    async analyze(deviceId, timeRange) {
        const deviceMetrics = Array.from(this.metrics.values())
            .filter(m => m.deviceId === deviceId);

        return {
            deviceId,
            timeRange,
            averageLatency: deviceMetrics.reduce((sum, m) => sum + m.latency, 0) / deviceMetrics.length || 0,
            averageThroughput: deviceMetrics.reduce((sum, m) => sum + m.throughput, 0) / deviceMetrics.length || 0,
            timestamp: new Date()
        };
    }

    getMetric(metricId) {
        return this.metrics.get(metricId);
    }

    getAllMetrics() {
        return Array.from(this.metrics.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_perf_metrics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = EdgePerformanceMetrics;

