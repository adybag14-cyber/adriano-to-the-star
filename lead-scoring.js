/**
 * Lead Scoring
 * Lead scoring and qualification system
 */

class LeadScoring {
    constructor() {
        this.models = new Map();
        this.scores = new Map();
        this.leads = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ea_ds_co_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ea_ds_co_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            weights: modelData.weights || {},
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Lead scoring model registered: ${modelId}`);
        return model;
    }

    registerLead(leadId, leadData) {
        const lead = {
            id: leadId,
            ...leadData,
            name: leadData.name || leadId,
            email: leadData.email || '',
            company: leadData.company || '',
            features: leadData.features || {},
            createdAt: new Date()
        };
        
        this.leads.set(leadId, lead);
        console.log(`Lead registered: ${leadId}`);
        return lead;
    }

    async score(leadId, modelId = null) {
        const lead = this.leads.get(leadId);
        if (!lead) {
            throw new Error('Lead not found');
        }
        
        const model = modelId ? this.models.get(modelId) : Array.from(this.models.values())[0];
        if (!model) {
            throw new Error('Model not found');
        }
        
        const score = {
            id: `score_${Date.now()}`,
            leadId,
            modelId: model.id,
            score: this.calculateScore(lead, model),
            qualification: 'cold',
            priority: 'low',
            recommendations: [],
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        score.qualification = this.qualifyLead(score.score);
        score.priority = this.determinePriority(score.score);
        score.recommendations = this.generateRecommendations(score);
        
        this.scores.set(score.id, score);
        
        return score;
    }

    calculateScore(lead, model) {
        let score = 0;
        
        Object.keys(model.weights).forEach(feature => {
            const value = lead.features[feature] || 0;
            const weight = model.weights[feature] || 0;
            score += value * weight;
        });
        
        return Math.min(100, Math.max(0, score));
    }

    qualifyLead(score) {
        if (score >= 70) return 'hot';
        if (score >= 50) return 'warm';
        return 'cold';
    }

    determinePriority(score) {
        if (score >= 70) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    }

    generateRecommendations(score) {
        if (score.qualification === 'hot') {
            return ['Immediate follow-up', 'Schedule demo', 'Send proposal'];
        } else if (score.qualification === 'warm') {
            return ['Nurture campaign', 'Educational content'];
        }
        return ['General marketing'];
    }

    getLead(leadId) {
        return this.leads.get(leadId);
    }

    getScore(scoreId) {
        return this.scores.get(scoreId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.leadScoring = new LeadScoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeadScoring;
}


