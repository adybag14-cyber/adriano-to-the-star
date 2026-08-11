/**
 * Gamification Metrics
 * @class GamificationMetrics
 * @description Tracks and analyzes gamification metrics.
 */
class GamificationMetrics {
    constructor() {
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_am_if_ic_at_io_nm_et_ri_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_am_if_ic_at_io_nm_et_ri_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Record metric.
     * @param {string} metricName - Metric name.
     * @param {number} value - Metric value.
     * @param {object} tags - Optional tags.
     */
    recordMetric(metricName, value, tags = {}) {
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, {
                name: metricName,
                values: [],
                average: 0,
                total: 0,
                count: 0
            });
        }

        const metric = this.metrics.get(metricName);
        metric.values.push({ value, tags, timestamp: new Date() });
        metric.total += value;
        metric.count++;
        metric.average = metric.total / metric.count;
    }

    /**
     * Get metric statistics.
     * @param {string} metricName - Metric name.
     * @returns {object} Metric statistics.
     */
    getMetricStats(metricName) {
        const metric = this.metrics.get(metricName);
        if (!metric) return null;

        const sortedValues = [...metric.values].sort((a, b) => a.value - b.value);
        const median = sortedValues[Math.floor(sortedValues.length / 2)]?.value || 0;
        const min = sortedValues[0]?.value || 0;
        const max = sortedValues[sortedValues.length - 1]?.value || 0;

        return {
            name: metricName,
            average: metric.average,
            median,
            min,
            max,
            total: metric.total,
            count: metric.count
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.gamificationMetrics = new GamificationMetrics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamificationMetrics;
}

