/**
 * Toast Notification System
 * Provides user-friendly toast notifications for various events
 * 
 * Features:
 * - Multiple notification types (success, error, warning, info)
 * - Auto-dismiss with configurable timeout
 * - Stack management for multiple toasts
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Animation support
 */

class ToastNotificationSystem {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.maxToasts = 5;
        this.defaultTimeout = 5000; // 5 seconds
        this.init();
    }

    init() {
        this.createContainer();
        console.log('✅ Toast Notification System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_oa_st_no_ti_fi_ca_ti_on_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Notifications');
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast (success, error, warning, info)
     * @param {Object} options - Additional options (timeout, action, persistent)
     */
    show(message, type = 'info', options = {}) {
        const toast = this.createToast(message, type, options);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Remove oldest toast if max limit reached
        if (this.toasts.length > this.maxToasts) {
            const oldest = this.toasts.shift();
            this.removeToast(oldest);
        }

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        });

        // Auto-dismiss if not persistent
        if (!options.persistent) {
            const timeout = options.timeout || this.defaultTimeout;
            setTimeout(() => {
                this.removeToast(toast);
            }, timeout);
        }

        return toast;
    }

    createToast(message, type, options) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: '#4ade80',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        toast.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            border-left: 4px solid ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 1rem;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(400px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            font-family: 'Raleway', sans-serif;
            font-size: 0.9rem;
            max-width: 100%;
        `;

        toast.innerHTML = `
            <span class="toast-icon" style="font-size: 1.5rem; flex-shrink: 0;">${icons[type] || icons.info}</span>
            <div class="toast-content" style="flex: 1; min-width: 0;">
                <div class="toast-message">${this.escapeHtml(message)}</div>
                ${options.action ? `
                    <button class="toast-action" style="
                        margin-top: 0.5rem;
                        background: ${colors[type] || colors.info};
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: 'Raleway', sans-serif;
                        font-size: 0.85rem;
                    ">${options.action.label}</button>
                ` : ''}
            </div>
            <button class="toast-close" aria-label="Close notification" style="
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
            ">×</button>
        `;

        // Add CSS for visible state
        const style = document.createElement('style');
        style.textContent = `
            .toast-visible {
                transform: translateX(0) !important;
                opacity: 1 !important;
            }
            .toast:hover {
                transform: translateX(-5px) !important;
            }
        `;
        if (!document.getElementById('toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeToast(toast);
        });

        // Action button
        if (options.action) {
            const actionBtn = toast.querySelector('.toast-action');
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (options.action.callback) {
                    options.action.callback();
                }
                if (!options.action.persistent) {
                    this.removeToast(toast);
                }
            });
        }

        // Click to dismiss
        toast.addEventListener('click', () => {
            this.removeToast(toast);
        });

        return toast;
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('toast-visible');
        toast.style.transform = 'translateX(400px)';
        toast.style.opacity = '0';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', { ...options, timeout: options.timeout || 7000 });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Clear all toasts
    clear() {
        this.toasts.forEach(toast => this.removeToast(toast));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.toastNotifications = new ToastNotificationSystem();
    
    // Global convenience functions
    window.showToast = (message, type, options) => window.toastNotifications.show(message, type, options);
    window.showSuccess = (message, options) => window.toastNotifications.success(message, options);
    window.showError = (message, options) => window.toastNotifications.error(message, options);
    window.showWarning = (message, options) => window.toastNotifications.warning(message, options);
    window.showInfo = (message, options) => window.toastNotifications.info(message, options);
}






