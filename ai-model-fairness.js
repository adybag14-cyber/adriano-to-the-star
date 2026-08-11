/**
 * AI Model Fairness
 * AI model fairness assessment and bias detection
 */

class AIModelFairness {
    constructor() {
        this.models = new Map();
        this.assessments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('fairness_initialized');
    }

    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            protectedAttributes: modelData.protectedAttributes || [],
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        this.trackEvent('model_registered', { modelId });
        return model;
    }

    assessFairness(modelId, testData) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const assessment = {
            id: `assessment_${Date.now()}`,
            modelId,
            metrics: {},
            biasDetected: false,
            createdAt: new Date()
        };
        
        model.protectedAttributes.forEach(attribute => {
            const metric = this.calculateFairnessMetric(model, testData, attribute);
            assessment.metrics[attribute] = metric;
            
            if (metric.disparateImpact < 0.8 || metric.disparateImpact > 1.2) {
                assessment.biasDetected = true;
            }
        });
        
        this.assessments.set(assessment.id, assessment);
        this.trackEvent('fairness_assessed', { modelId, biasDetected: assessment.biasDetected });
        
        return assessment;
    }

    calculateFairnessMetric(model, testData, attribute) {
        const positiveRate = {};
        const groups = new Set(testData.map(d => d[attribute]));
        
        groups.forEach(group => {
            const groupData = testData.filter(d => d[attribute] === group);
            const positive = groupData.filter(d => d.prediction === 1).length;
            positiveRate[group] = groupData.length > 0 ? positive / groupData.length : 0;
        });
        
        const rates = Object.values(positiveRate);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const disparateImpact = minRate > 0 ? minRate / maxRate : 0;
        
        return {
            positiveRate,
            disparateImpact,
            fair: disparateImpact >= 0.8 && disparateImpact <= 1.2
        };
    }

    getAssessment(assessmentId) {
        return this.assessments.get(assessmentId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`fairness_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_model_fairness', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.aiModelFairness = new AIModelFairness();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelFairness;
}


