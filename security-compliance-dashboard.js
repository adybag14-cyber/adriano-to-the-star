/**
 * Security Compliance Dashboard
 * Compliance monitoring and dashboard
 */

class SecurityComplianceDashboard {
    constructor() {
        this.frameworks = new Map();
        this.assessments = new Map();
        this.widgets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_yc_om_pl_ia_nc_ed_as_hb_oa_rd_initialized');
    }

    registerFramework(frameworkId, frameworkData) {
        const framework = {
            id: frameworkId,
            ...frameworkData,
            name: frameworkData.name || frameworkId,
            controls: frameworkData.controls || [],
            createdAt: new Date()
        };
        
        this.frameworks.set(frameworkId, framework);
        console.log(`Compliance framework registered: ${frameworkId}`);
        this.trackEvent('framework_registered', { frameworkId, name: frameworkData.name });
        return framework;
    }

    createAssessment(assessmentId, frameworkId) {
        const framework = this.frameworks.get(frameworkId);
        if (!framework) {
            throw new Error('Framework not found');
        }
        
        const assessment = {
            id: assessmentId,
            frameworkId,
            controls: framework.controls.map(control => ({
                controlId: control.id,
                compliant: false,
                evidence: []
            })),
            complianceScore: 0,
            status: 'in_progress',
            createdAt: new Date()
        };
        
        this.assessments.set(assessmentId, assessment);
        this.trackEvent('assessment_created', { assessmentId, frameworkId });
        return assessment;
    }

    updateControlCompliance(assessmentId, controlId, compliant, evidence = []) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const control = assessment.controls.find(c => c.controlId === controlId);
        if (!control) {
            throw new Error('Control not found');
        }
        
        control.compliant = compliant;
        control.evidence = evidence;
        
        this.recalculateComplianceScore(assessmentId);
        
        this.trackEvent('control_compliance_updated', { assessmentId, controlId, compliant, score: assessment.complianceScore });
        return assessment;
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`complianceDashboard:${eventName}`, 1, {
                    source: 'security-compliance-dashboard',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record compliance event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Compliance Event', { event: eventName, ...data });
        }
    }

    recalculateComplianceScore(assessmentId) {
        const assessment = this.assessments.get(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        
        const compliantControls = assessment.controls.filter(c => c.compliant).length;
        assessment.complianceScore = assessment.controls.length > 0 
            ? (compliantControls / assessment.controls.length) * 100 
            : 0;
        
        return assessment;
    }

    getAssessment(assessmentId) {
        return this.assessments.get(assessmentId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityComplianceDashboard = new SecurityComplianceDashboard();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityComplianceDashboard;
}


