/**
 * Web Push API Enhancements
 * Enhanced push notification capabilities
 */

class WebPushAPIEnhancements {
    constructor() {
        this.subscription = null;
        this.registration = null;
        this.initialized = false;
    }

    /**
     * Initialize Web Push API
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Web Push API is not supported');
        }
        this.registration = await navigator.serviceWorker.ready;
        this.initialized = true;
        return { success: true, message: 'Web Push API initialized' };
    }

    /**
     * Check if Web Push API is supported
     * @returns {boolean}
     */
    isSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    }

    /**
     * Subscribe to push notifications
     * @param {Object} options - Subscription options
     * @returns {Promise<PushSubscription>}
     */
    async subscribe(options = {}) {
        if (!this.registration) {
            throw new Error('Service Worker not ready');
        }

        const subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: options.userVisibleOnly !== false,
            applicationServerKey: options.applicationServerKey
        });

        this.subscription = subscription;
        return subscription;
    }

    /**
     * Unsubscribe from push notifications
     * @returns {Promise<boolean>}
     */
    async unsubscribe() {
        if (!this.subscription) {
            return false;
        }

        const result = await this.subscription.unsubscribe();
        if (result) {
            this.subscription = null;
        }
        return result;
    }

    /**
     * Get subscription
     * @returns {Promise<PushSubscription|null>}
     */
    async getSubscription() {
        if (!this.registration) {
            return null;
        }
        return await this.registration.pushManager.getSubscription();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebPushAPIEnhancements;
}

