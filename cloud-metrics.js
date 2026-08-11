/**
 * Cloud Metrics
 * Cloud metrics collection and aggregation
 */

class CloudMetrics {
    constructor() {
        this.metrics = new Map();
        this.aggregations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cloud_metrics_initialized');
    }

    recordMetric(metricId, metricData) {
        const metric = {
            id: metricId,
            ...metricData,
            name: metricData.name || metricId,
            value: metricData.value || 0,
            unit: metricData.unit || '',
            tags: metricData.tags || {},
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metrics.set(metricId, metric);
        
        return metric;
    }

    aggregate(metricName, period = '1h') {
        const metrics = Array.from(this.metrics.values())
            .filter(m => m.name === metricName);
        
        if (metrics.length === 0) {
            return null;
        }
        
        const values = metrics.map(m => m.value);
        
        const aggregation = {
            id: `agg_${Date.now()}`,
            metricName,
            period,
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.aggregations.set(aggregation.id, aggregation);
        
        return aggregation;
    }

    getMetrics(metricName = null, startTime = null, endTime = null) {
        let metrics = Array.from(this.metrics.values());
        
        if (metricName) {
            metrics = metrics.filter(m => m.name === metricName);
        }
        
        if (startTime) {
            metrics = metrics.filter(m => m.timestamp >= startTime);
        }
        
        if (endTime) {
            metrics = metrics.filter(m => m.timestamp <= endTime);
        }
        
        return metrics.sort((a, b) => b.timestamp - a.timestamp);
    }

    getMetric(metricId) {
        return this.metrics.get(metricId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cloud_metrics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cloudMetrics = new CloudMetrics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudMetrics;
}

