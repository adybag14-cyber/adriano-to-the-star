/**
 * Neural Network Analytics
 * Analytics and insights for neural network models
 */

class NeuralNetworkAnalytics {
    constructor() {
        this.models = new Map();
        this.trainingHistory = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_eu_ra_ln_et_wo_rk_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_eu_ra_ln_et_wo_rk_an_al_yt_ic_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            layers: modelData.layers || [],
            parameters: modelData.parameters || 0,
            createdAt: new Date(),
            trainingHistory: []
        };
        
        this.models.set(modelId, model);
        console.log(`Neural network model registered: ${modelId}`);
        return model;
    }

    recordTrainingStep(modelId, epoch, metrics) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const step = {
            epoch,
            ...metrics,
            timestamp: new Date()
        };
        
        model.trainingHistory.push(step);
        
        const historyId = `history_${Date.now()}`;
        this.trainingHistory.set(historyId, {
            id: historyId,
            modelId,
            ...step
        });
        
        return step;
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

    calculateLoss(predictions, actuals, lossType = 'mse') {
        if (predictions.length !== actuals.length) {
            throw new Error('Predictions and actuals must have the same length');
        }
        
        if (lossType === 'mse') {
            return predictions.reduce((sum, pred, i) => {
                if (Array.isArray(pred) && Array.isArray(actuals[i])) {
                    const diff = pred.reduce((s, p, j) => s + Math.pow(p - actuals[i][j], 2), 0);
                    return sum + diff / pred.length;
                }
                return sum + Math.pow(pred - actuals[i], 2);
            }, 0) / predictions.length;
        } else if (lossType === 'cross_entropy') {
            let loss = 0;
            for (let i = 0; i < predictions.length; i++) {
                if (Array.isArray(predictions[i]) && Array.isArray(actuals[i])) {
                    for (let j = 0; j < predictions[i].length; j++) {
                        const pred = Math.max(predictions[i][j], 1e-15);
                        loss -= actuals[i][j] * Math.log(pred);
                    }
                }
            }
            return loss / predictions.length;
        }
        
        return 0;
    }

    analyzeGradients(modelId, gradients) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const analysis = {
            meanGradient: 0,
            maxGradient: -Infinity,
            minGradient: Infinity,
            gradientVariance: 0,
            vanishingGradients: 0,
            explodingGradients: 0
        };
        
        let sum = 0;
        let count = 0;
        
        gradients.forEach(gradient => {
            if (Array.isArray(gradient)) {
                gradient.forEach(g => {
                    const absG = Math.abs(g);
                    sum += absG;
                    count++;
                    analysis.maxGradient = Math.max(analysis.maxGradient, absG);
                    analysis.minGradient = Math.min(analysis.minGradient, absG);
                    if (absG < 0.001) {
                        analysis.vanishingGradients++;
                    }
                    if (absG > 10) {
                        analysis.explodingGradients++;
                    }
                });
            } else {
                const absG = Math.abs(gradient);
                sum += absG;
                count++;
                analysis.maxGradient = Math.max(analysis.maxGradient, absG);
                analysis.minGradient = Math.min(analysis.minGradient, absG);
                if (absG < 0.001) {
                    analysis.vanishingGradients++;
                }
                if (absG > 10) {
                    analysis.explodingGradients++;
                }
            }
        });
        
        if (count > 0) {
            analysis.meanGradient = sum / count;
            
            let varianceSum = 0;
            gradients.forEach(gradient => {
                if (Array.isArray(gradient)) {
                    gradient.forEach(g => {
                        varianceSum += Math.pow(Math.abs(g) - analysis.meanGradient, 2);
                    });
                } else {
                    varianceSum += Math.pow(Math.abs(gradient) - analysis.meanGradient, 2);
                }
            });
            analysis.gradientVariance = varianceSum / count;
        }
        
        return analysis;
    }

    calculateLearningCurve(modelId) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const history = model.trainingHistory;
        if (history.length === 0) {
            return { epochs: [], trainLoss: [], valLoss: [], trainAcc: [], valAcc: [] };
        }
        
        return {
            epochs: history.map(h => h.epoch),
            trainLoss: history.map(h => h.trainLoss || 0),
            valLoss: history.map(h => h.valLoss || 0),
            trainAcc: history.map(h => h.trainAcc || 0),
            valAcc: history.map(h => h.valAcc || 0)
        };
    }

    detectOverfitting(modelId) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const history = model.trainingHistory;
        if (history.length < 2) {
            return { isOverfitting: false, confidence: 0 };
        }
        
        const recent = history.slice(-10);
        const avgTrainLoss = recent.reduce((sum, h) => sum + (h.trainLoss || 0), 0) / recent.length;
        const avgValLoss = recent.reduce((sum, h) => sum + (h.valLoss || 0), 0) / recent.length;
        
        const gap = avgValLoss - avgTrainLoss;
        const isOverfitting = gap > avgTrainLoss * 0.2;
        
        return {
            isOverfitting,
            trainLoss: avgTrainLoss,
            valLoss: avgValLoss,
            gap,
            confidence: Math.min(Math.abs(gap) / avgTrainLoss, 1)
        };
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    getTrainingHistory(modelId) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        return model.trainingHistory;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.neuralNetworkAnalytics = new NeuralNetworkAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuralNetworkAnalytics;
}

