/**
 * Retry Pattern
 * Retry mechanism implementation
 */

class RetryPattern {
    constructor() {
        this.retries = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_et_ry_pa_tt_er_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_et_ry_pa_tt_er_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async execute(operation, options = {}) {
        const maxAttempts = options.maxAttempts || 3;
        const delay = options.delay || 1000;
        const backoff = options.backoff || 'exponential';
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await operation();
                return { result, attempts: attempt };
            } catch (error) {
                lastError = error;
                
                if (attempt < maxAttempts) {
                    const waitTime = this.calculateDelay(delay, attempt, backoff);
                    await this.sleep(waitTime);
                }
            }
        }
        
        throw lastError;
    }

    calculateDelay(baseDelay, attempt, backoff) {
        if (backoff === 'exponential') {
            return baseDelay * Math.pow(2, attempt - 1);
        } else if (backoff === 'linear') {
            return baseDelay * attempt;
        }
        return baseDelay;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.retryPattern = new RetryPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RetryPattern;
}

