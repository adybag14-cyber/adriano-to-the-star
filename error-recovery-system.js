/**
 * Error Recovery System
 * 
 * Adds comprehensive error recovery mechanisms for network failures.
 * 
 * @module ErrorRecoverySystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ErrorRecoverySystem {
    constructor() {
        this.recoveryStrategies = new Map();
        this.failedOperations = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize error recovery system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('ErrorRecoverySystem already initialized');
            return;
        }

        this.setupNetworkMonitoring();
        this.setupRecoveryStrategies();
        this.setupOfflineQueue();

        this.isInitialized = true;
        this.trackEvent('error_recovery_sys_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_recovery_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[ErrorRecovery] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[ErrorRecovery] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[ErrorRecovery] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Set up network monitoring
     * @private
     */
    setupNetworkMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Store original fetch for retry operations
        this.originalFetch = window.fetch.bind(window);

        // Monitor fetch failures
        const self = this;
        window.fetch = async (...args) => {
            try {
                return await self.originalFetch(...args);
            } catch (error) {
                return self.handleFetchError(error, args);
            }
        };
    }

    /**
     * Set up recovery strategies
     * @private
     */
    setupRecoveryStrategies() {
        // Network error recovery
        this.recoveryStrategies.set('network', {
            retry: true,
            maxRetries: 3,
            backoff: 'exponential',
            fallback: 'cache'
        });

        // Timeout recovery
        this.recoveryStrategies.set('timeout', {
            retry: true,
            maxRetries: 2,
            backoff: 'exponential',
            timeout: 10000
        });

        // Server error recovery
        this.recoveryStrategies.set('server_error', {
            retry: true,
            maxRetries: 2,
            backoff: 'exponential',
            fallback: 'cached_response'
        });
    }

    /**
     * Set up offline queue
     * @private
     */
    setupOfflineQueue() {
        // Load queued operations from storage
        this.loadOfflineQueue();

        // Process queue when online
        window.addEventListener('online', () => {
            this.processOfflineQueue();
        });
    }

    /**
     * Handle fetch error
     * @private
     * @param {Error} error - Error object
     * @param {Array} args - Fetch arguments
     * @returns {Promise<Response>} Response or error
     */
    async handleFetchError(error, args) {
        const [url, options = {}] = args;
        const errorType = this.classifyError(error);

        // Try recovery strategy
        const strategy = this.recoveryStrategies.get(errorType);
        if (strategy && strategy.retry) {
            return this.retryOperation(() => this.originalFetch(...args), strategy, url, options);
        }

        // Queue for offline processing
        if (!navigator.onLine) {
            this.queueOfflineOperation(url, options);
        }

        throw error;
    }

    /**
     * Classify error
     * @private
     * @param {Error} error - Error object
     * @returns {string} Error type
     */
    classifyError(error) {
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            return 'network';
        }
        if (error.message?.includes('timeout')) {
            return 'timeout';
        }
        return 'unknown';
    }

    /**
     * Retry operation
     * @private
     * @param {Function} operation - Operation to retry
     * @param {Object} strategy - Recovery strategy
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Operation result
     */
    async retryOperation(operation, strategy, url, options) {
        let lastError = null;
        let delay = 1000;

        for (let attempt = 0; attempt < strategy.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // Try fallback
                if (strategy.fallback === 'cache' && attempt === strategy.maxRetries - 1) {
                    const cached = await this.getCachedResponse(url);
                    if (cached) {
                        return cached;
                    }
                }

                // Wait before retry
                if (attempt < strategy.maxRetries - 1) {
                    await this.delay(delay);
                    delay *= 2; // Exponential backoff
                }
            }
        }

        throw lastError;
    }

    /**
     * Handle online event
     * @private
     */
    handleOnline() {
        console.log('Network connection restored');
        this.processOfflineQueue();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('network-online'));
    }

    /**
     * Handle offline event
     * @private
     */
    handleOffline() {
        console.log('Network connection lost');

        // Dispatch event
        window.dispatchEvent(new CustomEvent('network-offline'));
    }

    /**
     * Queue offline operation
     * @private
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     */
    queueOfflineOperation(url, options) {
        const queue = this.getOfflineQueue();
        queue.push({
            url,
            options,
            timestamp: Date.now()
        });
        this.saveOfflineQueue(queue);
    }

    /**
     * Process offline queue
     * @private
     */
    async processOfflineQueue() {
        if (!navigator.onLine) {
            return;
        }

        const queue = this.getOfflineQueue();
        if (queue.length === 0) {
            return;
        }

        console.log(`Processing ${queue.length} queued operations`);

        const processed = [];
        for (const operation of queue) {
            try {
                await this.fetchJSON(operation.url, operation.options);
                processed.push(operation);
            } catch (error) {
                console.warn('Failed to process queued operation:', error);
            }
        }

        // Remove processed operations
        const remaining = queue.filter(op => !processed.includes(op));
        this.saveOfflineQueue(remaining);
    }

    /**
     * Get offline queue
     * @private
     * @returns {Array} Offline queue
     */
    getOfflineQueue() {
        try {
            return JSON.parse(localStorage.getItem('offline-queue') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Save offline queue
     * @private
     * @param {Array} queue - Offline queue
     */
    saveOfflineQueue(queue) {
        try {
            localStorage.setItem('offline-queue', JSON.stringify(queue));
        } catch (e) {
            console.warn('Failed to save offline queue:', e);
        }
    }

    /**
     * Load offline queue
     * @private
     */
    loadOfflineQueue() {
        const queue = this.getOfflineQueue();
        if (queue.length > 0 && navigator.onLine) {
            this.processOfflineQueue();
        }
    }

    /**
     * Get cached response
     * @private
     * @param {string} url - Request URL
     * @returns {Promise<Response|null>} Cached response or null
     */
    async getCachedResponse(url) {
        if (window.apiCache) {
            const cached = window.apiCache.get(url);
            if (cached) {
                return new Response(JSON.stringify(cached), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        return null;
    }

    /**
     * Delay execution
     * @private
     * @param {number} ms - Milliseconds
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
window.ErrorRecoverySystem = ErrorRecoverySystem;
window.errorRecovery = new ErrorRecoverySystem();
window.errorRecovery.init();

