/**
 * Image Recognition Analytics
 * Analytics for image recognition and computer vision models
 */

class ImageRecognitionAnalytics {
    constructor() {
        this.models = new Map();
        this.predictions = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ma_ge_re_co_gn_it_io_na_na_ly_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ma_ge_re_co_gn_it_io_na_na_ly_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            architecture: modelData.architecture || 'cnn',
            classes: modelData.classes || [],
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Image recognition model registered: ${modelId}`);
        return model;
    }

    analyzePredictions(modelId, predictions, actuals) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        if (predictions.length !== actuals.length) {
            throw new Error('Predictions and actuals must have the same length');
        }
        
        const accuracy = this.calculateAccuracy(predictions, actuals);
        const topKAccuracy = this.calculateTopKAccuracy(predictions, actuals, 5);
        const confusionMatrix = this.calculateConfusionMatrix(predictions, actuals, model.classes);
        
        const analysis = {
            accuracy,
            topKAccuracy,
            confusionMatrix,
            perClassMetrics: this.calculatePerClassMetrics(predictions, actuals, model.classes)
        };
        
        const metricId = `metric_${Date.now()}`;
        this.metrics.set(metricId, {
            id: metricId,
            modelId,
            ...analysis,
            createdAt: new Date()
        });
        
        return analysis;
    }

    calculateAccuracy(predictions, actuals) {
        let correct = 0;
        for (let i = 0; i < predictions.length; i++) {
            const pred = Array.isArray(predictions[i]) 
                ? predictions[i].indexOf(Math.max(...predictions[i]))
                : predictions[i];
            const actual = Array.isArray(actuals[i])
                ? actuals[i].indexOf(Math.max(...actuals[i]))
                : actuals[i];
            
            if (pred === actual) {
                correct++;
            }
        }
        return correct / predictions.length;
    }

    calculateTopKAccuracy(predictions, actuals, k = 5) {
        let correct = 0;
        for (let i = 0; i < predictions.length; i++) {
            const actual = Array.isArray(actuals[i])
                ? actuals[i].indexOf(Math.max(...actuals[i]))
                : actuals[i];
            
            if (Array.isArray(predictions[i])) {
                const sorted = predictions[i].map((val, idx) => ({ val, idx }))
                    .sort((a, b) => b.val - a.val)
                    .slice(0, k);
                const topKIndices = sorted.map(item => item.idx);
                if (topKIndices.includes(actual)) {
                    correct++;
                }
            }
        }
        return correct / predictions.length;
    }

    calculateConfusionMatrix(predictions, actuals, classes) {
        const matrix = {};
        
        classes.forEach(actualClass => {
            matrix[actualClass] = {};
            classes.forEach(predClass => {
                matrix[actualClass][predClass] = 0;
            });
        });
        
        for (let i = 0; i < predictions.length; i++) {
            const pred = Array.isArray(predictions[i]) 
                ? predictions[i].indexOf(Math.max(...predictions[i]))
                : predictions[i];
            const actual = Array.isArray(actuals[i])
                ? actuals[i].indexOf(Math.max(...actuals[i]))
                : actuals[i];
            
            const predClass = classes[pred] || pred;
            const actualClass = classes[actual] || actual;
            
            if (!matrix[actualClass]) {
                matrix[actualClass] = {};
            }
            if (!matrix[actualClass][predClass]) {
                matrix[actualClass][predClass] = 0;
            }
            matrix[actualClass][predClass]++;
        }
        
        return matrix;
    }

    calculatePerClassMetrics(predictions, actuals, classes) {
        const metrics = {};
        
        classes.forEach((className, classIndex) => {
            let truePositives = 0;
            let falsePositives = 0;
            let falseNegatives = 0;
            
            for (let i = 0; i < predictions.length; i++) {
                const pred = Array.isArray(predictions[i]) 
                    ? predictions[i].indexOf(Math.max(...predictions[i]))
                    : predictions[i];
                const actual = Array.isArray(actuals[i])
                    ? actuals[i].indexOf(Math.max(...actuals[i]))
                    : actuals[i];
                
                if (pred === classIndex && actual === classIndex) {
                    truePositives++;
                } else if (pred === classIndex && actual !== classIndex) {
                    falsePositives++;
                } else if (pred !== classIndex && actual === classIndex) {
                    falseNegatives++;
                }
            }
            
            const precision = (truePositives + falsePositives) > 0 
                ? truePositives / (truePositives + falsePositives) 
                : 0;
            const recall = (truePositives + falseNegatives) > 0 
                ? truePositives / (truePositives + falseNegatives) 
                : 0;
            const f1Score = (precision + recall) > 0 
                ? 2 * (precision * recall) / (precision + recall) 
                : 0;
            
            metrics[className] = {
                precision,
                recall,
                f1Score,
                truePositives,
                falsePositives,
                falseNegatives
            };
        });
        
        return metrics;
    }

    visualizeActivations(modelId, layerIndex, activations) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        return {
            layerIndex,
            activations: activations.map(act => Math.max(0, act)),
            shape: Array.isArray(activations[0]) ? [activations.length, activations[0].length] : [activations.length]
        };
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.imageRecognitionAnalytics = new ImageRecognitionAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageRecognitionAnalytics;
}

