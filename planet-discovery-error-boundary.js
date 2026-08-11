/**
 * Planet Discovery Error Boundary System
 * Catch and handle JavaScript errors gracefully
 */

class PlanetDiscoveryErrorBoundary {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.init();
    }

    init() {
        this.setupGlobalErrorHandling();
        this.setupUnhandledRejectionHandling();
        this.setupResourceErrorHandling();
        console.log('🛡️ Error boundary system initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_er_ro_rb_ou_nd_ar_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupUnhandledRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || String(event.reason),
                error: event.reason,
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupResourceErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.target !== window && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                this.handleError({
                    type: 'Resource Error',
                    message: `Failed to load ${event.target.tagName.toLowerCase()}: ${event.target.src || event.target.href}`,
                    resource: event.target.src || event.target.href,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }

    handleError(errorInfo) {
        // Log error
        console.error('Error caught by boundary:', errorInfo);

        // Store error
        this.errors.push(errorInfo);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Save to localStorage for debugging
        try {
            const savedErrors = JSON.parse(localStorage.getItem('error-log') || '[]');
            savedErrors.push(errorInfo);
            if (savedErrors.length > this.maxErrors) {
                savedErrors.shift();
            }
            localStorage.setItem('error-log', JSON.stringify(savedErrors));
        } catch (e) {
            console.warn('Could not save error to localStorage:', e);
        }

        // Send to error reporting service (if configured)
        this.reportError(errorInfo);

        // Show user-friendly error message for critical errors
        if (this.isCriticalError(errorInfo)) {
            this.showErrorNotification(errorInfo);
        }
    }

    isCriticalError(errorInfo) {
        // Define what constitutes a critical error
        const criticalPatterns = [
            /cannot read property/i,
            /undefined is not a function/i,
            /network error/i,
            /failed to fetch/i
        ];

        return criticalPatterns.some(pattern => 
            pattern.test(errorInfo.message || '')
        );
    }

    showErrorNotification(errorInfo) {
        // Don't show multiple notifications
        if (document.querySelector('.error-notification')) {
            return;
        }

        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.95);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;

        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <strong>⚠️ An error occurred</strong>
                <button id="close-error" style="background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;">×</button>
            </div>
            <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">
                ${this.getUserFriendlyMessage(errorInfo)}
            </p>
            <button id="report-error-btn" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.2); border: 1px solid white; border-radius: 5px; color: white; cursor: pointer;">
                Report Issue
            </button>
        `;

        document.body.appendChild(notification);

        document.getElementById('close-error')?.addEventListener('click', () => {
            notification.remove();
        });

        document.getElementById('report-error-btn')?.addEventListener('click', () => {
            this.showErrorReportForm(errorInfo);
            notification.remove();
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    getUserFriendlyMessage(errorInfo) {
        const message = errorInfo.message || '';
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'Network connection issue. Please check your internet connection.';
        }
        
        if (message.includes('undefined') || message.includes('null')) {
            return 'A page component failed to load. Please refresh the page.';
        }
        
        return 'Something went wrong. The page may not work correctly.';
    }

    async reportError(errorInfo) {
        // Send to error reporting service (e.g., Sentry, LogRocket, etc.)
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                await supabase
                    .from('error_reports')
                    .insert({
                        error_type: errorInfo.type,
                        message: errorInfo.message,
                        stack: errorInfo.stack,
                        user_agent: navigator.userAgent,
                        url: window.location.href,
                        timestamp: errorInfo.timestamp
                    });
            } catch (e) {
                console.warn('Could not send error report:', e);
            }
        }
    }

    showErrorReportForm(errorInfo) {
        // Show a form for users to report errors with additional context
        alert('Error reporting form coming soon!');
    }

    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
        try {
            localStorage.removeItem('error-log');
        } catch (e) {
            console.warn('Could not clear error log:', e);
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryErrorBoundary = new PlanetDiscoveryErrorBoundary();
}

