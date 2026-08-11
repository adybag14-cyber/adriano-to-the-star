/**
 * Background Sync with Retry Logic
 * Implements background sync with automatic retry mechanism
 */

/* global ServiceWorkerRegistration */

class BackgroundSyncRetry {
    constructor() {
        this.syncTags = new Set();
        this.retryQueue = [];
        this.maxRetries = 3;
        this.initialized = false;
    }

    /**
     * Initialize background sync
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Background Sync is not supported');
        }
        this.initialized = true;
        this.trackEvent('bg_sync_retry_initialized');
        return { success: true, message: 'Background Sync initialized' };
    }

    /**
     * Check if Background Sync is supported
     * @returns {boolean}
     */
    isSupported() {
        return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
    }

    /**
     * Register sync tag
     * @param {string} tag - Sync tag
     * @param {Object} options - Sync options
     * @returns {Promise<void>}
     */
    async registerSync(tag, options = {}) {
        if (!this.isSupported()) {
            throw new Error('Background Sync is not supported');
        }

        const registration = await navigator.serviceWorker.ready;
        try {
            await registration.sync.register(tag);
            this.syncTags.add(tag);
        } catch (error) {
            throw new Error(`Failed to register sync: ${error.message}`);
        }
    }

    /**
     * Retry failed operation
     * @param {Function} operation - Operation to retry
     * @param {number} maxRetries - Maximum retries
     * @returns {Promise<any>}
     */
    async retryOperation(operation, maxRetries = this.maxRetries) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
            }
        }
        throw lastError;
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bg_sync_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundSyncRetry;
}

