/**
 * Global Error Handler - Catches All Errors
 * 
 * Ensures errors are always logged, even if page is blocked
 */

(function() {
    'use strict';

    // Track all errors
    window.errorLog = window.errorLog || [];

    // Enhanced error handler
    const handleError = (error, context = '') => {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack,
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        window.errorLog.push(errorInfo);

        // Try to log to debug system if available
        if (window.debugSystem) {
            window.debugSystem.log(`ERROR in ${context}: ${error.message}`, 'error');
            if (error.stack) {
                window.debugSystem.log(`Stack: ${error.stack}`, 'error');
            }
        }

        // Always log to console
        console.error(`[ERROR HANDLER] ${context}:`, error);
        
        // Try to show in page if possible
        try {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed !important;
                top: 200px !important;
                left: 0 !important;
                background: rgba(255, 0, 0, 0.9) !important;
                color: white !important;
                padding: 10px !important;
                z-index: 999998 !important;
                max-width: 500px !important;
                font-family: monospace !important;
                font-size: 11px !important;
            `;
            errorDiv.textContent = `ERROR: ${error.message}`;
            if (document.body) {
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 10000);
            }
        } catch (e) {
            // If we can't show error, at least we logged it
        }
    };

    // Global error handler
    window.addEventListener('error', (event) => {
        handleError(event.error || new Error(event.message), `Global Error Handler`);
    }, true);

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason || new Error('Unhandled Promise Rejection'), 'Promise Rejection');
    });

    // Script load errors
    document.addEventListener('error', (event) => {
        if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
            handleError(new Error(`Failed to load: ${event.target.src || event.target.href}`), 'Resource Load');
        }
    }, true);

    // Wrap all script executions in try-catch
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        if (tagName.toLowerCase() === 'script') {
            const originalOnError = element.onerror;
            element.onerror = function(error) {
                handleError(error || new Error('Script load error'), `Script: ${element.src}`);
                if (originalOnError) originalOnError.call(this, error);
            };
        }
        return element;
    };

    // Telemetry tracking
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric('error_handler_initialized', 1, {});
        }
    } catch (e) { /* Silent fail */ }
})();

