/**
 * Planet Discovery Mobile App Notifications
 * Handles push notifications for mobile apps (PWA, Capacitor, etc.)
 */

class PlanetDiscoveryMobileNotifications {
    constructor() {
        this.permission = null;
        this.serviceWorkerRegistration = null;
        this.subscription = null;
        this.init();
    }

    async init() {
        // Check if running in mobile app context
        this.isMobileApp = this.detectMobileApp();
        
        // Check for service worker support
        if ('serviceWorker' in navigator) {
            await this.registerServiceWorker();
        }
        
        // Check notification permission
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
        
        console.log('📱 Mobile notifications initialized');
    }

    detectMobileApp() {
        // Check for Capacitor
        if (window.Capacitor) {
            return true;
        }
        
        // Check for Cordova
        if (window.cordova) {
            return true;
        }
        
        // Check if running in standalone mode (PWA)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        
        // Check user agent for mobile
        const ua = navigator.userAgent.toLowerCase();
        return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            this.serviceWorkerRegistration = registration;
            console.log('✅ Service Worker registered');
            
            // Check for existing subscription
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                this.subscription = subscription;
            }
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            console.warn('Notification permission denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    async subscribeToPushNotifications() {
        if (!this.serviceWorkerRegistration) {
            console.warn('Service Worker not registered');
            return false;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
            });

            this.subscription = subscription;
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        }
    }

    async sendSubscriptionToServer(subscription) {
        if (typeof supabase === 'undefined' || !supabase) {
            console.warn('Supabase not available, saving to localStorage');
            localStorage.setItem('push-subscription', JSON.stringify(subscription));
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.warn('Not authenticated, cannot save subscription');
                return;
            }

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: session.user.id,
                    subscription: subscription,
                    platform: this.detectPlatform(),
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving subscription:', error);
            }
        } catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    }

    detectPlatform() {
        if (window.Capacitor) {
            return window.Capacitor.getPlatform();
        }
        
        const ua = navigator.userAgent.toLowerCase();
        if (/android/i.test(ua)) return 'android';
        if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
        return 'web';
    }

    getVapidPublicKey() {
        // This should be set in your environment/config
        return window.VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';
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

    async sendNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) {
                return false;
            }
        }

        const defaultOptions = {
            body: options.body || '',
            icon: options.icon || '/images/planet-icon.png',
            badge: options.badge || '/images/badge-icon.png',
            tag: options.tag || 'planet-discovery',
            requireInteraction: options.requireInteraction || false,
            data: options.data || {}
        };

        if (this.serviceWorkerRegistration) {
            // Use service worker for better control
            await this.serviceWorkerRegistration.showNotification(title, defaultOptions);
        } else {
            // Fallback to regular notification
            new Notification(title, defaultOptions);
        }

        return true;
    }

    async notifyNewDiscovery(planet) {
        return await this.sendNotification('🪐 New Planet Discovered!', {
            body: `${planet.kepler_name || planet.kepoi_name} has been discovered!`,
            icon: '/images/planet-icon.png',
            tag: `discovery-${planet.kepid}`,
            data: {
                type: 'discovery',
                kepid: planet.kepid,
                url: `/database.html?planet=${planet.kepid}`
            }
        });
    }

    async notifyPriceAlert(planet, price) {
        return await this.sendNotification('💰 Price Alert', {
            body: `${planet.kepler_name} is now available for $${price}`,
            icon: '/images/marketplace-icon.png',
            tag: `price-${planet.kepid}`,
            data: {
                type: 'price-alert',
                kepid: planet.kepid,
                price: price,
                url: `/marketplace.html?planet=${planet.kepid}`
            }
        });
    }

    async notifyAchievementUnlocked(achievement) {
        return await this.sendNotification('🏅 Achievement Unlocked!', {
            body: `You've unlocked: ${achievement.name}`,
            icon: '/images/achievement-icon.png',
            tag: `achievement-${achievement.id}`,
            data: {
                type: 'achievement',
                achievementId: achievement.id,
                url: '/dashboard.html#achievements'
            }
        });
    }

    async notifyTradingActivity(activity) {
        return await this.sendNotification('📊 Trading Activity', {
            body: activity.message,
            icon: '/images/trading-icon.png',
            tag: `trading-${Date.now()}`,
            data: {
                type: 'trading',
                activityId: activity.id,
                url: '/marketplace.html'
            }
        });
    }

    renderNotificationSettings(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="notification-settings" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">📱 Notification Settings</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="color: rgba(255, 255, 255, 0.9);">Notification Permission:</span>
                        <span id="notification-permission-status" style="color: ${this.permission === 'granted' ? '#4ade80' : '#f87171'}; font-weight: 600;">
                            ${this.permission || 'Not requested'}
                        </span>
                    </div>
                    
                    <button id="request-notification-permission" style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; margin-bottom: 1rem;">
                        ${this.permission === 'granted' ? '✅ Notifications Enabled' : 'Enable Notifications'}
                    </button>
                </div>
                
                <div class="notification-options" style="display: flex; flex-direction: column; gap: 1rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="notify-discoveries" checked style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">New planet discoveries</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="notify-price-alerts" checked style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">Price alerts</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="notify-achievements" checked style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">Achievement unlocks</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="notify-trading" checked style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">Trading activity</span>
                    </label>
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 10px;">
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0;">
                        💡 Notifications work best when the app is installed as a PWA or mobile app.
                    </p>
                </div>
            </div>
        `;

        // Setup event listeners
        document.getElementById('request-notification-permission')?.addEventListener('click', async () => {
            const granted = await this.requestPermission();
            if (granted) {
                await this.subscribeToPushNotifications();
                this.renderNotificationSettings(containerId); // Refresh
            }
        });

        // Save notification preferences
        ['notify-discoveries', 'notify-price-alerts', 'notify-achievements', 'notify-trading'].forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.saveNotificationPreferences();
                });
            }
        });
    }

    saveNotificationPreferences() {
        const preferences = {
            discoveries: document.getElementById('notify-discoveries')?.checked || false,
            priceAlerts: document.getElementById('notify-price-alerts')?.checked || false,
            achievements: document.getElementById('notify-achievements')?.checked || false,
            trading: document.getElementById('notify-trading')?.checked || false
        };

        localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    }

    loadNotificationPreferences() {
        const saved = localStorage.getItem('notification-preferences');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            discoveries: true,
            priceAlerts: true,
            achievements: true,
            trading: true
        };
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryMobileNotifications = new PlanetDiscoveryMobileNotifications();
}

