/**
 * Comprehensive Notification System with Multiple Channels
 * 
 * Implements comprehensive notification system with multiple channels.
 * 
 * @module NotificationSystemMultiChannel
 * @version 1.0.0
 * @author Adriano To The Star
 */

class NotificationSystemMultiChannel {
    constructor() {
        this.notifications = [];
        this.channels = new Map();
        this.permissions = {};
        this.isInitialized = false;
    }

    /**
     * Initialize notification system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('NotificationSystemMultiChannel already initialized');
            return;
        }

        this.setupChannels();
        this.requestPermissions();
        this.injectStyles();
        
        this.isInitialized = true;
        console.log('✅ Notification System initialized');
    }

    /**
     * Set up notification channels
     * @private
     */
    setupChannels() {
        // Browser notifications
        this.channels.set('browser', {
            enabled: 'Notification' in window,
            send: this.sendBrowserNotification.bind(this)
        });

        // In-app notifications
        this.channels.set('in-app', {
            enabled: true,
            send: this.sendInAppNotification.bind(this)
        });

        // Toast notifications
        this.channels.set('toast', {
            enabled: true,
            send: this.sendToastNotification.bind(this)
        });

        // Console notifications (for debugging)
        this.channels.set('console', {
            enabled: true,
            send: this.sendConsoleNotification.bind(this)
        });
    }

    /**
     * Request permissions
     * @private
     */
    async requestPermissions() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                this.permissions.browser = await Notification.requestPermission();
            } catch (e) {
                console.warn('Failed to request notification permission:', e);
            }
        } else if ('Notification' in window) {
            this.permissions.browser = Notification.permission;
        }
    }

    /**
     * Send notification
     * @public
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @returns {Promise} Notification result
     */
    async notify(title, options = {}) {
        const {
            body = '',
            icon = null,
            badge = null,
            image = null,
            tag = null,
            requireInteraction = false,
            silent = false,
            channels = ['in-app', 'toast'],
            priority = 'normal',
            actions = [],
            data = {}
        } = options;

        const notification = {
            id: Date.now() + Math.random(),
            title,
            body,
            icon,
            badge,
            image,
            tag,
            requireInteraction,
            silent,
            channels,
            priority,
            actions,
            data,
            timestamp: Date.now()
        };

        this.notifications.push(notification);

        // Send to each channel
        const results = [];
        for (const channelName of channels) {
            const channel = this.channels.get(channelName);
            if (channel && channel.enabled) {
                try {
                    const result = await channel.send(notification);
                    results.push({ channel: channelName, success: true, result });
                } catch (error) {
                    results.push({ channel: channelName, success: false, error });
                }
            }
        }

        return results;
    }

    /**
     * Send browser notification
     * @private
     * @param {Object} notification - Notification object
     * @returns {Promise} Notification result
     */
    async sendBrowserNotification(notification) {
        if (!('Notification' in window) || this.permissions.browser !== 'granted') {
            throw new Error('Browser notifications not available or not permitted');
        }

        const options = {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            image: notification.image,
            tag: notification.tag,
            requireInteraction: notification.requireInteraction,
            silent: notification.silent,
            data: notification.data
        };

        const browserNotification = new Notification(notification.title, options);

        // Handle click
        browserNotification.onclick = () => {
            window.focus();
            browserNotification.close();
            if (notification.data.url) {
                window.location.href = notification.data.url;
            }
        };

        // Auto-close after 5 seconds unless requireInteraction
        if (!notification.requireInteraction) {
            setTimeout(() => browserNotification.close(), 5000);
        }

        return browserNotification;
    }

    /**
     * Send in-app notification
     * @private
     * @param {Object} notification - Notification object
     * @returns {Promise} Notification result
     */
    async sendInAppNotification(notification) {
        const container = this.getNotificationContainer();
        const element = this.createNotificationElement(notification);
        
        container.appendChild(element);

        // Animate in
        requestAnimationFrame(() => {
            element.classList.add('show');
        });

        // Auto-remove after delay
        if (!notification.requireInteraction) {
            setTimeout(() => {
                this.removeNotification(element);
            }, 5000);
        }

        return element;
    }

    /**
     * Send toast notification
     * @private
     * @param {Object} notification - Notification object
     * @returns {Promise} Notification result
     */
    async sendToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${notification.priority}`;
        toast.innerHTML = `
            ${notification.icon ? `<img src="${notification.icon}" class="toast-icon">` : ''}
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                ${notification.body ? `<div class="toast-body">${notification.body}</div>` : ''}
            </div>
            <button class="toast-close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto-remove
        if (!notification.requireInteraction) {
            setTimeout(() => {
                this.removeToast(toast);
            }, 3000);
        }

        return toast;
    }

    /**
     * Send console notification
     * @private
     * @param {Object} notification - Notification object
     * @returns {Promise} Notification result
     */
    async sendConsoleNotification(notification) {
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const icon = emoji[notification.priority] || '📢';
        console.log(`${icon} ${notification.title}`, notification.body || '');
        return { logged: true };
    }

    /**
     * Get notification container
     * @private
     * @returns {HTMLElement} Container element
     */
    getNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Create notification element
     * @private
     * @param {Object} notification - Notification object
     * @returns {HTMLElement} Notification element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.priority}`;
        element.dataset.notificationId = notification.id;
        element.innerHTML = `
            ${notification.icon ? `<img src="${notification.icon}" class="notification-icon">` : ''}
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                ${notification.body ? `<div class="notification-body">${notification.body}</div>` : ''}
            </div>
            <button class="notification-close">&times;</button>
        `;

        element.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(element);
        });

        if (notification.data.url) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => {
                window.location.href = notification.data.url;
            });
        }

        return element;
    }

    /**
     * Remove notification
     * @private
     * @param {HTMLElement} element - Notification element
     */
    removeNotification(element) {
        element.classList.add('hide');
        setTimeout(() => {
            element.remove();
        }, 300);
    }

    /**
     * Remove toast
     * @private
     * @param {HTMLElement} toast - Toast element
     */
    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('notification-system-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'notification-system-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }

            .notification {
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }

            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .notification.hide {
                opacity: 0;
                transform: translateX(100%);
            }

            .notification-info {
                border-left: 4px solid #3b82f6;
            }

            .notification-success {
                border-left: 4px solid #10b981;
            }

            .notification-warning {
                border-left: 4px solid #f59e0b;
            }

            .notification-error {
                border-left: 4px solid #ef4444;
            }

            .toast-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                opacity: 0;
                transform: translateY(100%);
                transition: all 0.3s ease;
                z-index: 10000;
            }

            .toast-notification.show {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
window.NotificationSystemMultiChannel = NotificationSystemMultiChannel;
window.notifications = new NotificationSystemMultiChannel();
window.notifications.init();

