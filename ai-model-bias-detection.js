/**
 * AI Model Bias Detection
 * Bias detection and mitigation in AI models
 */

class AIModelBiasDetection {
    constructor() {
        this.models = new Map();
        this.detections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('bias_detection_initialized');
    }

    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            sensitiveAttributes: modelData.sensitiveAttributes || [],
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        this.trackEvent('model_registered', { modelId });
        return model;
    }

    detectBias(modelId, testData) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const detection = {
            id: `detection_${Date.now()}`,
            modelId,
            biases: [],
            overallBias: 'low',
            createdAt: new Date()
        };
        
        model.sensitiveAttributes.forEach(attribute => {
            const bias = this.analyzeAttributeBias(model, testData, attribute);
            if (bias.detected) {
                detection.biases.push(bias);
            }
        });
        
        if (detection.biases.length > 0) {
            detection.overallBias = detection.biases.some(b => b.severity === 'high') ? 'high' : 'medium';
        }
        
        this.detections.set(detection.id, detection);
        this.trackEvent('bias_detected', { modelId, biasCount: detection.biases.length, overallBias: detection.overallBias });
        
        return detection;
    }

    analyzeAttributeBias(model, testData, attribute) {
        const groups = {};
        
        testData.forEach(item => {
            const group = item[attribute];
            if (!groups[group]) {
                groups[group] = { total: 0, positive: 0, negative: 0 };
            }
            groups[group].total++;
            if (item.prediction === 1) {
                groups[group].positive++;
            } else {
                groups[group].negative++;
            }
        });
        
        const rates = Object.keys(groups).map(group => ({
            group,
            positiveRate: groups[group].total > 0 ? groups[group].positive / groups[group].total : 0
        }));
        
        const minRate = Math.min(...rates.map(r => r.positiveRate));
        const maxRate = Math.max(...rates.map(r => r.positiveRate));
        const disparity = maxRate > 0 ? minRate / maxRate : 0;
        
        return {
            attribute,
            detected: disparity < 0.8,
            severity: disparity < 0.5 ? 'high' : disparity < 0.8 ? 'medium' : 'low',
            disparity,
            groups
        };
    }

    getDetection(detectionId) {
        return this.detections.get(detectionId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bias_detection_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_model_bias_detection', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.aiModelBiasDetection = new AIModelBiasDetection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelBiasDetection;
}


