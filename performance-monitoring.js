/**
 * Performance Monitoring
 * @class PerformanceMonitoring
 * @description Monitors application performance metrics.
 */
class PerformanceMonitoring {
    constructor() {
        this.metrics = new Map();
        this.thresholds = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_mo_ni_to_ri_ng_initialized');
        this.setupThresholds();
        this.startMonitoring();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_mo_ni_to_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupThresholds() {
        this.thresholds.set('pageLoad', { max: 3000, unit: 'ms' });
        this.thresholds.set('apiResponse', { max: 1000, unit: 'ms' });
        this.thresholds.set('memoryUsage', { max: 100 * 1024 * 1024, unit: 'bytes' });
    }

    /**
     * Record metric.
     * @param {string} metricName - Metric name.
     * @param {number} value - Metric value.
     * @param {object} tags - Optional tags.
     */
    recordMetric(metricName, value, tags = {}) {
        const metricId = `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.metrics.set(metricId, {
            id: metricId,
            name: metricName,
            value,
            tags,
            timestamp: new Date()
        });

        // Check threshold
        const threshold = this.thresholds.get(metricName);
        if (threshold && value > threshold.max) {
            console.warn(`Metric threshold exceeded: ${metricName} = ${value} ${threshold.unit}`);
        }
    }

    /**
     * Start monitoring.
     */
    startMonitoring() {
        if (typeof window !== 'undefined' && window.performance) {
            // Monitor page load
            window.addEventListener('load', () => {
                setTimeout(() => {
                    let loadTime = null;

                    try {
                        const navEntry = window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')
                            ? window.performance.getEntriesByType('navigation')[0]
                            : null;

                        if (navEntry && typeof navEntry.loadEventEnd === 'number' && navEntry.loadEventEnd > 0) {
                            loadTime = navEntry.loadEventEnd;
                        }
                    } catch (e) {
                        // Ignore and fallback
                    }

                    try {
                        if (typeof loadTime !== 'number' || !Number.isFinite(loadTime)) {
                            const perfData = window.performance.timing;
                            const navStart = perfData.navigationStart;
                            const loadEnd = perfData.loadEventEnd;
                            if (navStart && loadEnd && loadEnd >= navStart) {
                                loadTime = loadEnd - navStart;
                            }
                        }
                    } catch (e) {
                        // Ignore and fallback
                    }

                    if (typeof loadTime !== 'number' || !Number.isFinite(loadTime) || loadTime < 0) {
                        try {
                            loadTime = Math.max(0, Math.round(window.performance.now()));
                        } catch (e) {
                            loadTime = 0;
                        }
                    }

                    this.recordMetric('pageLoad', loadTime);
                }, 0);
            });

            // Monitor memory
            if (performance.memory) {
                setInterval(() => {
                    this.recordMetric('memoryUsage', performance.memory.usedJSHeapSize);
                }, 60000); // Every minute
            }
        }
    }

    /**
     * Get performance summary.
     * @returns {object} Performance summary.
     */
    getPerformanceSummary() {
        const recentMetrics = Array.from(this.metrics.values())
            .slice(-100); // Last 100 metrics

        const summary = {};
        const metricGroups = {};

        recentMetrics.forEach(metric => {
            if (!metricGroups[metric.name]) {
                metricGroups[metric.name] = [];
            }
            metricGroups[metric.name].push(metric.value);
        });

        for (const [name, values] of Object.entries(metricGroups)) {
            summary[name] = {
                count: values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((a, b) => a + b, 0) / values.length
            };
        }

        return summary;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.performanceMonitoring = new PerformanceMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitoring;
}
