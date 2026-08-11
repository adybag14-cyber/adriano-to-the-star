/**
 * Custom Metrics Tracking
 * @class CustomMetricsTracking
 * @description Allows tracking of custom business metrics.
 */
class CustomMetricsTracking {
    constructor() {
        this.metrics = new Map();
        this.values = new Map();
        this.init();
    }

    init() {
        this.trackTelemetry('custom_metrics_initialized');
    }

    /**
     * Define custom metric.
     * @param {string} metricId - Metric identifier.
     * @param {object} metricData - Metric data.
     */
    defineMetric(metricId, metricData) {
        this.metrics.set(metricId, {
            ...metricData,
            id: metricId,
            name: metricData.name,
            type: metricData.type || 'counter', // counter, gauge, histogram
            unit: metricData.unit || '',
            createdAt: new Date()
        });
        console.log(`Custom metric defined: ${metricId}`);
    }

    /**
     * Record metric value.
     * @param {string} metricId - Metric identifier.
     * @param {number} value - Metric value.
     * @param {object} tags - Optional tags.
     */
    recordValue(metricId, value, tags = {}) {
        const metric = this.metrics.get(metricId);
        if (!metric) {
            throw new Error(`Metric not found: ${metricId}`);
        }

        const valueKey = `${metricId}_${Date.now()}`;
        this.values.set(valueKey, {
            metricId,
            value,
            tags,
            timestamp: new Date()
        });

        console.log(`Metric value recorded: ${metricId} = ${value}`);
    }

    /**
     * Get metric statistics.
     * @param {string} metricId - Metric identifier.
     * @param {Date} startDate - Start date.
     * @param {Date} endDate - End date.
     * @returns {object} Metric statistics.
     */
    getStatistics(metricId, startDate, endDate) {
        const metricValues = Array.from(this.values.values())
            .filter(v => v.metricId === metricId && 
                        v.timestamp >= startDate && 
                        v.timestamp <= endDate)
            .map(v => v.value);

        if (metricValues.length === 0) {
            return { count: 0, min: 0, max: 0, avg: 0, sum: 0 };
        }

        return {
            count: metricValues.length,
            min: Math.min(...metricValues),
            max: Math.max(...metricValues),
            avg: metricValues.reduce((a, b) => a + b, 0) / metricValues.length,
            sum: metricValues.reduce((a, b) => a + b, 0)
        };
    }

    trackTelemetry(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`custom_metrics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.customMetricsTracking = new CustomMetricsTracking();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomMetricsTracking;
}

