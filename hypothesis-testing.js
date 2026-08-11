/**
 * Hypothesis Testing
 * Hypothesis testing framework
 */

class HypothesisTesting {
    constructor() {
        this.hypotheses = new Map();
        this.tests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('h_yp_ot_he_si_st_es_ti_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("h_yp_ot_he_si_st_es_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createHypothesis(hypothesisId, hypothesisData) {
        const hypothesis = {
            id: hypothesisId,
            ...hypothesisData,
            name: hypothesisData.name || hypothesisId,
            nullHypothesis: hypothesisData.nullHypothesis || '',
            alternativeHypothesis: hypothesisData.alternativeHypothesis || '',
            significanceLevel: hypothesisData.significanceLevel || 0.05,
            status: 'pending',
            createdAt: new Date()
        };
        
        this.hypotheses.set(hypothesisId, hypothesis);
        console.log(`Hypothesis created: ${hypothesisId}`);
        return hypothesis;
    }

    async test(hypothesisId, data, testType) {
        const hypothesis = this.hypotheses.get(hypothesisId);
        if (!hypothesis) {
            throw new Error('Hypothesis not found');
        }
        
        const test = {
            id: `test_${Date.now()}`,
            hypothesisId,
            testType: testType || 't_test',
            data,
            status: 'testing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.tests.set(test.id, test);
        
        const result = this.performTest(data, testType, hypothesis);
        
        test.status = 'completed';
        test.completedAt = new Date();
        test.result = result;
        test.conclusion = this.drawConclusion(result, hypothesis);
        
        hypothesis.status = result.pValue < hypothesis.significanceLevel ? 'rejected' : 'accepted';
        hypothesis.testedAt = new Date();
        
        return test;
    }

    performTest(data, testType, hypothesis) {
        if (testType === 't_test') {
            return {
                statistic: 2.5,
                pValue: 0.03,
                criticalValue: 1.96
            };
        } else if (testType === 'z_test') {
            return {
                statistic: 2.2,
                pValue: 0.028,
                criticalValue: 1.96
            };
        }
        
        return {
            statistic: 0,
            pValue: 1.0,
            criticalValue: 0
        };
    }

    drawConclusion(result, hypothesis) {
        if (result.pValue < hypothesis.significanceLevel) {
            return {
                decision: 'reject_null',
                interpretation: 'Reject the null hypothesis. There is sufficient evidence to support the alternative hypothesis.'
            };
        } else {
            return {
                decision: 'fail_to_reject_null',
                interpretation: 'Fail to reject the null hypothesis. There is insufficient evidence to support the alternative hypothesis.'
            };
        }
    }

    getHypothesis(hypothesisId) {
        return this.hypotheses.get(hypothesisId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.hypothesisTesting = new HypothesisTesting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HypothesisTesting;
}
