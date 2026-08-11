/**
 * Sentiment Analysis Advanced
 * Advanced sentiment analysis with multiple models and techniques
 */

class SentimentAnalysisAdvanced {
    constructor() {
        this.models = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_en_ti_me_nt_an_al_ys_is_ad_va_nc_ed_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_en_ti_me_nt_an_al_ys_is_ad_va_nc_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelType, config = {}) {
        const model = {
            id: modelId,
            type: modelType,
            config,
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Sentiment model registered: ${modelId}`);
        return model;
    }

    analyzeSentiment(text, modelId = null) {
        let result;
        
        if (modelId) {
            const model = this.models.get(modelId);
            if (!model) {
                throw new Error('Model not found');
            }
            result = this.performSentimentAnalysis(text, model);
        } else {
            result = this.performSentimentAnalysis(text);
        }
        
        const analysisId = `analysis_${Date.now()}`;
        this.analyses.set(analysisId, {
            id: analysisId,
            text,
            ...result,
            createdAt: new Date()
        });
        
        return result;
    }

    performSentimentAnalysis(text, model = null) {
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful', 'fantastic', 'brilliant', 'outstanding'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'worst', 'horrible', 'disgusting', 'pathetic', 'dreadful'];
        const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'completely'];
        
        const lowerText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;
        let intensity = 1;
        
        const words = lowerText.split(/\s+/);
        
        words.forEach((word, index) => {
            if (intensifiers.includes(word) && index < words.length - 1) {
                intensity = 1.5;
            } else {
                if (positiveWords.includes(word)) {
                    positiveScore += intensity;
                } else if (negativeWords.includes(word)) {
                    negativeScore += intensity;
                }
                intensity = 1;
            }
        });
        
        const totalScore = positiveScore + negativeScore;
        let score = 0.5;
        
        if (totalScore > 0) {
            score = 0.5 + ((positiveScore - negativeScore) / (totalScore * 2));
        }
        
        let sentiment = 'neutral';
        const confidence = Math.abs(score - 0.5) * 2;
        
        if (score > 0.6) {
            sentiment = 'positive';
        } else if (score < 0.4) {
            sentiment = 'negative';
        }
        
        const emotions = this.detectEmotions(text);
        
        return {
            sentiment,
            score,
            confidence,
            positiveScore,
            negativeScore,
            emotions
        };
    }

    detectEmotions(text) {
        const emotionKeywords = {
            joy: ['happy', 'joy', 'delighted', 'ecstatic', 'cheerful'],
            sadness: ['sad', 'depressed', 'melancholy', 'sorrowful', 'unhappy'],
            anger: ['angry', 'furious', 'enraged', 'irritated', 'annoyed'],
            fear: ['afraid', 'scared', 'terrified', 'worried', 'anxious'],
            surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned']
        };
        
        const lowerText = text.toLowerCase();
        const emotions = {};
        
        Object.keys(emotionKeywords).forEach(emotion => {
            const count = emotionKeywords[emotion].filter(keyword => lowerText.includes(keyword)).length;
            if (count > 0) {
                emotions[emotion] = count;
            }
        });
        
        return emotions;
    }

    batchAnalyze(texts, modelId = null) {
        const results = texts.map(text => this.analyzeSentiment(text, modelId));
        
        const positive = results.filter(r => r.sentiment === 'positive').length;
        const negative = results.filter(r => r.sentiment === 'negative').length;
        const neutral = results.filter(r => r.sentiment === 'neutral').length;
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        
        return {
            total: texts.length,
            positive,
            negative,
            neutral,
            avgScore,
            results
        };
    }

    compareModels(texts, modelIds) {
        const comparisons = {};
        
        modelIds.forEach(modelId => {
            const results = texts.map(text => this.analyzeSentiment(text, modelId));
            comparisons[modelId] = {
                results,
                avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
                positive: results.filter(r => r.sentiment === 'positive').length,
                negative: results.filter(r => r.sentiment === 'negative').length,
                neutral: results.filter(r => r.sentiment === 'neutral').length
            };
        });
        
        return comparisons;
    }

    getAnalysis(analysisId) {
        return this.analyses.get(analysisId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.sentimentAnalysisAdvanced = new SentimentAnalysisAdvanced();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SentimentAnalysisAdvanced;
}
