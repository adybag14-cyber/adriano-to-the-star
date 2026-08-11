/**
 * Security Risk Scoring
 * Security risk assessment and scoring
 */

class SecurityRiskScoring {
    constructor() {
        this.assessments = new Map();
        this.scores = new Map();
        this.factors = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_yr_is_ks_co_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_yr_is_ks_co_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createAssessment(assessmentId, scope) {
        const assessment = {
            id: assessmentId,
            scope,
            factors: {},
            score: 0,
            riskLevel: 'low',
            createdAt: new Date()
        };
        
        this.assessments.set(assessmentId, assessment);
        console.log(`Risk assessment created: ${assessmentId}`);
        return assessment;
    }

    addFactor(assessmentId, factorName, factorValue, weight = 1) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        assessment.factors[factorName] = {
            value: factorValue,
            weight,
            score: this.calculateFactorScore(factorValue, weight)
        };
        
        this.recalculateScore(assessmentId);
        
        return assessment;
    }

    calculateFactorScore(value, weight) {
        const normalizedValue = Math.min(100, Math.max(0, value));
        return (normalizedValue / 100) * weight * 10;
    }

    recalculateScore(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const totalScore = Object.values(assessment.factors)
            .reduce((sum, factor) => sum + factor.score, 0);
        
        const totalWeight = Object.values(assessment.factors)
            .reduce((sum, factor) => sum + factor.weight, 0);
        
        assessment.score = totalWeight > 0 ? (totalScore / totalWeight) : 0;
        assessment.riskLevel = this.determineRiskLevel(assessment.score);
        
        const scoreId = `score_${Date.now()}`;
        this.scores.set(scoreId, {
            id: scoreId,
            assessmentId,
            score: assessment.score,
            riskLevel: assessment.riskLevel,
            timestamp: new Date(),
            createdAt: new Date()
        });
        
        return assessment;
    }

    determineRiskLevel(score) {
        if (score >= 75) return 'critical';
        if (score >= 50) return 'high';
        if (score >= 25) return 'medium';
        return 'low';
    }

    getAssessment(assessmentId) {
        return this.assessments.get(assessmentId);
    }

    getScores(assessmentId = null) {
        if (assessmentId) {
            return Array.from(this.scores.values())
                .filter(s => s.assessmentId === assessmentId);
        }
        return Array.from(this.scores.values());
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityRiskScoring = new SecurityRiskScoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityRiskScoring;
}


