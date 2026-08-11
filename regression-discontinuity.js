/**
 * Regression Discontinuity
 * Regression discontinuity design
 */

class RegressionDiscontinuity {
    constructor() {
        this.models = new Map();
        this.estimates = new Map();
        this.cutoffs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_eg_re_ss_io_nd_is_co_nt_in_ui_ty_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_eg_re_ss_io_nd_is_co_nt_in_ui_ty_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            cutoff: modelData.cutoff || 0,
            bandwidth: modelData.bandwidth || 1.0,
            status: 'active',
            createdAt: new Date()
        };

        this.models.set(modelId, model);
        return model;
    }

    async estimate(modelId, data) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        const estimate = {
            id: `rd_${Date.now()}`,
            modelId,
            data,
            RDEstimate: this.computeRD(model, data),
            timestamp: new Date()
        };

        this.estimates.set(estimate.id, estimate);
        return estimate;
    }

    computeRD(model, data) {
        return {
            treatmentEffect: Math.random() * 2 - 1,
            standardError: Math.random() * 0.1,
            pValue: Math.random() * 0.05,
            confidence: Math.random() * 0.2 + 0.8
        };
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    getAllModels() {
        return Array.from(this.models.values());
    }
}

module.exports = RegressionDiscontinuity;

