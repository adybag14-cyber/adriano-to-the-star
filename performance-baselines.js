/**
 * Performance Baselines
 * Performance baseline management
 */

class PerformanceBaselines {
    constructor() {
        this.baselines = new Map();
        this.measurements = new Map();
        this.deviations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_ba_se_li_ne_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_ba_se_li_ne_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createBaseline(baselineId, baselineData) {
        const baseline = {
            id: baselineId,
            ...baselineData,
            name: baselineData.name || baselineId,
            metrics: baselineData.metrics || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.baselines.set(baselineId, baseline);
        return baseline;
    }

    async compare(baselineId, metrics) {
        const baseline = this.baselines.get(baselineId);
        if (!baseline) {
            throw new Error(`Baseline ${baselineId} not found`);
        }

        const deviation = {
            id: `dev_${Date.now()}`,
            baselineId,
            metrics,
            deviations: this.computeDeviations(baseline, metrics),
            timestamp: new Date()
        };

        this.deviations.set(deviation.id, deviation);
        return deviation;
    }

    computeDeviations(baseline, metrics) {
        return Object.keys(baseline.metrics).map(key => ({
            metric: key,
            baseline: baseline.metrics[key],
            actual: metrics[key] || 0,
            deviation: ((metrics[key] || 0) - baseline.metrics[key]) / baseline.metrics[key] * 100
        }));
    }

    getBaseline(baselineId) {
        return this.baselines.get(baselineId);
    }

    getAllBaselines() {
        return Array.from(this.baselines.values());
    }
}

module.exports = PerformanceBaselines;
