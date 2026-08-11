/**
 * ISO 27001 Compliance
 * ISO/IEC 27001 information security management system compliance
 */

class ISO27001Compliance {
    constructor() {
        this.controls = new Map();
        this.assessments = new Map();
        this.risks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_so27001c_om_pl_ia_nc_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_so27001c_om_pl_ia_nc_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerControl(controlId, controlData) {
        const control = {
            id: controlId,
            ...controlData,
            annex: controlData.annex || 'A',
            controlNumber: controlData.controlNumber || '',
            description: controlData.description || '',
            status: 'active',
            createdAt: new Date()
        };
        
        this.controls.set(controlId, control);
        console.log(`ISO 27001 control registered: ${controlId}`);
        return control;
    }

    createAssessment(assessmentId, scope) {
        const assessment = {
            id: assessmentId,
            scope,
            controls: [],
            risks: [],
            status: 'in_progress',
            createdAt: new Date()
        };
        
        this.assessments.set(assessmentId, assessment);
        console.log(`Assessment created: ${assessmentId}`);
        return assessment;
    }

    assessControl(assessmentId, controlId, assessmentData) {
        const assessment = this.assessments.get(assessmentId);
        const control = this.controls.get(controlId);
        
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        if (!control) {
            throw new Error('Control not found');
        }
        
        const controlAssessment = {
            controlId,
            implemented: assessmentData.implemented || false,
            effective: assessmentData.effective || false,
            evidence: assessmentData.evidence || [],
            gaps: assessmentData.gaps || [],
            assessedAt: new Date()
        };
        
        assessment.controls.push(controlAssessment);
        return controlAssessment;
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
            riskLevel: this.calculateRiskLevel(riskData.likelihood, riskData.impact),
            treatment: riskData.treatment || 'accept',
            createdAt: new Date()
        };
        
        assessment.risks.push(risk);
        this.risks.set(risk.id, risk);
        
        return risk;
    }

    calculateRiskLevel(likelihood, impact) {
        const likelihoodScores = { low: 1, medium: 2, high: 3 };
        const impactScores = { low: 1, medium: 2, high: 3 };
        
        const score = likelihoodScores[likelihood] * impactScores[impact];
        
        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    calculateComplianceScore(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        if (assessment.controls.length === 0) {
            return { complianceScore: 0, implementedControls: 0, effectiveControls: 0 };
        }
        
        const implementedControls = assessment.controls.filter(c => c.implemented).length;
        const effectiveControls = assessment.controls.filter(c => c.effective).length;
        
        const complianceScore = assessment.controls.length > 0 
            ? (effectiveControls / assessment.controls.length) * 100 
            : 0;
        
        return {
            complianceScore,
            totalControls: assessment.controls.length,
            implementedControls,
            effectiveControls,
            gaps: assessment.controls.filter(c => !c.implemented || !c.effective).length
        };
    }

    generateStatementOfApplicability(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const soa = assessment.controls.map(c => {
            const control = this.controls.get(c.controlId);
            return {
                controlId: c.controlId,
                annex: control?.annex || '',
                controlNumber: control?.controlNumber || '',
                description: control?.description || '',
                implemented: c.implemented,
                effective: c.effective,
                justification: c.implemented ? 'Implemented and effective' : 'Not applicable or not implemented',
                gaps: c.gaps
            };
        });
        
        return {
            assessmentId: assessment.id,
            scope: assessment.scope,
            generatedAt: new Date(),
            statementOfApplicability: soa
        };
    }

    getAssessment(assessmentId) {
        return this.assessments.get(assessmentId);
    }

    getControl(controlId) {
        return this.controls.get(controlId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iso27001Compliance = new ISO27001Compliance();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ISO27001Compliance;
}

