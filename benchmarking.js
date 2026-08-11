/**
 * Benchmarking
 * Benchmarks performance against standards
 */

class Benchmarking {
    constructor() {
        this.benchmarks = new Map();
        this.results = [];
        this.init();
    }

    init() {
        this.trackEvent('benchmark_initialized');
    }

    setBenchmark(metricName, benchmark) {
        this.benchmarks.set(metricName, {
            target: benchmark.target,
            excellent: benchmark.excellent,
            good: benchmark.good,
            acceptable: benchmark.acceptable
        });
    }

    compare(metricName, value) {
        const benchmark = this.benchmarks.get(metricName);
        if (!benchmark) return null;

        let rating = 'poor';
        if (value >= benchmark.excellent) rating = 'excellent';
        else if (value >= benchmark.good) rating = 'good';
        else if (value >= benchmark.acceptable) rating = 'acceptable';

        const result = {
            metricName,
            value,
            benchmark: benchmark.target,
            rating,
            difference: value - benchmark.target,
            percentageDiff: ((value - benchmark.target) / benchmark.target) * 100,
            comparedAt: new Date()
        };

        this.results.push(result);
        return result;
    }

    getComparisonReport(metricName) {
        const comparisons = this.results.filter(r => r.metricName === metricName);
        if (comparisons.length === 0) return null;

        const avgValue = comparisons.reduce((sum, c) => sum + c.value, 0) / comparisons.length;
        const benchmark = this.benchmarks.get(metricName);

        return {
            metricName,
            averageValue: Math.round(avgValue * 100) / 100,
            benchmark: benchmark.target,
            averageDifference: avgValue - benchmark.target,
            comparisons: comparisons.length
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`benchmark_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const benchmarking = new Benchmarking();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Benchmarking;
}


