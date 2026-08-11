/**
 * Error Tracking and Reporting System
 * Track and report errors
 */
(function() {
    'use strict';

    class ErrorTrackingReporting {
        constructor() {
            this.errors = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.setupErrorHandling();
            this.trackEvent('error_tracking_report_initialized');
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`error_tracking_report_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }

        setupUI() {
            if (!document.getElementById('error-tracking')) {
                const tracking = document.createElement('div');
                tracking.id = 'error-tracking';
                tracking.className = 'error-tracking';
                tracking.innerHTML = `<h2>Error Tracking</h2>`;
                document.body.appendChild(tracking);
            }
        }

        setupErrorHandling() {
            window.addEventListener('error', (e) => {
                this.trackError({
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    error: e.error
                });
            });

            window.addEventListener('unhandledrejection', (e) => {
                this.trackError({
                    message: 'Unhandled Promise Rejection',
                    error: e.reason
                });
            });
        }

        trackError(error) {
            const errorReport = {
                ...error,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            this.errors.push(errorReport);
            this.reportError(errorReport);
        }

        reportError(error) {
            // Send to error tracking service
            console.error('Error tracked:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.errorTracking = new ErrorTrackingReporting();
        });
    } else {
        window.errorTracking = new ErrorTrackingReporting();
    }
})();

