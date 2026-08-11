/**
 * Test Result Analysis
 * Analyzes A/B test results
 */

class TestResultAnalysis {
    constructor() {
        this.analyses = [];
        this.init();
    }

    init() {
        this.trackEvent('t_es_tr_es_ul_ta_na_ly_si_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_es_tr_es_ul_ta_na_ly_si_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    analyzeTestResults(testId, variants) {
        const analysis = {
            testId,
            variants: variants.map(v => ({
                ...v,
                conversionRate: v.participants > 0 ? (v.conversions / v.participants) * 100 : 0,
                confidenceInterval: this.calculateConfidenceInterval(v)
            })),
            winner: null,
            significance: null,
            recommendation: null,
            analyzedAt: new Date()
        };
        
        // Determine winner
        analysis.winner = variants.reduce((a, b) => {
            const rateA = a.participants > 0 ? a.conversions / a.participants : 0;
            const rateB = b.participants > 0 ? b.conversions / b.participants : 0;
            return rateA > rateB ? a : b;
        });
        
        // Calculate significance if we have a control
        if (variants.length >= 2) {
            const control = variants[0];
            const treatment = variants[1];
            analysis.significance = this.calculateSignificance(control, treatment);
        }
        
        // Generate recommendation
        analysis.recommendation = this.generateRecommendation(analysis);
        
        this.analyses.push(analysis);
        return analysis;
    }

    calculateConfidenceInterval(variant, confidence = 0.95) {
        if (variant.participants === 0) return null;
        
        const p = variant.conversions / variant.participants;
        const z = 1.96; // 95% confidence
        const n = variant.participants;
        const margin = z * Math.sqrt((p * (1 - p)) / n);
        
        return {
            lower: Math.max(0, p - margin),
            upper: Math.min(1, p + margin)
        };
    }

    calculateSignificance(control, treatment) {
        const n1 = control.participants;
        const n2 = treatment.participants;
        const x1 = control.conversions;
        const x2 = treatment.conversions;
        
        if (n1 === 0 || n2 === 0) return null;
        
        const p1 = x1 / n1;
        const p2 = x2 / n2;
        const p = (x1 + x2) / (n1 + n2);
        
        const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
        if (se === 0) return null;
        
        const z = (p1 - p2) / se;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
        
        return {
            pValue,
            significant: pValue < 0.05,
            zScore: z
        };
    }

    normalCDF(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return 0.5 * (1.0 + sign * y);
    }

    generateRecommendation(analysis) {
        if (!analysis.significance) {
            return 'Insufficient data for recommendation';
        }
        
        if (analysis.significance.significant) {
            const improvement = ((analysis.winner.conversionRate - 
                analysis.variants.find(v => v.id !== analysis.winner.id)?.conversionRate) / 
                analysis.variants.find(v => v.id !== analysis.winner.id)?.conversionRate) * 100;
            
            return `Winner is significant. ${analysis.winner.id} shows ${Math.round(improvement)}% improvement. Recommend implementing winner.`;
        } else {
            return 'No significant difference found. Continue testing or consider other variants.';
        }
    }

    getAnalysis(testId) {
        return this.analyses.find(a => a.testId === testId);
    }
}

// Auto-initialize
const testResultAnalysis = new TestResultAnalysis();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestResultAnalysis;
}


