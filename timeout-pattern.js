/**
 * Timeout Pattern
 * Timeout mechanism implementation
 */

class TimeoutPattern {
    constructor() {
        this.timeouts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_im_eo_ut_pa_tt_er_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_im_eo_ut_pa_tt_er_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async execute(operation, timeoutMs) {
        return Promise.race([
            operation(),
            this.createTimeout(timeoutMs)
        ]);
    }

    createTimeout(timeoutMs) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });
    }

    async withTimeout(operation, timeoutMs) {
        const timeoutId = `timeout_${Date.now()}`;
        
        const timeout = {
            id: timeoutId,
            timeoutMs,
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.timeouts.set(timeoutId, timeout);
        
        try {
            const result = await this.execute(operation, timeoutMs);
            timeout.completedAt = new Date();
            timeout.status = 'completed';
            return result;
        } catch (error) {
            timeout.failedAt = new Date();
            timeout.status = 'timeout';
            throw error;
        }
    }

    getTimeout(timeoutId) {
        return this.timeouts.get(timeoutId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.timeoutPattern = new TimeoutPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeoutPattern;
}

