/**
 * Deep Learning Analytics
 * Advanced analytics for deep learning models
 */

class DeepLearningAnalytics {
    constructor() {
        this.models = new Map();
        this.experiments = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ee_pl_ea_rn_in_ga_na_ly_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ee_pl_ea_rn_in_ga_na_ly_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            architecture: modelData.architecture || 'feedforward',
            layers: modelData.layers || [],
            parameters: modelData.parameters || 0,
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Deep learning model registered: ${modelId}`);
        return model;
    }

    trackTraining(modelId, epoch, metrics) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        if (!model.trainingMetrics) {
            model.trainingMetrics = [];
        }
        
        model.trainingMetrics.push({
            epoch,
            ...metrics,
            timestamp: new Date()
        });
        
        return model.trainingMetrics;
    }

    analyzeModelPerformance(modelId, testData, predictions) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const actuals = testData.map(d => d.target || d.label);
        
        const accuracy = this.calculateAccuracy(predictions, actuals);
        const precision = this.calculatePrecision(predictions, actuals);
        const recall = this.calculateRecall(predictions, actuals);
        const f1Score = this.calculateF1Score(precision, recall);
        
        const analysis = {
            accuracy,
            precision,
            recall,
            f1Score,
            confusionMatrix: this.calculateConfusionMatrix(predictions, actuals)
        };
        
        model.performanceMetrics = analysis;
        
        return analysis;
    }

    calculateAccuracy(predictions, actuals) {
        if (predictions.length !== actuals.length) {
            throw new Error('Predictions and actuals must have the same length');
        }
        
        let correct = 0;
        for (let i = 0; i < predictions.length; i++) {
            if (Array.isArray(predictions[i]) && Array.isArray(actuals[i])) {
                const predIndex = predictions[i].indexOf(Math.max(...predictions[i]));
                const actualIndex = actuals[i].indexOf(Math.max(...actuals[i]));
                if (predIndex === actualIndex) {
                    correct++;
                }
            } else if (predictions[i] === actuals[i]) {
                correct++;
            }
        }
        
        return correct / predictions.length;
    }

    calculatePrecision(predictions, actuals, positiveClass = 1) {
        let truePositives = 0;
        let falsePositives = 0;
        
        for (let i = 0; i < predictions.length; i++) {
            const pred = Array.isArray(predictions[i]) 
                ? predictions[i].indexOf(Math.max(...predictions[i]))
                : predictions[i];
            const actual = Array.isArray(actuals[i])
                ? actuals[i].indexOf(Math.max(...actuals[i]))
                : actuals[i];
            
            if (pred === positiveClass) {
                if (actual === positiveClass) {
                    truePositives++;
                } else {
                    falsePositives++;
                }
            }
        }
        
        const denominator = truePositives + falsePositives;
        return denominator > 0 ? truePositives / denominator : 0;
    }

    calculateRecall(predictions, actuals, positiveClass = 1) {
        let truePositives = 0;
        let falseNegatives = 0;
        
        for (let i = 0; i < predictions.length; i++) {
            const pred = Array.isArray(predictions[i]) 
                ? predictions[i].indexOf(Math.max(...predictions[i]))
                : predictions[i];
            const actual = Array.isArray(actuals[i])
                ? actuals[i].indexOf(Math.max(...actuals[i]))
                : actuals[i];
            
            if (actual === positiveClass) {
                if (pred === positiveClass) {
                    truePositives++;
                } else {
                    falseNegatives++;
                }
            }
        }
        
        const denominator = truePositives + falseNegatives;
        return denominator > 0 ? truePositives / denominator : 0;
    }

    calculateF1Score(precision, recall) {
        if (precision + recall === 0) {
            return 0;
        }
        return 2 * (precision * recall) / (precision + recall);
    }

    calculateConfusionMatrix(predictions, actuals) {
        const classes = [...new Set(actuals)];
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
            
            if (!matrix[actual]) {
                matrix[actual] = {};
            }
            if (!matrix[actual][pred]) {
                matrix[actual][pred] = 0;
            }
            matrix[actual][pred]++;
        }
        
        return matrix;
    }

    visualizeActivation(modelId, layerIndex, input) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        return {
            layerIndex,
            activations: input.map(val => Math.max(0, val))
        };
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.deepLearningAnalytics = new DeepLearningAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeepLearningAnalytics;
}

