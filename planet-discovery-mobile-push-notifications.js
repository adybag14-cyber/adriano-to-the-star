/**
 * Planet Discovery Mobile Push Notifications
 * Push notifications for mobile app users
 */

class PlanetDiscoveryMobilePushNotifications {
    constructor() {
        this.subscription = null;
        this.serviceWorkerRegistration = null;
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.serviceWorkerRegistration = registration;
                this.subscription = await registration.pushManager.getSubscription();
                console.log('📱 Mobile push notifications initialized');
            } catch (error) {
                console.error('Error initializing push notifications:', error);
            }
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_mo_bi_le_pu_sh_no_ti_fi_ca_ti_on_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async subscribe() {
        if (!this.serviceWorkerRegistration) {
            console.error('Service worker not available');
            return null;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
            });

            this.subscription = subscription;
            await this.saveSubscription(subscription);
            return subscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return null;
        }
    }

    async sendNotification(title, options) {
        if (!this.serviceWorkerRegistration) {
            return false;
        }

        try {
            await this.serviceWorkerRegistration.showNotification(title, {
                body: options.body || '',
                icon: options.icon || '/icon-192x192.png',
                badge: options.badge || '/badge-72x72.png',
                tag: options.tag || 'planet-discovery',
                data: options.data || {},
                requireInteraction: options.requireInteraction || false,
                actions: options.actions || []
            });
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    async notifyNewDiscovery(planetData) {
        return await this.sendNotification('New Planet Discovered!', {
            body: `${planetData.name || 'Unknown Planet'} has been discovered`,
            icon: '/icon-192x192.png',
            tag: `discovery-${planetData.kepid}`,
            data: {
                url: `/database.html?planet=${planetData.kepid}`,
                planetId: planetData.kepid
            },
            requireInteraction: true,
            actions: [
                { action: 'view', title: 'View Planet' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        });
    }

    async notifyPriceAlert(planetId, oldPrice, newPrice) {
        return await this.sendNotification('Price Alert', {
            body: `Planet price changed from $${oldPrice} to $${newPrice}`,
            tag: `price-${planetId}`,
            data: {
                url: `/marketplace.html?planet=${planetId}`,
                planetId: planetId
            }
        });
    }

    async saveSubscription(subscription) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('push_subscriptions')
                        .upsert({
                            user_id: user.id,
                            subscription: subscription.toJSON(),
                            created_at: new Date().toISOString()
                        });
                }
            } catch (error) {
                console.error('Error saving subscription:', error);
            }
        }
    }

    getVapidPublicKey() {
        // This should be set from environment or config
        return 'BEl62iUYgUivxIkv69yViEuiBIa40HIe8vO8vWbH1lRSaT7Q4ZtQ1V2u3v4w5x6y7z8a9b0c1d2e3f4g5h6';
    }

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
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryMobilePushNotifications = new PlanetDiscoveryMobilePushNotifications();
}
