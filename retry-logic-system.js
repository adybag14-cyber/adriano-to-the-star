/**
 * Retry Logic System with Exponential Backoff
 * 
 * Implements retry logic with exponential backoff for API calls and async operations.
 * 
 * @module RetryLogicSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class RetryLogicSystem {
    constructor() {
        this.defaultOptions = {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            retryableErrors: ['network', 'timeout', '500', '502', '503', '504'],
            onRetry: null,
            onSuccess: null,
            onFailure: null
        };
    }

    /**
     * Retry an async function with exponential backoff
     * @public
     * @param {Function} fn - Async function to retry
     * @param {Object} options - Retry options
     * @returns {Promise} Promise that resolves with function result
     */
    async retry(fn, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        let lastError = null;
        let delay = opts.initialDelay;

        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                const result = await fn();
                
                if (opts.onSuccess) {
                    opts.onSuccess(result, attempt);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                // Check if error is retryable
                if (!this.isRetryableError(error, opts.retryableErrors)) {
                    if (opts.onFailure) {
                        opts.onFailure(error, attempt);
                    }
                    throw error;
                }

                // Don't retry on last attempt
                if (attempt === opts.maxRetries) {
                    if (opts.onFailure) {
                        opts.onFailure(error, attempt);
                    }
                    throw error;
                }

                // Call onRetry callback
                if (opts.onRetry) {
                    opts.onRetry(error, attempt, delay);
                }

                // Wait before retrying
                await this.delay(delay);

                // Calculate next delay with exponential backoff
                delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
            }
        }

        if (opts.onFailure) {
            opts.onFailure(lastError, opts.maxRetries);
        }
        throw lastError;
    }

    /**
     * Check if error is retryable
     * @private
     * @param {Error} error - Error object
     * @param {Array} retryableErrors - List of retryable error types/codes
     * @returns {boolean} True if retryable
     */
    isRetryableError(error, retryableErrors) {
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || error.status || error.statusCode || '';

        return retryableErrors.some(retryable => {
            if (typeof retryable === 'string') {
                return errorMessage.includes(retryable.toLowerCase()) ||
                       String(errorCode).includes(retryable);
            }
            return false;
        });
    }

    /**
     * Delay execution
     * @private
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry fetch request
     * @public
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {Object} retryOptions - Retry options
     * @returns {Promise<Response>} Fetch response
     */
    async retryFetch(url, options = {}, retryOptions = {}) {
        return this.retry(async () => {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.statusText = response.statusText;
                throw error;
            }
            
            return response;
        }, retryOptions);
    }

    /**
     * Retry with jitter (randomized delay)
     * @public
     * @param {Function} fn - Async function to retry
     * @param {Object} options - Retry options
     * @returns {Promise} Promise that resolves with function result
     */
    async retryWithJitter(fn, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        let lastError = null;
        let baseDelay = opts.initialDelay;

        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                const result = await fn();
                
                if (opts.onSuccess) {
                    opts.onSuccess(result, attempt);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                if (!this.isRetryableError(error, opts.retryableErrors)) {
                    if (opts.onFailure) {
                        opts.onFailure(error, attempt);
                    }
                    throw error;
                }

                if (attempt === opts.maxRetries) {
                    if (opts.onFailure) {
                        opts.onFailure(error, attempt);
                    }
                    throw error;
                }

                if (opts.onRetry) {
                    opts.onRetry(error, attempt, baseDelay);
                }

                // Add jitter (random variation)
                const jitter = Math.random() * 0.3 * baseDelay; // Up to 30% jitter
                const delay = baseDelay + jitter;
                await this.delay(delay);

                baseDelay = Math.min(baseDelay * opts.backoffMultiplier, opts.maxDelay);
            }
        }

        if (opts.onFailure) {
            opts.onFailure(lastError, opts.maxRetries);
        }
        throw lastError;
    }
}

// Create global instance
window.RetryLogicSystem = RetryLogicSystem;
window.retryLogic = new RetryLogicSystem();

