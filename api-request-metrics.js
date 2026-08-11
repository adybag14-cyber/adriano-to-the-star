/**
 * API Request Metrics
 * Collect and analyze API request metrics
 */

class APIRequestMetrics {
    constructor() {
        this.metrics = new Map();
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.init();
    }

    init() {
        this.trackEvent('metrics_initialized');
    }

    incrementCounter(name, labels = {}, value = 1) {
        const key = this.getMetricKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
        console.log(`Counter incremented: ${name}`);
    }

    setGauge(name, labels = {}, value) {
        const key = this.getMetricKey(name, labels);
        this.gauges.set(key, value);
        console.log(`Gauge set: ${name} = ${value}`);
    }

    recordHistogram(name, labels = {}, value) {
        const key = this.getMetricKey(name, labels);
        const histogram = this.histograms.get(key) || {
            values: [],
            sum: 0,
            count: 0,
            min: Infinity,
            max: -Infinity
        };
        
        histogram.values.push(value);
        histogram.sum += value;
        histogram.count++;
        histogram.min = Math.min(histogram.min, value);
        histogram.max = Math.max(histogram.max, value);
        
        this.histograms.set(key, histogram);
        console.log(`Histogram recorded: ${name} = ${value}`);
    }

    getMetricKey(name, labels) {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
        return labelStr ? `${name}{${labelStr}}` : name;
    }

    recordRequestMetrics(endpoint, method, duration, statusCode) {
        this.incrementCounter('api_requests_total', { endpoint, method, status: statusCode });
        this.recordHistogram('api_request_duration_ms', { endpoint, method }, duration);
        this.setGauge('api_requests_active', { endpoint, method }, 1);
    }

    getCounter(name, labels = {}) {
        const key = this.getMetricKey(name, labels);
        return this.counters.get(key) || 0;
    }

    getGauge(name, labels = {}) {
        const key = this.getMetricKey(name, labels);
        return this.gauges.get(key);
    }

    getHistogram(name, labels = {}) {
        const key = this.getMetricKey(name, labels);
        const histogram = this.histograms.get(key);
        if (!histogram) {
            return null;
        }
        
        const sorted = [...histogram.values].sort((a, b) => a - b);
        const p50 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0;
        const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
        const p99 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0;
        
        return {
            count: histogram.count,
            sum: histogram.sum,
            min: histogram.min === Infinity ? 0 : histogram.min,
            max: histogram.max === -Infinity ? 0 : histogram.max,
            avg: histogram.count > 0 ? histogram.sum / histogram.count : 0,
            p50,
            p95,
            p99
        };
    }

    getAllMetrics() {
        return {
            counters: Array.from(this.counters.entries()).map(([key, value]) => ({
                name: key,
                value
            })),
            gauges: Array.from(this.gauges.entries()).map(([key, value]) => ({
                name: key,
                value
            })),
            histograms: Array.from(this.histograms.entries()).map(([key, histogram]) => ({
                name: key,
                ...this.getHistogram(key)
            }))
        };
    }

    resetMetrics() {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`metrics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestMetrics = new APIRequestMetrics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestMetrics;
}

