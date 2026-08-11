/**
 * Security Risk Assessment
 * Comprehensive security risk assessment and analysis
 */

class SecurityRiskAssessment {
    constructor() {
        this.assessments = new Map();
        this.risks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_yr_is_ka_ss_es_sm_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_yr_is_ka_ss_es_sm_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createAssessment(assessmentId, scope) {
        const assessment = {
            id: assessmentId,
            scope,
            status: 'in_progress',
            risks: [],
            createdAt: new Date()
        };
        
        this.assessments.set(assessmentId, assessment);
        console.log(`Security assessment created: ${assessmentId}`);
        return assessment;
    }

    identifyRisk(assessmentId, riskData) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const risk = {
            id: `risk_${Date.now()}`,
            ...riskData,
            likelihood: riskData.likelihood || 'medium',
            impact: riskData.impact || 'medium',
            severity: this.calculateSeverity(riskData.likelihood, riskData.impact),
            status: 'identified',
            createdAt: new Date()
        };
        
        assessment.risks.push(risk);
        this.risks.set(risk.id, risk);
        
        return risk;
    }

    calculateSeverity(likelihood, impact) {
        const likelihoodScores = { low: 1, medium: 2, high: 3 };
        const impactScores = { low: 1, medium: 2, high: 3 };
        
        const score = likelihoodScores[likelihood] * impactScores[impact];
        
        if (score >= 7) return 'critical';
        if (score >= 4) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
    }

    calculateRiskScore(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        if (assessment.risks.length === 0) {
            return { overallScore: 0, riskLevel: 'low' };
        }
        
        const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
        const totalScore = assessment.risks.reduce((sum, risk) => {
            return sum + severityScores[risk.severity];
        }, 0);
        
        const avgScore = totalScore / assessment.risks.length;
        const maxScore = 4;
        const normalizedScore = (avgScore / maxScore) * 100;
        
        let riskLevel = 'low';
        if (normalizedScore >= 75) {
            riskLevel = 'critical';
        } else if (normalizedScore >= 50) {
            riskLevel = 'high';
        } else if (normalizedScore >= 25) {
            riskLevel = 'medium';
        }
        
        return {
            overallScore: normalizedScore,
            riskLevel,
            totalRisks: assessment.risks.length,
            criticalRisks: assessment.risks.filter(r => r.severity === 'critical').length,
            highRisks: assessment.risks.filter(r => r.severity === 'high').length
        };
    }

    prioritizeRisks(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        const prioritized = [...assessment.risks].sort((a, b) => {
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
        
        return prioritized.map((risk, index) => ({
            ...risk,
            priority: index + 1
        }));
    }

    getAssessment(assessmentId) {
        return this.assessments.get(assessmentId);
    }

    getRisk(riskId) {
        return this.risks.get(riskId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityRiskAssessment = new SecurityRiskAssessment();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityRiskAssessment;
}

