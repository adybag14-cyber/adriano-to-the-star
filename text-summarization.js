/**
 * Text Summarization
 * Automatic text summarization system
 */

class TextSummarization {
    constructor() {
        this.models = new Map();
        this.summaries = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_ex_ts_um_ma_ri_za_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ex_ts_um_ma_ri_za_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            type: modelData.type || 'extractive',
            maxLength: modelData.maxLength || 100,
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Summarization model registered: ${modelId}`);
        return model;
    }

    async summarize(text, modelId = null, options = {}) {
        const model = modelId ? this.models.get(modelId) : Array.from(this.models.values())[0];
        if (!model) {
            throw new Error('Model not found');
        }
        
        const summary = {
            id: `summary_${Date.now()}`,
            text,
            modelId: model.id,
            summary: this.generateSummary(text, model, options),
            compressionRatio: 0,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        summary.compressionRatio = summary.summary.length / text.length;
        
        this.summaries.set(summary.id, summary);
        
        return summary;
    }

    generateSummary(text, model, options) {
        const maxLength = options.maxLength || model.maxLength;
        const sentences = text.split(/[.!?]+/);
        
        if (sentences.length === 0) {
            return text.substring(0, maxLength);
        }
        
        return sentences.slice(0, Math.min(3, sentences.length)).join('. ') + '.';
    }

    getSummary(summaryId) {
        return this.summaries.get(summaryId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.textSummarization = new TextSummarization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextSummarization;
}
