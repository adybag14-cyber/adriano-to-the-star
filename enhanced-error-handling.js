/**
 * Enhanced Error Handling
 * Better error messages and recovery mechanisms
 */

class EnhancedErrorHandling {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.recoveryStrategies = new Map();
        this.init();
    }

    init() {
        // Setup global error handlers
        this.setupGlobalHandlers();

        // Setup fetch error handling
        this.setupFetchErrorHandling();

        // Setup recovery strategies
        this.setupRecoveryStrategies();

        console.log('✅ Enhanced Error Handling initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_nh_an_ce_de_rr_or_ha_nd_li_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Window error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                type: 'javascript'
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                message: `Unhandled Promise Rejection: ${event.reason}`,
                stack: event.reason?.stack,
                type: 'promise'
            });
        });
    }

    /**
     * Setup fetch error handling
     */
    setupFetchErrorHandling() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async function (...args) {
            try {
                const response = await originalFetch.apply(this, args);

                // Handle HTTP errors
                if (!response.ok) {
                    const error = await self.handleHttpError(response, args[0]);
                    if (error.shouldRetry && self.recoveryStrategies.has('fetch-retry')) {
                        return self.attemptRecovery('fetch-retry', () => originalFetch.apply(this, args), error);
                    }
                }

                return response;
            } catch (error) {
                // Handle network errors
                const handledError = self.handleNetworkError(error, args[0]);
                if (handledError.shouldRetry && self.recoveryStrategies.has('network-retry')) {
                    return self.attemptRecovery('network-retry', () => originalFetch.apply(this, args), handledError);
                }
                throw error;
            }
        };
    }

    /**
     * Handle HTTP errors
     */
    async handleHttpError(response, url) {
        const status = response.status;
        const statusText = response.statusText;

        const error = {
            type: 'http',
            status,
            statusText,
            url,
            message: `HTTP ${status}: ${statusText}`,
            shouldRetry: false,
            userMessage: this.getUserFriendlyMessage(status, statusText)
        };

        // Determine if we should retry
        if (status >= 500 || status === 429) {
            error.shouldRetry = true;
            error.retryDelay = status === 429 ? 5000 : 2000;
        }

        // Try to get error details from response
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.clone().json();
                error.details = data;
                if (data.message) {
                    error.userMessage = data.message;
                }
            }
        } catch (e) {
            // Ignore
        }

        this.showErrorNotification(error);
        this.logError(error);

        return error;
    }

    /**
     * Handle network errors
     */
    handleNetworkError(error, url) {
        const errorObj = {
            type: 'network',
            message: error.message,
            url,
            shouldRetry: true,
            retryDelay: 2000,
            userMessage: 'Network error. Please check your connection and try again.'
        };

        // Check if it's a timeout
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            errorObj.userMessage = 'Request timed out. Please try again.';
        }

        this.showErrorNotification(errorObj);
        this.logError(errorObj);

        return errorObj;
    }

    /**
     * Handle general errors
     */
    handleError(error) {
        const errorObj = {
            ...error,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Determine recovery strategy
        if (error.type === 'javascript') {
            errorObj.userMessage = 'An unexpected error occurred. The page may not function correctly.';
            errorObj.shouldRetry = false;
        } else if (error.type === 'promise') {
            errorObj.userMessage = 'An operation failed. Please try again.';
            errorObj.shouldRetry = true;
        }

        this.showErrorNotification(errorObj);
        this.logError(errorObj);

        // Attempt automatic recovery if possible
        if (errorObj.shouldRetry && this.recoveryStrategies.has('auto-recovery')) {
            this.attemptRecovery('auto-recovery', null, errorObj);
        }
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(status, statusText) {
        const messages = {
            400: 'Invalid request. Please check your input and try again.',
            401: 'You need to be logged in to access this resource.',
            403: 'You don\'t have permission to access this resource.',
            404: 'The requested resource was not found.',
            429: 'Too many requests. Please wait a moment and try again.',
            500: 'Server error. Please try again later.',
            502: 'Service temporarily unavailable. Please try again later.',
            503: 'Service unavailable. Please try again later.',
            504: 'Request timeout. Please try again.'
        };

        return messages[status] || `An error occurred: ${statusText}`;
    }

    /**
     * Show error notification
     */
    showErrorNotification(error) {
        // Check if notification already exists for this error
        const existingNotification = document.querySelector(`[data-error-id="${error.timestamp}"]`);
        if (existingNotification) return;

        const notification = document.createElement('div');
        notification.className = 'enhanced-error-notification';
        notification.setAttribute('data-error-id', error.timestamp);
        notification.innerHTML = `
            <div class="error-notification-content">
                <div class="error-notification-header">
                    <span class="error-icon">⚠️</span>
                    <span class="error-title">Error</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="error-notification-message">${this.escapeHtml(error.userMessage || error.message)}</div>
                ${error.shouldRetry ? `
                    <div class="error-notification-actions">
                        <button class="error-retry-btn" onclick="window.enhancedErrorHandling.retryLastError()">
                            🔄 Retry
                        </button>
                    </div>
                ` : ''}
                ${error.details ? `
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <pre>${this.escapeHtml(JSON.stringify(error.details, null, 2))}</pre>
                    </details>
                ` : ''}
            </div>
        `;

        document.body.appendChild(notification);
        this.injectStyles();

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto-remove after 10 seconds (unless it's a critical error)
        if (!error.critical) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.transform = 'translateX(100%)';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 10000);
        }

        // Store last error for retry
        this.lastError = error;
    }

    /**
     * Retry last error
     */
    retryLastError() {
        if (!this.lastError) return;

        // This would need to be implemented based on the specific error
        // For now, just reload the page for critical errors
        if (this.lastError.critical) {
            console.error('Critical error occurred');
            this.showErrorNotification({
                ...this.lastError,
                userMessage: 'Critical error: ' + (this.lastError.userMessage || 'Something went wrong.') + ' Please reload the page.',
                shouldRetry: false,
                critical: true
            });
        } else {
            // Show a message that retry is not available
            this.showErrorNotification({
                ...this.lastError,
                userMessage: 'Retry functionality is not available for this error. Please refresh the page.',
                shouldRetry: false
            });
        }
    }

    /**
     * Setup recovery strategies
     */
    setupRecoveryStrategies() {
        // Fetch retry strategy
        this.recoveryStrategies.set('fetch-retry', {
            maxRetries: 3,
            retryDelay: 2000,
            backoff: true
        });

        // Network retry strategy
        this.recoveryStrategies.set('network-retry', {
            maxRetries: 3,
            retryDelay: 2000,
            backoff: true
        });

        // Auto-recovery strategy
        this.recoveryStrategies.set('auto-recovery', {
            maxRetries: 1,
            retryDelay: 1000
        });
    }

    /**
     * Attempt recovery
     */
    async attemptRecovery(strategyName, retryFn, error) {
        const strategy = this.recoveryStrategies.get(strategyName);
        if (!strategy || !retryFn) return null;

        let retries = 0;
        const maxRetries = strategy.maxRetries || 3;
        let delay = strategy.retryDelay || 2000;

        while (retries < maxRetries) {
            retries++;

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));

            // Show retry notification
            this.showErrorNotification({
                ...error,
                userMessage: `Retrying... (${retries}/${maxRetries})`,
                shouldRetry: false
            });

            try {
                const result = await retryFn();
                // Success - remove error notification
                const notifications = document.querySelectorAll('.enhanced-error-notification');
                notifications.forEach(n => n.remove());
                return result;
            } catch (retryError) {
                // If backoff is enabled, increase delay
                if (strategy.backoff) {
                    delay *= 2;
                }

                if (retries >= maxRetries) {
                    // All retries failed
                    this.showErrorNotification({
                        ...error,
                        userMessage: 'Operation failed after multiple attempts. Please try again later.',
                        shouldRetry: false,
                        critical: true
                    });
                    throw retryError;
                }
            }
        }

        return null;
    }

    /**
     * Log error
     */
    logError(error) {
        this.errorLog.push({
            ...error,
            timestamp: Date.now()
        });

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Store in localStorage for debugging
        try {
            const stored = localStorage.getItem('error-log');
            const logs = stored ? JSON.parse(stored) : [];
            logs.push(error);

            // Keep only last 50 errors
            if (logs.length > 50) {
                logs.shift();
            }

            localStorage.setItem('error-log', JSON.stringify(logs));
        } catch (e) {
            console.warn('Failed to store error log:', e);
        }
    }

    /**
     * Get error log
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('error-log');
    }

    /**
     * Export error log
     */
    exportErrorLog() {
        const data = {
            exported: new Date().toISOString(),
            errors: this.errorLog
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
        if (document.getElementById('enhanced-error-handling-styles')) return;

        const style = document.createElement('style');
        style.id = 'enhanced-error-handling-styles';
        style.textContent = `
            .enhanced-error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(200, 30, 50, 0.95));
                border: 2px solid rgba(255, 68, 68, 0.8);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                z-index: 10001;
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.3s ease;
                font-family: 'Raleway', sans-serif;
            }

            .error-notification-content {
                padding: 1rem 1.5rem;
                color: white;
            }

            .error-notification-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 0.75rem;
            }

            .error-icon {
                font-size: 1.5rem;
            }

            .error-title {
                font-size: 1.2rem;
                font-weight: bold;
                flex: 1;
            }

            .error-close {
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .error-close:hover {
                opacity: 1;
            }

            .error-notification-message {
                margin-bottom: 0.75rem;
                line-height: 1.5;
            }

            .error-notification-actions {
                margin-top: 0.75rem;
            }

            .error-retry-btn {
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            }

            .error-retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .error-details {
                margin-top: 0.75rem;
                font-size: 0.85rem;
            }

            .error-details summary {
                cursor: pointer;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }

            .error-details pre {
                background: rgba(0, 0, 0, 0.3);
                padding: 0.75rem;
                border-radius: 6px;
                overflow-x: auto;
                font-size: 0.8rem;
                max-height: 200px;
                overflow-y: auto;
            }

            @media (max-width: 768px) {
                .enhanced-error-notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let enhancedErrorHandlingInstance = null;

function initEnhancedErrorHandling() {
    if (!enhancedErrorHandlingInstance) {
        enhancedErrorHandlingInstance = new EnhancedErrorHandling();
    }
    return enhancedErrorHandlingInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedErrorHandling);
} else {
    initEnhancedErrorHandling();
}

// Export globally
window.EnhancedErrorHandling = EnhancedErrorHandling;
window.enhancedErrorHandling = () => enhancedErrorHandlingInstance;

