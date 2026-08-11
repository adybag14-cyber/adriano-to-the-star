/**
 * Risk Management
 * Risk management system
 */

class RiskManagement {
    constructor() {
        this.risks = new Map();
        this.assessments = new Map();
        this.mitigations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_is_km_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_is_km_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerRisk(riskId, riskData) {
        const risk = {
            id: riskId,
            ...riskData,
            name: riskData.name || riskId,
            category: riskData.category || 'security',
            likelihood: riskData.likelihood || 'medium',
            impact: riskData.impact || 'medium',
            score: this.calculateRiskScore(riskData.likelihood, riskData.impact),
            status: 'open',
            createdAt: new Date()
        };
        
        this.risks.set(riskId, risk);
        console.log(`Risk registered: ${riskId}`);
        return risk;
    }

    calculateRiskScore(likelihood, impact) {
        const likelihoodScores = { low: 1, medium: 2, high: 3 };
        const impactScores = { low: 1, medium: 2, high: 3 };
        
        return (likelihoodScores[likelihood] || 2) * (impactScores[impact] || 2);
    }

    createAssessment(assessmentId, assessmentData) {
        const assessment = {
            id: assessmentId,
            ...assessmentData,
            name: assessmentData.name || assessmentId,
            risks: assessmentData.risks || [],
            status: 'pending',
            createdAt: new Date()
        };
        
        this.assessments.set(assessmentId, assessment);
        console.log(`Risk assessment created: ${assessmentId}`);
        return assessment;
    }

    createMitigation(riskId, mitigationId, mitigationData) {
        const risk = this.risks.get(riskId);
        if (!risk) {
            throw new Error('Risk not found');
        }
        
        const mitigation = {
            id: mitigationId,
            riskId,
            ...mitigationData,
            name: mitigationData.name || mitigationId,
            strategy: mitigationData.strategy || 'reduce',
            status: 'planned',
            createdAt: new Date()
        };
        
        this.mitigations.set(mitigationId, mitigation);
        risk.mitigationId = mitigationId;
        
        return mitigation;
    }

    getRisk(riskId) {
        return this.risks.get(riskId);
    }

    getAssessment(assessmentId) {
        return this.assessments.get(assessmentId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.riskManagement = new RiskManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskManagement;
}

