/**
 * Error Tracking System
 * @class ErrorTrackingSystem
 * @description Tracks and analyzes application errors.
 */
class ErrorTrackingSystem {
    constructor() {
        this.errors = new Map();
        this.groupedErrors = new Map();
        this.init();
    }

    init() {
        this.setupErrorHandling();
        this.trackEvent('error_tracking_sys_initialized');
    }

    setupErrorHandling() {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.trackError({
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.trackError({
                    message: 'Unhandled Promise Rejection',
                    error: event.reason
                });
            });
        }
    }

    /**
     * Track error.
     * @param {object} errorData - Error data.
     */
    trackError(errorData) {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const error = {
            id: errorId,
            ...errorData,
            message: errorData.message || 'Unknown error',
            stack: errorData.error?.stack || '',
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errors.set(errorId, error);
        this.groupError(error);
        console.error('Error tracked:', error);
    }

    /**
     * Group error.
     * @param {object} error - Error object.
     */
    groupError(error) {
        const fingerprint = this.generateFingerprint(error);
        if (!this.groupedErrors.has(fingerprint)) {
            this.groupedErrors.set(fingerprint, {
                fingerprint,
                message: error.message,
                count: 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                errors: []
            });
        }

        const group = this.groupedErrors.get(fingerprint);
        group.count++;
        group.lastSeen = new Date();
        group.errors.push(error.id);
    }

    /**
     * Generate error fingerprint.
     * @param {object} error - Error object.
     * @returns {string} Fingerprint.
     */
    generateFingerprint(error) {
        return `${error.message}_${error.filename}_${error.lineno}`;
    }

    /**
     * Get error groups.
     * @returns {Array<object>} Error groups.
     */
    getErrorGroups() {
        return Array.from(this.groupedErrors.values())
            .sort((a, b) => b.count - a.count);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_tracking_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.errorTrackingSystem = new ErrorTrackingSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTrackingSystem;
}

