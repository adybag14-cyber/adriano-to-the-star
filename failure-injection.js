/**
 * Failure Injection
 * Failure injection for testing
 */

class FailureInjection {
    constructor() {
        this.injections = new Map();
        this.failures = new Map();
        this.recoveries = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ai_lu_re_in_je_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ai_lu_re_in_je_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async inject(failureId, failureData) {
        const failure = {
            id: failureId,
            ...failureData,
            type: failureData.type || 'network',
            target: failureData.target || '',
            duration: failureData.duration || 1000,
            status: 'injecting',
            createdAt: new Date()
        };

        await this.performInjection(failure);
        this.failures.set(failureId, failure);
        return failure;
    }

    async performInjection(failure) {
        await new Promise(resolve => setTimeout(resolve, failure.duration));
        failure.status = 'injected';
        failure.injectedAt = new Date();
    }

    async recover(failureId) {
        const failure = this.failures.get(failureId);
        if (!failure) {
            throw new Error(`Failure ${failureId} not found`);
        }

        failure.status = 'recovered';
        failure.recoveredAt = new Date();
        return failure;
    }

    getFailure(failureId) {
        return this.failures.get(failureId);
    }

    getAllFailures() {
        return Array.from(this.failures.values());
    }
}

module.exports = FailureInjection;

