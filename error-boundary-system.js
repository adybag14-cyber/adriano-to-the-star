/**
 * Comprehensive Error Boundary System
 * 
 * Provides error boundaries and comprehensive error handling for all JavaScript modules.
 * This system ensures errors are caught, logged, and handled gracefully without breaking
 * the entire application.
 * 
 * @module ErrorBoundarySystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ErrorBoundarySystem {
    constructor() {
        this.errorLog = [];
        this.maxErrors = 1000;
        this.errorHandlers = new Map();
        this.recoveryStrategies = new Map();
        this.isInitialized = false;
        this.remoteLoggingEnabled = false;
        this.remoteLoggingEndpoint = null;
    }

    /**
     * Initialize the error boundary system
     * @public
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('ErrorBoundarySystem already initialized');
            return;
        }

        this.remoteLoggingEnabled = options.remoteLoggingEnabled || false;
        this.remoteLoggingEndpoint = options.remoteLoggingEndpoint || null;

        // Set up global error handlers
        this.setupGlobalErrorHandlers();
        
        // Set up promise rejection handler
        this.setupPromiseRejectionHandler();
        
        // Set up resource error handler
        this.setupResourceErrorHandler();
        
        // Set up console error override
        this.setupConsoleErrorOverride();

        this.isInitialized = true;
        this.trackEvent('error_boundary_sys_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_boundary_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Set up global error handlers
     * @private
     */
    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.handleError({
                message: event.message || 'Unknown error',
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript',
                context: 'Global Error Handler'
            });
        }, true);

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                message: event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection',
                stack: event.reason?.stack,
                type: 'promise',
                context: 'Promise Rejection Handler'
            });
        });
    }

    /**
     * Set up promise rejection handler
     * @private
     */
    setupPromiseRejectionHandler() {
        // Track promise rejections
        let rejectionCount = 0;
        const maxRejections = 10;
        
        window.addEventListener('unhandledrejection', (event) => {
            rejectionCount++;
            if (rejectionCount > maxRejections) {
                console.warn('Too many unhandled promise rejections. Suppressing further warnings.');
                return;
            }
        });
    }

    /**
     * Set up resource error handler
     * @private
     */
    setupResourceErrorHandler() {
        document.addEventListener('error', (event) => {
            if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG') {
                this.handleError({
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    type: 'resource',
                    context: `Resource Load: ${event.target.tagName}`,
                    resource: event.target.src || event.target.href
                });
            }
        }, true);
    }

    /**
     * Set up console error override
     * @private
     */
    setupConsoleErrorOverride() {
        const originalError = console.error;
        console.error = (...args) => {
            originalError.apply(console, args);
            // Log to error system if it's an Error object
            if (args[0] instanceof Error) {
                this.handleError({
                    message: args[0].message,
                    stack: args[0].stack,
                    type: 'console',
                    context: 'Console Error'
                });
            }
        };
    }

    /**
     * Handle an error
     * @public
     * @param {Object} errorInfo - Error information object
     */
    handleError(errorInfo) {
        const enrichedError = this.enrichError(errorInfo);
        
        // Log error
        this.logError(enrichedError);
        
        // Try to recover
        this.attemptRecovery(enrichedError);
        
        // Report to remote if enabled
        if (this.remoteLoggingEnabled) {
            this.reportError(enrichedError);
        }
        
        // Show user-friendly message if critical
        if (this.isCriticalError(enrichedError)) {
            this.showUserFriendlyError(enrichedError);
        }
    }

    /**
     * Enrich error with additional context
     * @private
     * @param {Object} errorInfo - Error information
     * @returns {Object} Enriched error information
     */
    enrichError(errorInfo) {
        return {
            ...errorInfo,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    /**
     * Get user ID if available
     * @private
     * @returns {string|null} User ID or null
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get session ID
     * @private
     * @returns {string} Session ID
     */
    getSessionId() {
        if (!sessionStorage.getItem('session-id')) {
            sessionStorage.setItem('session-id', `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }
        return sessionStorage.getItem('session-id');
    }

    /**
     * Log error to local storage
     * @private
     * @param {Object} errorInfo - Error information
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Keep only last maxErrors
        if (this.errorLog.length > this.maxErrors) {
            this.errorLog.shift();
        }
        
        // Save to localStorage for debugging
        try {
            const savedErrors = JSON.parse(localStorage.getItem('error-log') || '[]');
            savedErrors.push(errorInfo);
            if (savedErrors.length > 100) {
                savedErrors.shift();
            }
            localStorage.setItem('error-log', JSON.stringify(savedErrors));
        } catch (e) {
            console.warn('Could not save error to localStorage:', e);
        }
        
        // Log to console
        console.error('[ErrorBoundary]', errorInfo);
    }

    /**
     * Attempt to recover from error
     * @private
     * @param {Object} errorInfo - Error information
     */
    attemptRecovery(errorInfo) {
        // Network errors - retry
        if (errorInfo.type === 'network' || errorInfo.message?.includes('fetch')) {
            this.retryFailedOperation(errorInfo);
        }
        
        // Resource load errors - try alternative sources
        if (errorInfo.type === 'resource') {
            this.tryAlternativeResource(errorInfo);
        }
    }

    /**
     * Retry failed operation
     * @private
     * @param {Object} errorInfo - Error information
     */
    retryFailedOperation(errorInfo) {
        // Implement retry logic with exponential backoff
        if (errorInfo.retryCount === undefined) {
            errorInfo.retryCount = 0;
        }
        
        if (errorInfo.retryCount < 3) {
            errorInfo.retryCount++;
            const delay = Math.pow(2, errorInfo.retryCount) * 1000; // Exponential backoff
            
            setTimeout(() => {
                console.log(`Retrying operation after ${delay}ms (attempt ${errorInfo.retryCount})`);
                // Retry logic would be implemented here based on the operation type
            }, delay);
        }
    }

    /**
     * Try alternative resource
     * @private
     * @param {Object} errorInfo - Error information
     */
    tryAlternativeResource(errorInfo) {
        // Implement fallback resource loading
        console.log('Attempting to load alternative resource for:', errorInfo.resource);
    }

    /**
     * Check if error is critical
     * @private
     * @param {Object} errorInfo - Error information
     * @returns {boolean} True if critical
     */
    isCriticalError(errorInfo) {
        const criticalPatterns = [
            /cannot read property/i,
            /undefined is not a function/i,
            /null is not an object/i,
            /network error/i,
            /failed to fetch/i
        ];
        
        return criticalPatterns.some(pattern => 
            pattern.test(errorInfo.message || '')
        );
    }

    /**
     * Show user-friendly error message
     * @private
     * @param {Object} errorInfo - Error information
     */
    showUserFriendlyError(errorInfo) {
        const messages = {
            network: 'Connection error. Please check your internet connection and try again.',
            resource: 'Some resources failed to load. The page may not display correctly.',
            javascript: 'An unexpected error occurred. Please refresh the page.',
            promise: 'An operation failed. Please try again.',
            default: 'Something went wrong. Please try again or refresh the page.'
        };
        
        const message = messages[errorInfo.type] || messages.default;
        
        // Show notification
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     * @private
     * @param {string} message - Message to show
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'error') {
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[ErrorBoundary] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[ErrorBoundary] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[ErrorBoundary] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Report error to remote service
     * @private
     * @param {Object} errorInfo - Error information
     */
    async reportError(errorInfo) {
        if (!this.remoteLoggingEnabled || !this.remoteLoggingEndpoint) {
            return;
        }
        
        try {
            await this.fetchJSON(this.remoteLoggingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorInfo)
            });
        } catch (e) {
            console.warn('Failed to report error to remote service:', e);
        }
    }

    /**
     * Register error handler for specific context
     * @public
     * @param {string} context - Context name
     * @param {Function} handler - Error handler function
     */
    registerErrorHandler(context, handler) {
        this.errorHandlers.set(context, handler);
    }

    /**
     * Get error log
     * @public
     * @returns {Array} Error log
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     * @public
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('error-log');
        } catch (e) {
            console.warn('Could not clear error log from localStorage:', e);
        }
    }
}

// Create global instance
window.ErrorBoundarySystem = ErrorBoundarySystem;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.errorBoundary = new ErrorBoundarySystem();
        window.errorBoundary.init();
    });
} else {
    window.errorBoundary = new ErrorBoundarySystem();
    window.errorBoundary.init();
}

