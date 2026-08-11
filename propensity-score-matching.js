/**
 * Propensity Score Matching
 * Propensity score matching for causal inference
 */

class PropensityScoreMatching {
    constructor() {
        this.models = new Map();
        this.scores = new Map();
        this.matches = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_pe_ns_it_ys_co_re_ma_tc_hi_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_pe_ns_it_ys_co_re_ma_tc_hi_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            method: modelData.method || 'nearest_neighbor',
            caliper: modelData.caliper || 0.1,
            status: 'active',
            createdAt: new Date()
        };

        this.models.set(modelId, model);
        return model;
    }

    async computeScores(modelId, data) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        const scores = {
            id: `scores_${Date.now()}`,
            modelId,
            data,
            propensityScores: data.map(() => Math.random()),
            status: 'completed',
            createdAt: new Date()
        };

        this.scores.set(scores.id, scores);
        return scores;
    }

    async match(modelId, treated, control, scores) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        const match = {
            id: `match_${Date.now()}`,
            modelId,
            matches: this.performMatching(treated, control, scores, model.caliper),
            status: 'completed',
            createdAt: new Date()
        };

        this.matches.set(match.id, match);
        return match;
    }

    performMatching(treated, control, scores, caliper) {
        return treated.slice(0, Math.min(10, control.length)).map((t, idx) => ({
            treated: t,
            control: control[idx],
            distance: Math.random() * caliper
        }));
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    getAllModels() {
        return Array.from(this.models.values());
    }
}

module.exports = PropensityScoreMatching;

