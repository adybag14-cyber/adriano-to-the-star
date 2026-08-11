/**
 * SOC 2 Compliance
 * SOC 2 Type II compliance management and reporting
 */

class SOC2Compliance {
    constructor() {
        this.controls = new Map();
        this.assessments = new Map();
        this.evidence = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_oc2c_om_pl_ia_nc_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_oc2c_om_pl_ia_nc_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerControl(controlId, controlData) {
        const control = {
            id: controlId,
            ...controlData,
            trustServiceCriteria: controlData.trustServiceCriteria || [],
            description: controlData.description || '',
            status: 'active',
            createdAt: new Date()
        };
        
        this.controls.set(controlId, control);
        console.log(`Control registered: ${controlId}`);
        return control;
    }

    createAssessment(assessmentId, scope) {
        const assessment = {
            id: assessmentId,
            scope,
            period: {
                startDate: new Date(),
                endDate: null
            },
            controls: [],
            status: 'in_progress',
            createdAt: new Date()
        };
        
        this.assessments.set(assessmentId, assessment);
        console.log(`Assessment created: ${assessmentId}`);
        return assessment;
    }

    addControlToAssessment(assessmentId, controlId) {
        const assessment = this.assessments.get(assessmentId);
        const control = this.controls.get(controlId);
        
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        if (!control) {
            throw new Error('Control not found');
        }
        
        assessment.controls.push({
            controlId,
            tested: false,
            effective: false,
            evidence: []
        });
        
        return assessment;
    }

    testControl(assessmentId, controlId, testResult) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const controlAssessment = assessment.controls.find(c => c.controlId === controlId);
        if (!controlAssessment) {
            throw new Error('Control not found in assessment');
        }
        
        controlAssessment.tested = true;
        controlAssessment.effective = testResult.effective || false;
        controlAssessment.testDate = new Date();
        controlAssessment.testResult = testResult;
        
        return controlAssessment;
    }

    addEvidence(assessmentId, controlId, evidenceData) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const controlAssessment = assessment.controls.find(c => c.controlId === controlId);
        if (!controlAssessment) {
            throw new Error('Control not found in assessment');
        }
        
        const evidence = {
            id: `evidence_${Date.now()}`,
            ...evidenceData,
            type: evidenceData.type || 'document',
            collectedAt: new Date(),
            createdAt: new Date()
        };
        
        controlAssessment.evidence.push(evidence);
        this.evidence.set(evidence.id, evidence);
        
        return evidence;
    }

    calculateEffectiveness(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        if (assessment.controls.length === 0) {
            return { effectiveness: 0, testedControls: 0, effectiveControls: 0 };
        }
        
        const testedControls = assessment.controls.filter(c => c.tested).length;
        const effectiveControls = assessment.controls.filter(c => c.effective).length;
        
        const effectiveness = assessment.controls.length > 0 
            ? (effectiveControls / assessment.controls.length) * 100 
            : 0;
        
        return {
            effectiveness,
            totalControls: assessment.controls.length,
            testedControls,
            effectiveControls,
            ineffectiveControls: testedControls - effectiveControls
        };
    }

    generateReport(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const effectiveness = this.calculateEffectiveness(assessmentId);
        
        const report = {
            assessmentId: assessment.id,
            scope: assessment.scope,
            period: assessment.period,
            generatedAt: new Date(),
            effectiveness,
            controls: assessment.controls.map(c => ({
                controlId: c.controlId,
                control: this.controls.get(c.controlId),
                tested: c.tested,
                effective: c.effective,
                evidenceCount: c.evidence.length
            })),
            trustServiceCriteria: this.assessTrustServiceCriteria(assessment)
        };
        
        assessment.status = 'completed';
        assessment.completedAt = new Date();
        
        return report;
    }

    assessTrustServiceCriteria(assessment) {
        const criteria = {
            security: { met: true, controls: 0 },
            availability: { met: true, controls: 0 },
            processingIntegrity: { met: true, controls: 0 },
            confidentiality: { met: true, controls: 0 },
            privacy: { met: true, controls: 0 }
        };
        
        assessment.controls.forEach(c => {
            const control = this.controls.get(c.controlId);
            if (control && control.trustServiceCriteria) {
                control.trustServiceCriteria.forEach(criterion => {
                    if (criteria[criterion]) {
                        criteria[criterion].controls++;
                        if (!c.effective) {
                            criteria[criterion].met = false;
                        }
                    }
                });
            }
        });
        
        return criteria;
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
    window.soc2Compliance = new SOC2Compliance();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SOC2Compliance;
}

