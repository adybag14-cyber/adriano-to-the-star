/**
 * Statistical Significance Calculator
 * Calculates statistical significance for test results
 */

class StatisticalSignificanceCalculator {
    constructor() {
        this.init();
    }

    init() {
        this.trackEvent('s_ta_ti_st_ic_al_si_gn_if_ic_an_ce_ca_lc_ul_at_or_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ta_ti_st_ic_al_si_gn_if_ic_an_ce_ca_lc_ul_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    calculatePValue(variantA, variantB) {
        const n1 = variantA.participants;
        const n2 = variantB.participants;
        const x1 = variantA.conversions;
        const x2 = variantB.conversions;
        
        if (n1 === 0 || n2 === 0) return null;
        
        const p1 = x1 / n1;
        const p2 = x2 / n2;
        const p = (x1 + x2) / (n1 + n2);
        
        const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
        if (se === 0) return null;
        
        const z = (p1 - p2) / se;
        return 2 * (1 - this.normalCDF(Math.abs(z)));
    }

    normalCDF(x) {
        // Approximation of normal CDF
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

    isSignificant(variantA, variantB, confidenceLevel = 0.95) {
        const pValue = this.calculatePValue(variantA, variantB);
        if (pValue === null) return null;
        
        const alpha = 1 - confidenceLevel;
        return pValue < alpha;
    }

    calculateConfidenceInterval(variant, confidenceLevel = 0.95) {
        const n = variant.participants;
        const x = variant.conversions;
        
        if (n === 0) return null;
        
        const p = x / n;
        const z = this.getZScore(confidenceLevel);
        const se = Math.sqrt((p * (1 - p)) / n);
        
        const margin = z * se;
        
        return {
            lower: Math.max(0, p - margin),
            upper: Math.min(1, p + margin),
            point: p
        };
    }

    getZScore(confidenceLevel) {
        // Common z-scores
        const zScores = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        };
        return zScores[confidenceLevel] || 1.96;
    }

    calculateSampleSize(baselineRate, minimumDetectableEffect, confidenceLevel = 0.95, power = 0.80) {
        const zAlpha = this.getZScore(confidenceLevel);
        const zBeta = 1.28; // For 80% power
        
        const p1 = baselineRate;
        const p2 = baselineRate + minimumDetectableEffect;
        const p = (p1 + p2) / 2;
        
        const numerator = Math.pow(zAlpha * Math.sqrt(2 * p * (1 - p)) + 
                                  zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
        const denominator = Math.pow(p2 - p1, 2);
        
        return Math.ceil(numerator / denominator);
    }
}

// Auto-initialize
const statisticalSignificanceCalculator = new StatisticalSignificanceCalculator();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticalSignificanceCalculator;
}


