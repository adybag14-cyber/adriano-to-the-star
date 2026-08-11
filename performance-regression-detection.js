/**
 * Performance Regression Detection
 * Performance regression detection system
 */

class PerformanceRegressionDetection {
    constructor() {
        this.detectors = new Map();
        this.baselines = new Map();
        this.regressions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_re_gr_es_si_on_de_te_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_re_gr_es_si_on_de_te_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createDetector(detectorId, detectorData) {
        const detector = {
            id: detectorId,
            ...detectorData,
            name: detectorData.name || detectorId,
            baselineId: detectorData.baselineId || '',
            threshold: detectorData.threshold || 0.1,
            status: 'active',
            createdAt: new Date()
        };
        
        this.detectors.set(detectorId, detector);
        return detector;
    }

    async detect(detectorId, metrics) {
        const detector = this.detectors.get(detectorId);
        if (!detector) {
            throw new Error(`Detector ${detectorId} not found`);
        }

        const baseline = this.baselines.get(detector.baselineId);
        if (!baseline) {
            throw new Error(`Baseline ${detector.baselineId} not found`);
        }

        const regression = {
            id: `reg_${Date.now()}`,
            detectorId,
            metrics,
            detected: this.detectRegression(detector, baseline, metrics),
            timestamp: new Date()
        };

        if (regression.detected) {
            this.regressions.set(regression.id, regression);
        }
        return regression;
    }

    detectRegression(detector, baseline, metrics) {
        return Object.keys(baseline.metrics).some(key => {
            const deviation = Math.abs((metrics[key] || 0) - baseline.metrics[key]) / baseline.metrics[key];
            return deviation > detector.threshold;
        });
    }

    getDetector(detectorId) {
        return this.detectors.get(detectorId);
    }

    getAllDetectors() {
        return Array.from(this.detectors.values());
    }
}

module.exports = PerformanceRegressionDetection;

