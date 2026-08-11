class AnalyticsStatsAggregator {
    constructor() {
        this.counters = new Map();
        this.metrics = new Map();
        this.trackEvent('stats_aggregator_initialized');
    }
    increment(key, amount = 1) {
        const v = this.counters.get(key) || 0;
        this.counters.set(key, v + amount);
        return this.counters.get(key);
    }
    setMetric(key, value) {
        this.metrics.set(key, value);
        return value;
    }
    getSnapshot() {
        const counters = {};
        const metrics = {};
        this.counters.forEach((v, k) => { counters[k] = v; });
        this.metrics.forEach((v, k) => { metrics[k] = v; });
        return { counters, metrics, timestamp: new Date() };
    }
    reset() {
        this.counters.clear();
        this.metrics.clear();
    }
    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`stats_aggregator_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}
const analyticsStatsAggregator = new AnalyticsStatsAggregator();
if (typeof window !== 'undefined') {
    window.analyticsStatsAggregator = analyticsStatsAggregator;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsStatsAggregator;
}
