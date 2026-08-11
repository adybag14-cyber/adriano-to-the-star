/**
 * Comprehensive Error Handling
 * User-friendly error messages, error logging, error boundaries, graceful degradation
 */

class ComprehensiveErrorHandling {
    constructor() {
        this.errorLog = [];
        this.errorHandlers = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize error handling
     */
    init() {
        // Global error handler
        window.addEventListener('error', (e) => {
            this.handleError(e.error || e, 'JavaScript Error');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError(e.reason, 'Unhandled Promise Rejection');
        });

        // Setup error boundaries for React-like components
        this.setupErrorBoundaries();

        this.isInitialized = true;
        this.trackEvent('error_handling_initialized');
    }

    /**
     * Handle error
     */
    handleError(error, context = 'Unknown') {
        const errorInfo = {
            message: error?.message || String(error),
            stack: error?.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log error
        this.logError(errorInfo);

        // Show user-friendly message
        this.showUserFriendlyError(error, context);

        // Report to server (if configured)
        this.reportError(errorInfo);
    }

    /**
     * Log error
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);

        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }

        // Store in localStorage
        try {
            localStorage.setItem('error-log', JSON.stringify(this.errorLog.slice(-50)));
        } catch (e) {
            // Ignore storage errors
        }

        console.error('Error logged:', errorInfo);
    }

    /**
     * Show user-friendly error message
     */
    showUserFriendlyError(error, context) {
        const userMessage = this.getUserFriendlyMessage(error, context);

        // Check if custom handler exists
        const handler = this.errorHandlers.get(context);
        if (handler) {
            handler(error, userMessage);
            return;
        }

        // Default error display
        this.showErrorNotification(userMessage);
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error, context) {
        const errorMessage = error?.message || String(error);

        // Network errors
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }

        // API errors
        if (errorMessage.includes('API') || errorMessage.includes('401') || errorMessage.includes('403')) {
            return 'There was an issue accessing the service. Please try again later.';
        }

        // Storage errors
        if (errorMessage.includes('QuotaExceeded') || errorMessage.includes('storage')) {
            return 'Storage is full. Please clear some space and try again.';
        }

        // Generic errors
        return 'Something went wrong. Please try again or refresh the page.';
    }

    /**
     * Show error notification
     */
    showErrorNotification(message) {
        // Check if notification system exists
        if (window.showNotification) {
            window.showNotification(message, 'error');
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 100, 100, 0.95);
            border: 2px solid #ff6464;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: #fff;
            font-family: 'Raleway', sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(255, 100, 100, 0.5);
            max-width: 400px;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div style="flex: 1;">
                    <strong>Error</strong>
                    <div style="margin-top: 0.25rem; font-size: 0.9rem;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; padding: 0;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Report error to server
     */
    async reportError(errorInfo) {
        // In production, this would send to error tracking service
        // For now, just log
        console.log('Error reported:', errorInfo);

        // Could integrate with services like:
        // - Sentry
        // - LogRocket
        // - Custom error tracking API
    }

    /**
     * Setup error boundaries
     */
    setupErrorBoundaries() {
        // Wrap functions in try-catch
        this.wrapFunctions();
    }

    /**
     * Wrap functions with error handling
     */
    wrapFunctions() {
        // This would wrap critical functions
        // For now, it's a placeholder for future enhancement
    }

    /**
     * Register error handler for specific context
     */
    registerErrorHandler(context, handler) {
        this.errorHandlers.set(context, handler);
    }

    /**
     * Safe async wrapper
     */
    async safeAsync(fn, context = 'Unknown', fallback = null) {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error, context);
            return fallback;
        }
    }

    /**
     * Safe sync wrapper
     */
    safeSync(fn, context = 'Unknown', fallback = null) {
        try {
            return fn();
        } catch (error) {
            this.handleError(error, context);
            return fallback;
        }
    }

    /**
     * Get error log
     */
    getErrorLog(limit = 50) {
        return this.errorLog.slice(-limit);
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('error-log');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_handling_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
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
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.comprehensiveErrorHandling = new ComprehensiveErrorHandling();
    
    // Make available globally
    window.getComprehensiveErrorHandling = () => window.comprehensiveErrorHandling;
    
    // Global safe functions
    window.safeAsync = (fn, context, fallback) => 
        window.comprehensiveErrorHandling.safeAsync(fn, context, fallback);
    window.safeSync = (fn, context, fallback) => 
        window.comprehensiveErrorHandling.safeSync(fn, context, fallback);
}

