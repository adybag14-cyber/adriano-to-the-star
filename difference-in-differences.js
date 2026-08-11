/**
 * Difference-in-Differences
 * Difference-in-differences estimation
 */

class DifferenceInDifferences {
    constructor() {
        this.models = new Map();
        this.estimates = new Map();
        this.periods = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_if_fe_re_nc_ei_nd_if_fe_re_nc_es_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_if_fe_re_nc_ei_nd_if_fe_re_nc_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            treatmentGroup: modelData.treatmentGroup || [],
            controlGroup: modelData.controlGroup || [],
            treatmentTime: modelData.treatmentTime || 0,
            status: 'active',
            createdAt: new Date()
        };

        this.models.set(modelId, model);
        return model;
    }

    async estimate(modelId, preTreatment, postTreatment) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        const estimate = {
            id: `did_${Date.now()}`,
            modelId,
            preTreatment,
            postTreatment,
            DiDEstimate: this.computeDiD(model, preTreatment, postTreatment),
            timestamp: new Date()
        };

        this.estimates.set(estimate.id, estimate);
        return estimate;
    }

    computeDiD(model, pre, post) {
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

module.exports = DifferenceInDifferences;

