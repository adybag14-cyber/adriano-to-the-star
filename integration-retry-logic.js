/**
 * Integration Retry Logic
 * @class IntegrationRetryLogic
 * @description Provides retry mechanisms for failed integration operations.
 */
class IntegrationRetryLogic {
    constructor() {
        this.retryStrategies = new Map();
        this.retryHistory = [];
        this.init();
    }

    init() {
        this.trackEvent('i_nt_eg_ra_ti_on_re_tr_yl_og_ic_initialized');
        this.setupDefaultStrategies();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_eg_ra_ti_on_re_tr_yl_og_ic_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultStrategies() {
        // Exponential backoff strategy
        this.retryStrategies.set('exponential', {
            type: 'exponential',
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            multiplier: 2
        });

        // Linear backoff strategy
        this.retryStrategies.set('linear', {
            type: 'linear',
            maxRetries: 3,
            delay: 1000
        });

        // Fixed delay strategy
        this.retryStrategies.set('fixed', {
            type: 'fixed',
            maxRetries: 3,
            delay: 2000
        });
    }

    /**
     * Register a retry strategy.
     * @param {string} strategyId - Unique strategy identifier.
     * @param {object} config - Strategy configuration.
     */
    registerStrategy(strategyId, config) {
        this.retryStrategies.set(strategyId, {
            ...config,
            registeredAt: new Date()
        });
        console.log(`Retry strategy registered: ${strategyId}`);
    }

    /**
     * Execute a function with retry logic.
     * @param {function} fn - Function to execute.
     * @param {string} strategyId - Strategy identifier (uses 'exponential' if not specified).
     * @returns {Promise<any>} Function result.
     */
    async executeWithRetry(fn, strategyId = 'exponential') {
        const strategy = this.retryStrategies.get(strategyId);
        if (!strategy) {
            throw new Error(`Retry strategy not found: ${strategyId}`);
        }

        let lastError;
        for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
            try {
                const result = await fn();
                
                if (attempt > 0) {
                    this.retryHistory.push({
                        strategy: strategyId,
                        attempts: attempt + 1,
                        success: true,
                        timestamp: new Date()
                    });
                }

                return result;
            } catch (error) {
                lastError = error;
                
                if (attempt < strategy.maxRetries) {
                    const delay = this.calculateDelay(strategy, attempt);
                    console.log(`Retry attempt ${attempt + 1}/${strategy.maxRetries} after ${delay}ms`);
                    await this.sleep(delay);
                } else {
                    this.retryHistory.push({
                        strategy: strategyId,
                        attempts: attempt + 1,
                        success: false,
                        error: error.message,
                        timestamp: new Date()
                    });
                }
            }
        }

        throw lastError;
    }

    /**
     * Calculate delay based on strategy.
     * @param {object} strategy - Strategy configuration.
     * @param {number} attempt - Current attempt number.
     * @returns {number} Delay in milliseconds.
     */
    calculateDelay(strategy, attempt) {
        if (strategy.type === 'exponential') {
            return Math.min(
                strategy.initialDelay * Math.pow(strategy.multiplier, attempt),
                strategy.maxDelay
            );
        } else if (strategy.type === 'linear') {
            return strategy.delay * (attempt + 1);
        } else if (strategy.type === 'fixed') {
            return strategy.delay;
        }
        return 1000; // Default
    }

    /**
     * Sleep for specified milliseconds.
     * @param {number} ms - Milliseconds to sleep.
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.integrationRetryLogic = new IntegrationRetryLogic();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationRetryLogic;
}
