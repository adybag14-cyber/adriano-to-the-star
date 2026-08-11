/**
 * Notification System
 * Replaces native alerts with non-blocking toast notifications
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        const shouldDisable = () => {
            try {
                return window.disableNotifications === true || (document.body && document.body.classList.contains('database-page'));
            } catch {
                return false;
            }
        };

        if (shouldDisable()) {
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (!shouldDisable()) this.setupContainer();
            });
        } else {
            if (!shouldDisable()) this.setupContainer();
        }
    }

    setupContainer() {
        if (document.getElementById('notification-container')) return;

        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a notification
     * @param {string} message - The message body
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {string} title - Optional title, defaults based on type
     * @param {number} duration - Time in ms before auto-close
     */
    show(message, type = 'info', title = null, duration = 5000) {
        if (window.disableNotifications === true || (document.body && document.body.classList.contains('database-page'))) {
            return null;
        }

        if (!this.container) this.setupContainer();

        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;

        // Icon map
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        // Default titles
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        const displayTitle = title || titles[type];

        toast.innerHTML = `
            <div class="notification-icon">${icons[type] || ''}</div>
            <div class="notification-content">
                <div class="notification-title">${displayTitle}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;

        // Close button logic
        const closeBtn = toast.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.close(toast);
        });

        this.container.appendChild(toast);

        // Auto close
        if (duration > 0) {
            setTimeout(() => {
                this.close(toast);
            }, duration);
        }

        return toast;
    }

    close(toast) {
        if (toast.classList.contains('hiding')) return;

        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            if (toast.parentElement) {
                toast.remove();
            }
        });
    }

    // Convenience methods
    success(message, title = 'Success') {
        return this.show(message, 'success', title);
    }

    error(message, title = 'Error') {
        return this.show(message, 'error', title);
    }

    warning(message, title = 'Warning') {
        return this.show(message, 'warning', title);
    }

    info(message, title = 'Info') {
        return this.show(message, 'info', title);
    }
}

// Initialize global instance
window.notifications = new NotificationSystem();
