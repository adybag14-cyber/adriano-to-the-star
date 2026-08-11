/**
 * Activity Logging and Audit Trail System
 * 
 * Implements comprehensive activity logging and audit trail.
 * 
 * @module ActivityLoggingAuditTrail
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ActivityLoggingAuditTrail {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000;
        this.endpoint = null;
        this.isInitialized = false;
    }

    /**
     * Initialize activity logging system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            return;
        }

        this.endpoint = options.endpoint || null;
        this.maxLogs = options.maxLogs || 10000;
        this.setupAutoLogging();
        this.loadLogs();
        
        this.isInitialized = true;
        this.trackEvent('audit_trail_initialized');
    }

    /**
     * Set up auto logging
     * @private
     */
    setupAutoLogging() {
        // Log page views
        window.addEventListener('load', () => {
            this.log('page_view', {
                url: window.location.href,
                title: document.title
            });
        });

        // Log navigation
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                this.log('navigation', {
                    from: lastUrl,
                    to: window.location.href
                });
                lastUrl = window.location.href;
            }
        }, 1000);
    }

    /**
     * Log activity
     * @public
     * @param {string} action - Action name
     * @param {Object} details - Activity details
     * @param {string} level - Log level
     */
    log(action, details = {}, level = 'info') {
        const activity = {
            id: Date.now() + Math.random(),
            action,
            details,
            level,
            timestamp: new Date().toISOString(),
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ip: null // Would be set by server
        };

        this.logs.push(activity);

        // Keep only last maxLogs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Save to storage
        this.saveLogs();

        // Send to endpoint
        if (this.endpoint) {
            this.sendLog(activity);
        }
    }

    /**
     * Get logs
     * @public
     * @param {Object} filter - Filter options
     * @returns {Array} Filtered logs
     */
    getLogs(filter = {}) {
        let filtered = [...this.logs];

        if (filter.action) {
            filtered = filtered.filter(log => log.action === filter.action);
        }

        if (filter.userId) {
            filtered = filtered.filter(log => log.userId === filter.userId);
        }

        if (filter.startDate) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) >= new Date(filter.startDate)
            );
        }

        if (filter.endDate) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) <= new Date(filter.endDate)
            );
        }

        if (filter.level) {
            filtered = filtered.filter(log => log.level === filter.level);
        }

        return filtered;
    }

    /**
     * Get audit trail
     * @public
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @returns {Array} Audit trail
     */
    getAuditTrail(entityType, entityId) {
        return this.logs.filter(log => 
            log.details?.entityType === entityType &&
            log.details?.entityId === entityId
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Send log to endpoint
     * @private
     * @param {Object} activity - Activity log
     */
    async sendLog(activity) {
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activity)
            });
        } catch (error) {
            this.trackEvent('log_send_failed', { error: error.message });
        }
    }

    /**
     * Get user ID
     * @private
     * @returns {string|null} User ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch {
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
     * Save logs
     * @private
     */
    saveLogs() {
        try {
            // Keep only last 1000 in localStorage
            const toSave = this.logs.slice(-1000);
            localStorage.setItem('activity-logs', JSON.stringify(toSave));
        } catch (e) {
            /* Silent fail */
        }
    }

    /**
     * Load logs
     * @private
     */
    loadLogs() {
        try {
            const saved = localStorage.getItem('activity-logs');
            if (saved) {
                this.logs = JSON.parse(saved);
            }
        } catch (e) {
            /* Silent fail */
        }
    }

    /**
     * Clear logs
     * @public
     */
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('activity-logs');
        this.trackEvent('logs_cleared');
    }

    /**
     * Export logs
     * @public
     * @param {string} format - Export format
     * @returns {Promise} Export result
     */
    async exportLogs(format = 'json') {
        if (window.dataExport) {
            return window.dataExport.export(this.logs, format, `activity-logs-${Date.now()}.${format}`);
        }
        throw new Error('Data export system not available');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`audit_trail_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'activity_logging', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.ActivityLoggingAuditTrail = ActivityLoggingAuditTrail;
window.activityLogging = new ActivityLoggingAuditTrail();
window.activityLogging.init();

