/**
 * Push Notifications Manager
 * Uses Firebase Cloud Messaging (FCM) for push notifications via Google Cloud
 * Much easier than VAPID keys - integrates with your Google Cloud project
 * 
 * ⚠️ SECURITY WARNING: If using Web Push (non-Firebase), NEVER hardcode private VAPID keys here.
 */

class PushNotificationManager {
    constructor() {
        this.registration = null;
        this.messaging = null;
        this.fcmToken = null;
        this.useFirebase = false;
        this.init();
    }

    async init() {
        // Check if Firebase is configured
        if (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.enabled) {
            await this.initFirebase();
        } else {
            // Fallback to standard Web Push API (requires VAPID keys)
            await this.initWebPush();
        }
    }

    async initFirebase() {
        try {
            // Import Firebase SDK
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');

            // Initialize Firebase
            const app = initializeApp(FIREBASE_CONFIG);
            this.messaging = getMessaging(app);
            this.useFirebase = true;

            console.log('✅ Firebase Cloud Messaging initialized');

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.getFCMToken();
                this.setupFirebaseMessageListener();
            } else {
                console.warn('⚠️ Notification permission denied');
            }
        } catch (error) {
            console.error('❌ Error initializing Firebase:', error);
            console.log('Falling back to Web Push API...');
            await this.initWebPush();
        }
    }

    async initWebPush() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                this.registration = await navigator.serviceWorker.ready;
                console.log('✅ Service Worker ready for push notifications (Web Push API)');
                await this.checkSubscription();
            } catch (error) {
                console.error('❌ Error initializing push notifications:', error);
            }
        } else {
            console.warn('⚠️ Push notifications not supported in this browser');
        }
    }

    async getFCMToken() {
        if (!this.messaging) return null;

        try {
            this.fcmToken = await getToken(this.messaging, {
                vapidKey: FIREBASE_CONFIG.vapidKey || undefined
            });

            if (this.fcmToken) {
                console.log('✅ FCM Token obtained:', this.fcmToken);
                await this.sendTokenToServer(this.fcmToken);
                this.updateUI(true);
                return this.fcmToken;
            } else {
                console.warn('⚠️ No FCM token available');
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting FCM token:', error);
            return null;
        }
    }

    setupFirebaseMessageListener() {
        if (!this.messaging) return;

        // Handle foreground messages
        onMessage(this.messaging, (payload) => {
            console.log('📬 Message received:', payload);
            this.showNotification(payload);
        });
    }

    showNotification(payload) {
        const title = payload.notification?.title || 'Adriano To The Star';
        const options = {
            body: payload.notification?.body || payload.data?.body || 'You have a new notification',
            icon: payload.notification?.icon || './images/icon-192x192.png',
            badge: './images/icon-192x192.png',
            tag: payload.data?.tag || 'default',
            data: payload.data || {},
            requireInteraction: false
        };

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
    }

    async sendTokenToServer(token) {
        // Store token locally
        localStorage.setItem('fcm_token', token);
        console.log('💾 FCM token saved locally');

        // In production, send to your backend/Google Cloud Function:
        // await fetch('https://your-cloud-function-url/save-token', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         userId: currentUser?.id,
        //         token: token
        //     })
        // });
    }

    async checkSubscription() {
        if (this.useFirebase) {
            // Check for FCM token
            const storedToken = localStorage.getItem('fcm_token');
            if (storedToken) {
                this.fcmToken = storedToken;
                console.log('✅ FCM token found');
                this.updateUI(true);
            } else {
                console.log('ℹ️ Not subscribed to push notifications');
                this.updateUI(false);
            }
        } else {
            // Check Web Push subscription
            try {
                this.subscription = await this.registration.pushManager.getSubscription();
                if (this.subscription) {
                    console.log('✅ Already subscribed to push notifications');
                    this.updateUI(true);
                } else {
                    console.log('ℹ️ Not subscribed to push notifications');
                    this.updateUI(false);
                }
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        }
    }

    async subscribe() {
        if (this.useFirebase && this.messaging) {
            // Use Firebase Cloud Messaging
            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('Notification permission denied. Please enable notifications in your browser settings.');
                    return false;
                }

                const token = await this.getFCMToken();
                if (token) {
                    console.log('✅ Subscribed to Firebase Cloud Messaging');
                    return true;
                } else {
                    alert('Failed to get FCM token. Please check your Firebase configuration.');
                    return false;
                }
            } catch (error) {
                console.error('Error subscribing to FCM:', error);
                alert('Failed to subscribe: ' + error.message);
                return false;
            }
        } else {
            // Fallback to Web Push API (requires VAPID keys)
            if (!this.registration) {
                alert('Service Worker not ready. Please wait and try again.');
                return false;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('Notification permission denied. Please enable notifications in your browser settings.');
                    return false;
                }

                // Note: This requires VAPID keys
                alert('Web Push API requires VAPID keys. Please configure Firebase Cloud Messaging instead (easier setup with Google Cloud).');
                return false;
            } catch (error) {
                console.error('Error subscribing to push notifications:', error);
                alert('Failed to subscribe: ' + error.message);
                return false;
            }
        }
    }

    async unsubscribe() {
        if (this.useFirebase) {
            // For Firebase, we can't directly unsubscribe, but we can delete the token
            localStorage.removeItem('fcm_token');
            this.fcmToken = null;
            this.updateUI(false);
            console.log('✅ FCM token removed');
            return true;
        } else {
            // Web Push API unsubscribe
            if (!this.subscription) {
                return false;
            }

            try {
                const successful = await this.subscription.unsubscribe();
                if (successful) {
                    console.log('✅ Unsubscribed from push notifications');
                    this.subscription = null;
                    this.updateUI(false);
                    return true;
                }
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
            return false;
        }
    }

    updateUI(isSubscribed) {
        // Update UI elements if they exist
        const subscribeBtn = document.getElementById('subscribe-push-btn');
        const unsubscribeBtn = document.getElementById('unsubscribe-push-btn');

        if (subscribeBtn) subscribeBtn.style.display = isSubscribed ? 'none' : 'block';
        if (unsubscribeBtn) unsubscribeBtn.style.display = isSubscribed ? 'block' : 'none';
    }

    // Send a test notification (for development)
    async sendTestNotification() {
        if (this.useFirebase && !this.fcmToken) {
            alert('Please subscribe to push notifications first');
            return;
        }

        // Show a local notification for testing
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Test Notification', {
                body: 'This is a test push notification from Adriano To The Star!',
                icon: './images/icon-192x192.png',
                badge: './images/icon-192x192.png',
                tag: 'test',
                requireInteraction: false
            });
        } else {
            alert('Please enable notifications first');
        }
    }

    // Get current FCM token (for sending from backend)
    getToken() {
        return this.fcmToken;
    }
}

// Initialize push notification manager
if (typeof window !== 'undefined') {
    window.pushNotificationManager = new PushNotificationManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PushNotificationManager;
}

