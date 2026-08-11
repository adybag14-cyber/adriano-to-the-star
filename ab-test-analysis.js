/**
 * A/B Test Analysis
 * A/B testing analysis and evaluation
 */

class ABTestAnalysis {
    constructor() {
        this.experiments = new Map();
        this.variants = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.trackEvent('ab_test_analysis_initialized');
    }

    createExperiment(experimentId, experimentData) {
        const experiment = {
            id: experimentId,
            ...experimentData,
            name: experimentData.name || experimentId,
            variants: [],
            status: 'draft',
            createdAt: new Date()
        };
        
        this.experiments.set(experimentId, experiment);
        this.trackEvent('experiment_created', { experimentId, name: experimentData.name });
        return experiment;
    }

    createVariant(experimentId, variantId, variantData) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error('Experiment not found');
        }
        
        const variant = {
            id: variantId,
            experimentId,
            ...variantData,
            name: variantData.name || variantId,
            type: variantData.type || 'control',
            participants: 0,
            conversions: 0,
            createdAt: new Date()
        };
        
        this.variants.set(variantId, variant);
        experiment.variants.push(variantId);
        
        return variant;
    }

    async analyze(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error('Experiment not found');
        }
        
        const result = {
            id: `result_${Date.now()}`,
            experimentId,
            status: 'analyzing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.results.set(result.id, result);
        
        const variants = experiment.variants.map(id => this.variants.get(id));
        const analysis = this.performAnalysis(variants);
        
        result.status = 'completed';
        result.completedAt = new Date();
        result.variants = analysis.variants;
        result.winner = analysis.winner;
        result.significance = analysis.significance;
        result.confidence = analysis.confidence;
        
        this.trackEvent('analysis_completed', { experimentId, winner: result.winner?.id, significance: result.significance });
        return result;
    }

    performAnalysis(variants) {
        const analyzed = variants.map(variant => {
            const conversionRate = variant.participants > 0 
                ? (variant.conversions / variant.participants) * 100 
                : 0;
            
            return {
                id: variant.id,
                name: variant.name,
                participants: variant.participants,
                conversions: variant.conversions,
                conversionRate: conversionRate.toFixed(2) + '%'
            };
        });
        
        const control = analyzed.find(v => v.name === 'control');
        const treatment = analyzed.find(v => v.name === 'treatment');
        
        let winner = null;
        let significance = false;
        let confidence = 0;
        
        if (control && treatment) {
            const improvement = ((treatment.conversionRate - control.conversionRate) / control.conversionRate) * 100;
            significance = Math.abs(improvement) > 5;
            confidence = significance ? 95 : 85;
            winner = treatment.conversionRate > control.conversionRate ? treatment : control;
        }
        
        return {
            variants: analyzed,
            winner,
            significance,
            confidence: confidence + '%'
        };
    }

    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ab_analysis_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ab_test_analysis', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.abTestAnalysis = new ABTestAnalysis();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABTestAnalysis;
}
