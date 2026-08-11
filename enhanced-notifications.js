/**
 * Enhanced Notification System
 * 
 * Advanced notification system with support for multiple types, priorities,
 * persistent notifications, action buttons, history, and sound notifications.
 * 
 * @class EnhancedNotifications
 * @example
 * // Auto-initializes on page load
 * // Access via: window.enhancedNotifications() or window.showNotification()
 * 
 * // Show a notification
 * showNotification('Operation successful!', 'success');
 * 
 * // Show notification with actions
 * const notif = window.enhancedNotifications();
 * notif.show('Confirm action?', 'info', {
 *   title: 'Confirmation',
 *   persistent: true,
 *   actions: [
 *     { label: 'Yes', callback: () => console.log('Yes!') },
 *     { label: 'No', callback: () => console.log('No!') }
 *   ]
 * });
 */
class EnhancedNotifications {
    constructor() {
        this.notifications = [];
        this.maxVisible = 5;
        this.defaultDuration = 5000;
        this.container = null;
        this.settings = {
            sound: false,
            position: 'bottom-right',
            maxHistory: 50
        };
        this.init();
    }

    init() {
        // Load settings
        this.loadSettings();
        
        // Create container
        this.createContainer();
        
        // Load notification history
        this.loadHistory();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('✅ Enhanced Notifications initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_nh_an_ce_dn_ot_if_ic_at_io_ns_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Load settings
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem('notification-settings');
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.warn('Failed to load notification settings:', error);
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        try {
            localStorage.setItem('notification-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save notification settings:', error);
        }
    }

    /**
     * Create container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `enhanced-notifications-container enhanced-notifications-${this.settings.position}`;
        this.container.id = 'enhanced-notifications-container';
        document.body.appendChild(this.container);
        this.injectStyles();
    }

    /**
     * Show a notification
     * 
     * @method show
     * @param {string} message - Notification message text
     * @param {string} [type='info'] - Notification type (success, error, warning, info)
     * @param {Object} [options={}] - Notification options
     * @param {string} [options.title] - Notification title
     * @param {string} [options.icon] - Custom icon emoji
     * @param {number} [options.duration=5000] - Auto-dismiss duration in ms (0 for persistent)
     * @param {boolean} [options.persistent=false] - If true, notification won't auto-dismiss
     * @param {Array} [options.actions=[]] - Array of action button objects
     * @param {string} [options.actions[].label] - Action button label
     * @param {Function} [options.actions[].callback] - Action button callback
     * @param {boolean} [options.actions[].dismiss=true] - Whether to dismiss on action
     * @param {string} [options.priority='normal'] - Priority level (normal, high)
     * @param {string} [options.category='general'] - Notification category
     * @param {boolean} [options.silent=false] - If true, don't play sound
     * @returns {string} Notification ID
     */
    show(message, type = 'info', options = {}) {
        const notification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            message: this.escapeHtml(message),
            type: type,
            title: options.title || this.getDefaultTitle(type),
            icon: options.icon || this.getDefaultIcon(type),
            duration: options.duration !== undefined ? options.duration : this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            timestamp: Date.now(),
            priority: options.priority || 'normal',
            category: options.category || 'general'
        };

        this.notifications.push(notification);
        this.renderNotification(notification);
        this.saveToHistory(notification);

        // Play sound if enabled
        if (this.settings.sound && !options.silent) {
            this.playSound(type);
        }

        return notification.id;
    }

    /**
     * Get default title
     */
    getDefaultTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }

    /**
     * Get default icon
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📢';
    }

    /**
     * Render notification
     */
    renderNotification(notification) {
        const element = document.createElement('div');
        element.className = `enhanced-notification enhanced-notification-${notification.type}`;
        element.dataset.notificationId = notification.id;
        element.dataset.priority = notification.priority;

        let actionsHtml = '';
        if (notification.actions.length > 0) {
            actionsHtml = `
                <div class="notification-actions">
                    ${notification.actions.map((action, index) => `
                        <button class="notification-action-btn" data-action-index="${index}">
                            ${this.escapeHtml(action.label)}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${notification.icon}</div>
                <div class="notification-body">
                    ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
                    <div class="notification-message">${notification.message}</div>
                    ${actionsHtml}
                </div>
                <button class="notification-close" data-notification-id="${notification.id}">×</button>
            </div>
            ${!notification.persistent ? `<div class="notification-progress"></div>` : ''}
        `;

        // Add to container
        this.container.appendChild(element);

        // Animate in
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        });

        // Setup event listeners
        element.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification.id);
        });

        // Action buttons
        element.querySelectorAll('.notification-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.actionIndex);
                const action = notification.actions[index];
                if (action && action.callback) {
                    action.callback();
                }
                if (action && action.dismiss !== false) {
                    this.remove(notification.id);
                }
            });
        });

        // Auto-remove if not persistent
        if (!notification.persistent && notification.duration > 0) {
            // Progress bar animation
            const progressBar = element.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${notification.duration}ms`;
            }

            setTimeout(() => {
                this.remove(notification.id);
            }, notification.duration);
        }

        // Limit visible notifications
        this.limitVisible();
    }

    /**
     * Remove notification
     */
    remove(id) {
        const element = this.container.querySelector(`[data-notification-id="${id}"]`);
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
            }, 300);
        }

        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    /**
     * Remove all notifications
     */
    removeAll() {
        this.notifications.forEach(notif => {
            this.remove(notif.id);
        });
    }

    /**
     * Limit visible notifications
     */
    limitVisible() {
        const visible = this.container.querySelectorAll('.enhanced-notification');
        if (visible.length > this.maxVisible) {
            // Remove oldest
            const toRemove = Array.from(visible).slice(0, visible.length - this.maxVisible);
            toRemove.forEach(el => {
                const id = el.dataset.notificationId;
                this.remove(id);
            });
        }
    }

    /**
     * Save to history
     */
    saveToHistory(notification) {
        try {
            let history = [];
            const stored = localStorage.getItem('notification-history');
            if (stored) {
                history = JSON.parse(stored);
            }

            history.push({
                ...notification,
                message: notification.message // Keep original message
            });

            // Limit history size
            if (history.length > this.settings.maxHistory) {
                history = history.slice(-this.settings.maxHistory);
            }

            localStorage.setItem('notification-history', JSON.stringify(history));
        } catch (error) {
            console.warn('Failed to save notification history:', error);
        }
    }

    /**
     * Load history
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem('notification-history');
            if (stored) {
                // History is loaded but not displayed automatically
                // Can be accessed via getHistory()
            }
        } catch (error) {
            console.warn('Failed to load notification history:', error);
        }
    }

    /**
     * Get notification history
     */
    getHistory(limit = 50) {
        try {
            const stored = localStorage.getItem('notification-history');
            if (stored) {
                const history = JSON.parse(stored);
                return history.slice(-limit);
            }
        } catch (error) {
            console.warn('Failed to get notification history:', error);
        }
        return [];
    }

    /**
     * Clear history
     */
    clearHistory() {
        localStorage.removeItem('notification-history');
    }

    /**
     * Play sound
     */
    playSound(type) {
        // Create audio context for beep sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different types
            const frequencies = {
                success: 800,
                error: 400,
                warning: 600,
                info: 500
            };

            oscillator.frequency.value = frequencies[type] || 500;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + N to clear all notifications
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.removeAll();
            }
        });
    }

    /**
     * Update notification settings
     * 
     * @method updateSettings
     * @param {Object} newSettings - Settings to update
     * @param {boolean} [newSettings.sound] - Enable/disable sound notifications
     * @param {string} [newSettings.position] - Position (bottom-right, bottom-left, top-right, top-left)
     * @param {number} [newSettings.maxHistory] - Maximum notification history entries
     * @returns {void}
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();

        // Update container position if changed
        if (newSettings.position) {
            this.container.className = `enhanced-notifications-container enhanced-notifications-${newSettings.position}`;
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('enhanced-notifications-styles')) return;

        const style = document.createElement('style');
        style.id = 'enhanced-notifications-styles';
        style.textContent = `
            .enhanced-notifications-container {
                position: fixed;
                z-index: 10004;
                pointer-events: none;
                max-width: 400px;
                width: 100%;
            }

            .enhanced-notifications-bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .enhanced-notifications-bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .enhanced-notifications-top-right {
                top: 20px;
                right: 20px;
            }

            .enhanced-notifications-top-left {
                top: 20px;
                left: 20px;
            }

            .enhanced-notification {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                padding: 1rem;
                margin-bottom: 1rem;
                pointer-events: all;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                font-family: 'Raleway', sans-serif;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                position: relative;
                overflow: hidden;
            }

            .enhanced-notification-success {
                border-color: rgba(68, 255, 68, 0.5);
            }

            .enhanced-notification-error {
                border-color: rgba(220, 53, 69, 0.5);
            }

            .enhanced-notification-warning {
                border-color: rgba(255, 215, 0, 0.5);
            }

            .enhanced-notification-info {
                border-color: rgba(100, 150, 255, 0.5);
            }

            .enhanced-notification[data-priority="high"] {
                border-width: 3px;
                box-shadow: 0 4px 24px rgba(186, 148, 79, 0.4);
            }

            .notification-content {
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            }

            .notification-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .notification-body {
                flex: 1;
                color: white;
            }

            .notification-title {
                font-weight: 600;
                color: #ba944f;
                margin-bottom: 0.25rem;
                font-size: 0.9rem;
            }

            .notification-message {
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.5;
            }

            .notification-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.75rem;
            }

            .notification-action-btn {
                padding: 0.25rem 0.75rem;
                background: rgba(186, 148, 79, 0.2);
                border: 1px solid rgba(186, 148, 79, 0.4);
                border-radius: 6px;
                color: #ba944f;
                font-family: 'Raleway', sans-serif;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .notification-action-btn:hover {
                background: rgba(186, 148, 79, 0.3);
                border-color: rgba(186, 148, 79, 0.6);
            }

            .notification-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: color 0.2s;
            }

            .notification-close:hover {
                color: #ba944f;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(186, 148, 79, 0.5);
                width: 100%;
                transform-origin: left;
                animation: notification-progress linear forwards;
            }

            @keyframes notification-progress {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }

            @media (max-width: 768px) {
                .enhanced-notifications-container {
                    max-width: calc(100% - 40px);
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let enhancedNotificationsInstance = null;

function initEnhancedNotifications() {
    if (!enhancedNotificationsInstance) {
        enhancedNotificationsInstance = new EnhancedNotifications();
    }
    return enhancedNotificationsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedNotifications);
} else {
    initEnhancedNotifications();
}

// Export globally
window.EnhancedNotifications = EnhancedNotifications;
window.enhancedNotifications = () => enhancedNotificationsInstance;

// Convenience functions
window.showNotification = (message, type, options) => {
    const notif = window.enhancedNotifications();
    return notif ? notif.show(message, type, options) : null;
};

