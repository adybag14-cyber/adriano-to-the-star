/**
 * Push Notification System
 * 
 * Implements comprehensive push notification system.
 * 
 * @module PushNotificationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class PushNotificationSystem {
    constructor() {
        this.registration = null;
        this.subscription = null;
        this.isInitialized = false;
    }

    /**
     * Initialize push notification system
     * @public
     */
    async init() {
        if (this.isInitialized) {
            console.warn('PushNotificationSystem already initialized');
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported in this browser');
            return;
        }

        try {
            // Reuse existing registration when possible
            this.registration = await navigator.serviceWorker.getRegistration('/') || await navigator.serviceWorker.getRegistration();
            if (!this.registration) {
                this.registration = await navigator.serviceWorker.register('/sw.js');
            }
            
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Subscribe to push notifications
                await this.subscribe();
            }
            
            this.isInitialized = true;
            console.log('✅ Push Notification System initialized');
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
        }
    }

    /**
     * Subscribe to push notifications
     * @public
     * @returns {Promise<PushSubscription>} Push subscription
     */
    async subscribe() {
        if (!this.registration) {
            throw new Error('Service worker not registered');
        }

        try {
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
            });

            // Send subscription to server
            await this.sendSubscriptionToServer(this.subscription);

            return this.subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from push notifications
     * @public
     * @returns {Promise<boolean>} True if unsubscribed
     */
    async unsubscribe() {
        if (!this.subscription) {
            return false;
        }

        try {
            const unsubscribed = await this.subscription.unsubscribe();
            if (unsubscribed) {
                this.subscription = null;
                await this.removeSubscriptionFromServer();
            }
            return unsubscribed;
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
            return false;
        }
    }

    /**
     * Send subscription to server
     * @private
     * @param {PushSubscription} subscription - Push subscription
     */
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }
        } catch (error) {
            console.warn('Failed to send subscription to server:', error);
            // Store locally for later sync
            this.saveSubscriptionLocally(subscription);
        }
    }

    /**
     * Remove subscription from server
     * @private
     */
    async removeSubscriptionFromServer() {
        try {
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.warn('Failed to remove subscription from server:', error);
        }
    }

    /**
     * Get VAPID public key
     * @private
     * @returns {string} VAPID public key
     */
    getVapidPublicKey() {
        // This should be set from server configuration
        return window.VAPID_PUBLIC_KEY || '';
    }

    /**
     * Convert URL base64 to Uint8Array
     * @private
     * @param {string} base64String - Base64 string
     * @returns {Uint8Array} Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Save subscription locally
     * @private
     * @param {PushSubscription} subscription - Push subscription
     */
    saveSubscriptionLocally(subscription) {
        try {
            localStorage.setItem('push-subscription', JSON.stringify(subscription.toJSON()));
        } catch (e) {
            console.warn('Failed to save subscription locally:', e);
        }
    }

    /**
     * Load subscription locally
     * @private
     * @returns {Object|null} Subscription object
     */
    loadSubscriptionLocally() {
        try {
            const saved = localStorage.getItem('push-subscription');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if subscribed
     * @public
     * @returns {boolean} True if subscribed
     */
    isSubscribed() {
        return this.subscription !== null;
    }

    /**
     * Get subscription
     * @public
     * @returns {PushSubscription|null} Push subscription
     */
    getSubscription() {
        return this.subscription;
    }
}

// Create global instance
window.PushNotificationSystem = PushNotificationSystem;
window.pushNotifications = new PushNotificationSystem();
window.pushNotifications.init();

