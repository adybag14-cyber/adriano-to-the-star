/**
 * Smart Notifications System
 * AI-powered intelligent notification system
 */

class SmartNotificationsSystem {
    constructor() {
        this.preferences = {};
        this.notificationQueue = [];
        this.init();
    }
    
    init() {
        this.loadPreferences();
        this.requestPermission();
    }
    
    loadPreferences() {
        // Load user notification preferences
        try {
            const stored = localStorage.getItem('notification_preferences');
            this.preferences = stored ? JSON.parse(stored) : {
                enabled: true,
                quietHours: { start: 22, end: 8 },
                categories: {
                    important: true,
                    updates: true,
                    social: true,
                    marketing: false
                }
            };
        } catch (e) {
            this.preferences = { enabled: true };
        }
    }
    
    requestPermission() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    async shouldSendNotification(notification) {
        // AI decision on whether to send notification
        if (!this.preferences.enabled) {
            return false;
        }
        
        // Check quiet hours
        if (this.isQuietHours()) {
            return notification.priority === 'high';
        }
        
        // Check category preferences
        if (!this.preferences.categories[notification.category]) {
            return false;
        }
        
        // Check user engagement (don't spam)
        const recentNotifications = this.getRecentNotifications(5 * 60 * 1000); // Last 5 minutes
        if (recentNotifications.length > 3) {
            return notification.priority === 'high';
        }
        
        // Predict if user will engage
        if (window.userBehaviorPrediction) {
            const prediction = await window.userBehaviorPrediction.predictClick(
                notification.userId,
                notification.itemId,
                { type: 'notification' }
            );
            
            return prediction.probability > 0.3;
        }
        
        return true;
    }
    
    isQuietHours() {
        const now = new Date();
        const hour = now.getHours();
        const quietHours = this.preferences.quietHours || { start: 22, end: 8 };
        
        return hour >= quietHours.start || hour < quietHours.end;
    }
    
    getRecentNotifications(timeWindow) {
        const now = Date.now();
        return this.notificationQueue.filter(n => 
            (now - n.timestamp) < timeWindow
        );
    }
    
    async sendNotification(notification) {
        // Send notification if approved
        const shouldSend = await this.shouldSendNotification(notification);
        
        if (!shouldSend) {
            return { sent: false, reason: 'filtered' };
        }
        
        // Add to queue
        this.notificationQueue.push({
            ...notification,
            timestamp: Date.now()
        });
        
        // Send browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon || '/icon.png',
                badge: notification.badge,
                tag: notification.tag,
                requireInteraction: notification.priority === 'high'
            });
            
            browserNotification.onclick = () => {
                if (notification.url) {
                    window.open(notification.url);
                }
                browserNotification.close();
            };
            
            return { sent: true, notification: browserNotification };
        }
        
        // Fallback to in-app notification
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(notification.body, notification.type || 'info');
            return { sent: true, method: 'toast' };
        }
        
        return { sent: false, reason: 'no_permission' };
    }
    
    async scheduleNotification(notification, delay) {
        // Schedule notification for later
        setTimeout(() => {
            this.sendNotification(notification);
        }, delay);
    }
    
    async batchNotifications(notifications) {
        // Batch and prioritize notifications
        const sorted = notifications.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        });
        
        // Send top 3
        const toSend = sorted.slice(0, 3);
        return await Promise.all(
            toSend.map(n => this.sendNotification(n))
        );
    }
    
    updatePreferences(newPreferences) {
        this.preferences = { ...this.preferences, ...newPreferences };
        try {
            localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
        } catch (e) {
            console.warn('Could not save preferences:', e);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.smartNotificationsSystem = new SmartNotificationsSystem(); });
} else {
    window.smartNotificationsSystem = new SmartNotificationsSystem();
}

