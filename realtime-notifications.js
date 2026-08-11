/**
 * Real-Time Notifications System
 * 
 * Provides real-time notifications for:
 * - Planet claim events
 * - New planet discoveries
 * - User activity updates
 * - System announcements
 * 
 * Supports:
 * - WebSocket connections (if backend available)
 * - Browser Push Notifications (with permission)
 * - In-app notifications
 * - Polling fallback for static sites
 * 
 * @class RealTimeNotifications
 * @example
 * const notifications = new RealTimeNotifications();
 * notifications.subscribe('planet-claimed', (data) => {
 *   console.log('Planet claimed:', data);
 * });
 */
class RealTimeNotifications {
    constructor() {
        this.ws = null;
        this.wsUrl = null; // Will be set if backend is available
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.subscribers = new Map(); // Event type -> callback array
        this.notificationQueue = [];
        this.isPolling = false;
        this.pollInterval = null;
        this.reconnectTimeout = null; // Store reconnect timeout for cleanup
        this.lastPollTime = Date.now();
        this.pushPermission = null;
        this.storageHandler = null; // Store event handler for cleanup
        this.planetClaimedHandler = null; // Store event handler for cleanup
        this.newDiscoveryHandler = null; // Store event handler for cleanup
        this.init();
    }

    /**
     * Initialize the notification system
     */
    async init() {
        // Request push notification permission
        await this.requestPushPermission();

        // Try to connect via WebSocket
        this.tryWebSocketConnection();

        // If WebSocket fails, fall back to polling
        setTimeout(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.startPolling();
            }
        }, 2000);

        // Listen for planet claim events (local)
        this.setupLocalEventListeners();

        console.log('🔔 Real-time notifications system initialized');
    }

    /**
     * Request browser push notification permission
     */
    async requestPushPermission() {
        if (!('Notification' in window)) {
            console.log('⚠️ Browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            this.pushPermission = 'granted';
            return;
        }

        if (Notification.permission !== 'denied') {
            // Don't request automatically - let user request it
            // User can enable via settings
            this.pushPermission = Notification.permission;
        }
    }

    /**
     * Enable push notifications (user-initiated)
     */
    async enablePushNotifications() {
        if (!('Notification' in window)) {
            return false;
        }

        const permission = await Notification.requestPermission();
        this.pushPermission = permission;

        if (permission === 'granted') {
            this.showInAppNotification('Push notifications enabled!', 'success');
            return true;
        }

        return false;
    }

    /**
     * Try to connect via WebSocket
     */
    tryWebSocketConnection() {
        // Don't create multiple connections
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        const configuredUrl = (typeof window !== 'undefined'
            && typeof window.NOTIFICATIONS_WS_URL === 'string'
            && window.NOTIFICATIONS_WS_URL)
            ? window.NOTIFICATIONS_WS_URL
            : null;

        // Opt-in only: avoid noisy browser console errors when no WS backend exists.
        if (!configuredUrl) {
            if (!this.isPolling) {
                this.startPolling();
            }
            return;
        }

        const url = configuredUrl;
        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.ws = ws;
                this.reconnectAttempts = 0;
                this.stopPolling(); // Stop polling if WebSocket works
                this.setupWebSocketHandlers();
            };

            ws.onerror = () => {
                // Browser will log connection errors for unreachable WS endpoints.
                // Avoid adding extra noise here; fallback handled by timeout / polling.
            };

            ws.onclose = () => {
                this.ws = null;
                // Only reconnect if not manually closed
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.handleReconnect();
                }
            };
        } catch (error) {
            console.log('WebSocket connection failed:', error);
            // Fall back to polling immediately
            if (!this.isPolling) {
                this.startPolling();
            }
        }
    }

    /**
     * Setup WebSocket message handlers
     */
    setupWebSocketHandlers() {
        if (!this.ws) return;

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleNotification(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }

    /**
     * Handle reconnection logic
     */
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached, using polling');
            this.startPolling();
            return;
        }

        this.reconnectAttempts++;
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = setTimeout(() => {
            this.tryWebSocketConnection();
            this.reconnectTimeout = null;
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    /**
     * Start polling for updates (fallback for static sites)
     */
    startPolling() {
        if (this.isPolling) return;

        this.isPolling = true;
        console.log('📡 Starting polling for updates...');

        // Poll every 30 seconds
        this.pollInterval = setInterval(() => {
            this.pollForUpdates();
        }, 30000);

        // Initial poll
        this.pollForUpdates();
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isPolling = false;
    }

    /**
     * Poll for updates (check localStorage, Supabase, or API)
     */
    async pollForUpdates() {
        // Check for new planet claims (via localStorage or Supabase)
        const lastCheck = this.lastPollTime;
        this.lastPollTime = Date.now();

        // Check localStorage for recent claims
        try {
            const recentClaims = this.getRecentClaims(lastCheck);
            if (recentClaims.length > 0) {
                recentClaims.forEach(claim => {
                    this.handleNotification({
                        type: 'planet-claimed',
                        data: claim,
                        timestamp: Date.now()
                    });
                });
            }
        } catch (error) {
            console.error('Error polling for updates:', error);
        }
    }

    /**
     * Get recent claims from localStorage
     */
    getRecentClaims(since) {
        try {
            const claimsStr = localStorage.getItem('planet_claims');
            if (!claimsStr) return [];

            const claims = JSON.parse(claimsStr);
            return claims.filter(claim => {
                const claimTime = claim.timestamp || claim.claimedAt || 0;
                return claimTime > since;
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Setup local event listeners (DOM events, localStorage changes)
     */
    setupLocalEventListeners() {
        // Listen for storage changes (cross-tab communication)
        this.storageHandler = (e) => {
            if (e.key === 'planet_claims' && e.newValue) {
                try {
                    const claims = JSON.parse(e.newValue);
                    const latestClaim = claims[claims.length - 1];
                    if (latestClaim) {
                        this.handleNotification({
                            type: 'planet-claimed',
                            data: latestClaim,
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    console.error('Error handling storage event:', error);
                }
            }
        };
        window.addEventListener('storage', this.storageHandler);

        // Listen for custom events
        this.planetClaimedHandler = (e) => {
            this.handleNotification({
                type: 'planet-claimed',
                data: e.detail,
                timestamp: Date.now()
            });
        };
        window.addEventListener('planet-claimed', this.planetClaimedHandler);

        this.newDiscoveryHandler = (e) => {
            this.handleNotification({
                type: 'new-discovery',
                data: e.detail,
                timestamp: Date.now()
            });
        };
        window.addEventListener('new-discovery', this.newDiscoveryHandler);
    }

    /**
     * Handle incoming notification
     */
    handleNotification(notification) {
        const { type, data, timestamp } = notification;

        // Show in-app notification
        this.showInAppNotification(
            this.formatNotificationMessage(type, data),
            this.getNotificationType(type)
        );

        // Show browser notification if permission granted
        if (this.pushPermission === 'granted') {
            this.showBrowserNotification(
                this.formatNotificationTitle(type),
                this.formatNotificationMessage(type, data)
            );
        }

        // Notify subscribers
        const callbacks = this.subscribers.get(type) || [];
        callbacks.forEach(callback => {
            try {
                callback(data, timestamp);
            } catch (error) {
                console.error('Error in notification callback:', error);
            }
        });

        // Also notify 'all' subscribers
        const allCallbacks = this.subscribers.get('all') || [];
        allCallbacks.forEach(callback => {
            try {
                callback(type, data, timestamp);
            } catch (error) {
                console.error('Error in notification callback:', error);
            }
        });
    }

    /**
     * Format notification message
     */
    formatNotificationMessage(type, data) {
        switch (type) {
            case 'planet-claimed':
                const planetName = data.planetName || data.name || `Planet ${data.kepid}`;
                const userName = data.userName || 'Someone';
                return `${userName} claimed ${planetName}!`;
            case 'new-discovery':
                return `New planet discovered: ${data.name || 'Unknown'}`;
            case 'user-activity':
                return data.message || 'New user activity';
            case 'system':
                return data.message || 'System notification';
            default:
                return data.message || 'New notification';
        }
    }

    /**
     * Format notification title
     */
    formatNotificationTitle(type) {
        switch (type) {
            case 'planet-claimed':
                return '🌍 Planet Claimed';
            case 'new-discovery':
                return '🔭 New Discovery';
            case 'user-activity':
                return '👤 User Activity';
            case 'system':
                return '⚙️ System';
            default:
                return '🔔 Notification';
        }
    }

    /**
     * Get notification type for styling
     */
    getNotificationType(type) {
        switch (type) {
            case 'planet-claimed':
                return 'success';
            case 'new-discovery':
                return 'info';
            case 'user-activity':
                return 'info';
            case 'system':
                return 'info';
            default:
                return 'info';
        }
    }

    /**
     * Show in-app notification
     */
    showInAppNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.databaseAdvancedFeatures && window.databaseAdvancedFeatures.showNotification) {
            window.databaseAdvancedFeatures.showNotification(message, type);
            return;
        }

        // Fallback: create simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10002;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Store timeout for potential cleanup (though notification will be removed anyway)
        const removeTimeout = setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            const finalTimeout = setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
            // Store final timeout on notification element for cleanup if needed
            notification._finalTimeout = finalTimeout;
        }, 3000);
        notification._removeTimeout = removeTimeout;
    }

    /**
     * Get notification color by type
     */
    getNotificationColor(type) {
        switch (type) {
            case 'success':
                return 'rgba(74, 222, 128, 0.9)';
            case 'error':
                return 'rgba(239, 68, 68, 0.9)';
            case 'warning':
                return 'rgba(251, 191, 36, 0.9)';
            default:
                return 'rgba(96, 165, 250, 0.9)';
        }
    }

    /**
     * Show browser push notification
     */
    showBrowserNotification(title, message) {
        if (this.pushPermission !== 'granted') return;

        try {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'planet-notification',
                requireInteraction: false
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => notification.close(), 5000);
        } catch (error) {
            console.error('Error showing browser notification:', error);
        }
    }

    /**
     * Subscribe to notification events
     * @param {string} eventType - Event type ('planet-claimed', 'new-discovery', 'all', etc.)
     * @param {Function} callback - Callback function
     */
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(callback);
    }

    /**
     * Unsubscribe from notification events
     */
    unsubscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) return;

        const callbacks = this.subscribers.get(eventType);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Send notification (for testing or manual triggers)
     */
    sendNotification(type, data) {
        this.handleNotification({
            type,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPolling();

        // Clear reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Remove event listeners
        if (this.storageHandler) {
            window.removeEventListener('storage', this.storageHandler);
            this.storageHandler = null;
        }
        if (this.planetClaimedHandler) {
            window.removeEventListener('planet-claimed', this.planetClaimedHandler);
            this.planetClaimedHandler = null;
        }
        if (this.newDiscoveryHandler) {
            window.removeEventListener('new-discovery', this.newDiscoveryHandler);
            this.newDiscoveryHandler = null;
        }

        this.subscribers.clear();
    }
}

// Initialize global instance
let realTimeNotificationsInstance = null;

function initRealTimeNotifications() {
    if (!realTimeNotificationsInstance) {
        realTimeNotificationsInstance = new RealTimeNotifications();
    }
    return realTimeNotificationsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealTimeNotifications);
} else {
    initRealTimeNotifications();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeNotifications;
}

// Make available globally
window.RealTimeNotifications = RealTimeNotifications;
window.realTimeNotifications = () => realTimeNotificationsInstance;

