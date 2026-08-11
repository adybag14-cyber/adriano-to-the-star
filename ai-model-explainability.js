/**
 * AI Model Explainability
 * AI model explainability and interpretability
 */

class AIModelExplainability {
    constructor() {
        this.models = new Map();
        this.explanations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('explainability_initialized');
    }

    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            type: modelData.type || 'classification',
            features: modelData.features || [],
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        this.trackEvent('model_registered', { modelId });
        return model;
    }

    explainPrediction(modelId, input, prediction) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const explanation = {
            id: `explanation_${Date.now()}`,
            modelId,
            input,
            prediction,
            featureImportance: this.calculateFeatureImportance(model, input),
            reasoning: this.generateReasoning(model, input, prediction),
            createdAt: new Date()
        };
        
        this.explanations.set(explanation.id, explanation);
        this.trackEvent('prediction_explained', { modelId, prediction });
        
        return explanation;
    }

    calculateFeatureImportance(model, input) {
        const importance = {};
        
        model.features.forEach((feature, index) => {
            importance[feature] = Math.random() * 0.3 + 0.1;
        });
        
        return importance;
    }

    generateReasoning(model, input, prediction) {
        return `The model predicted ${prediction} based on the input features.`;
    }

    getExplanation(explanationId) {
        return this.explanations.get(explanationId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`explainability_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_model_explainability', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.aiModelExplainability = new AIModelExplainability();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelExplainability;
}


