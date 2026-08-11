/**
 * Integration Error Handling
 * @class IntegrationErrorHandling
 * @description Provides comprehensive error handling for integrations.
 */
class IntegrationErrorHandling {
    constructor() {
        this.errorHandlers = new Map();
        this.errorLog = [];
        this.init();
    }

    init() {
        this.trackEvent('i_nt_eg_ra_ti_on_er_ro_rh_an_dl_in_g_initialized');
        this.setupDefaultHandlers();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_eg_ra_ti_on_er_ro_rh_an_dl_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultHandlers() {
        // Default error handler
        this.errorHandlers.set('default', {
            type: 'default',
            handler: (error) => {
                console.error('Integration error:', error);
                this.logError(error);
            }
        });

        // Retry error handler
        this.errorHandlers.set('retry', {
            type: 'retry',
            maxRetries: 3,
            handler: async (error, context) => {
                let retries = 0;
                while (retries < this.errorHandlers.get('retry').maxRetries) {
                    try {
                        retries++;
                        console.log(`Retrying (attempt ${retries})...`);
                        // Retry logic would go here
                        return;
                    } catch (retryError) {
                        if (retries >= this.errorHandlers.get('retry').maxRetries) {
                            this.logError(retryError);
                            throw retryError;
                        }
                    }
                }
            }
        });
    }

    /**
     * Register an error handler.
     * @param {string} handlerId - Unique handler identifier.
     * @param {object} config - Handler configuration.
     */
    registerHandler(handlerId, config) {
        this.errorHandlers.set(handlerId, {
            ...config,
            registeredAt: new Date()
        });
        console.log(`Error handler registered: ${handlerId}`);
    }

    /**
     * Handle an error.
     * @param {Error} error - Error object.
     * @param {string} handlerId - Handler identifier (uses 'default' if not specified).
     * @param {object} context - Additional context.
     */
    async handleError(error, handlerId = 'default', context = {}) {
        const handler = this.errorHandlers.get(handlerId);
        if (!handler) {
            throw new Error(`Error handler not found: ${handlerId}`);
        }

        try {
            await handler.handler(error, context);
        } catch (handlerError) {
            console.error('Error in error handler:', handlerError);
            this.logError(handlerError);
        }
    }

    /**
     * Log an error.
     * @param {Error} error - Error object.
     */
    logError(error) {
        const errorEntry = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date(),
            type: error.constructor.name
        };

        this.errorLog.push(errorEntry);
        console.error('Error logged:', errorEntry);
    }

    /**
     * Get error log.
     * @returns {Array<object>} Error log entries.
     */
    getErrorLog() {
        return this.errorLog;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.integrationErrorHandling = new IntegrationErrorHandling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationErrorHandling;
}
