/**
 * Planet Trading Notifications System
 * Real-time alerts for marketplace activity
 */

class PlanetTradingNotifications {
    constructor() {
        this.notifications = [];
        this.preferences = {
            newListings: true,
            priceChanges: true,
            offers: true,
            sales: true,
            transfers: true
        };
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadPreferences();
        this.loadNotifications();
        this.isInitialized = true;
        console.log('🔔 Planet Trading Notifications initialized');
    }

    loadPreferences() {
        try {
            const stored = localStorage.getItem('trading-notification-preferences');
            if (stored) this.preferences = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('trading-notification-preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    loadNotifications() {
        try {
            const stored = localStorage.getItem('trading-notifications');
            if (stored) this.notifications = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('trading-notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    createNotification(type, data) {
        if (!this.preferences[type]) return;

        const notification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            type: type,
            title: this.getNotificationTitle(type),
            message: this.getNotificationMessage(type, data),
            data: data,
            read: false,
            createdAt: new Date().toISOString()
        };

        this.notifications.unshift(notification);
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
        this.saveNotifications();
        this.showBrowserNotification(notification);
        return notification;
    }

    getNotificationTitle(type) {
        const titles = {
            newListings: 'New Planet Listing',
            priceChanges: 'Price Change',
            offers: 'New Offer',
            sales: 'Planet Sold',
            transfers: 'Ownership Transfer'
        };
        return titles[type] || 'Trading Update';
    }

    getNotificationMessage(type, data) {
        const messages = {
            newListings: `${data.planetName} is now available for ${data.price} ETH`,
            priceChanges: `${data.planetName} price changed to ${data.newPrice} ETH`,
            offers: `You received an offer of ${data.offerAmount} ETH for ${data.planetName}`,
            sales: `${data.planetName} was sold for ${data.price} ETH`,
            transfers: `${data.planetName} ownership transferred to ${data.newOwner}`
        };
        return messages[type] || 'Trading activity update';
    }

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
            });
        }
    }

    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
    }

    renderNotifications(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;

        container.innerHTML = `
            <div class="trading-notifications" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🔔 Trading Notifications ${unreadCount > 0 ? `<span style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 50%; font-size: 0.8rem; margin-left: 0.5rem;">${unreadCount}</span>` : ''}</h3>
                    <button id="mark-all-read-btn" style="padding: 0.5rem 1rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
                        Mark All Read
                    </button>
                </div>
                <div class="notifications-list">${this.renderNotificationsList()}</div>
            </div>
        `;

        document.getElementById('mark-all-read-btn')?.addEventListener('click', () => {
            this.markAllAsRead();
            this.renderNotifications(containerId);
        });
    }

    renderNotificationsList() {
        if (this.notifications.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No notifications yet</p>';
        }

        return this.notifications.slice(0, 20).map(notif => `
            <div class="notification-item" data-id="${notif.id}" style="padding: 1rem; background: ${notif.read ? 'rgba(0, 0, 0, 0.3)' : 'rgba(186, 148, 79, 0.1)'}; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem; cursor: pointer;" onclick="planetTradingNotifications.markAsRead('${notif.id}'); this.style.background='rgba(0, 0, 0, 0.3)'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.25rem;">${notif.title}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">${notif.message}</div>
                    </div>
                    ${!notif.read ? '<div style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; margin-left: 1rem;"></div>' : ''}
                </div>
                <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; margin-top: 0.5rem;">${new Date(notif.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetTradingNotifications = PlanetTradingNotifications;
    window.planetTradingNotifications = new PlanetTradingNotifications();
}

