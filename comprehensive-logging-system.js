/**
 * Comprehensive Logging System with Log Levels and Remote Logging
 * 
 * Provides comprehensive logging system with log levels and remote logging capabilities.
 * 
 * @module ComprehensiveLoggingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ComprehensiveLoggingSystem {
    constructor() {
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            FATAL: 4
        };
        this.currentLogLevel = this.logLevels.INFO;
        this.logs = [];
        this.maxLogs = 1000;
        this.remoteLoggingEnabled = false;
        this.remoteLoggingEndpoint = null;
        this.batchSize = 10;
        this.logBatch = [];
        this.batchTimer = null;
    }

    /**
     * Initialize logging system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        this.currentLogLevel = options.logLevel || this.logLevels.INFO;
        this.remoteLoggingEnabled = options.remoteLoggingEnabled || false;
        this.remoteLoggingEndpoint = options.remoteLoggingEndpoint || null;
        this.maxLogs = options.maxLogs || 1000;
        this.batchSize = options.batchSize || 10;

        if (this.remoteLoggingEnabled) {
            this.startBatchTimer();
        }
        this.trackEvent('logging_initialized');
    }

    /**
     * Log debug message
     * @public
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    debug(message, context = {}) {
        this.log(this.logLevels.DEBUG, 'DEBUG', message, context);
    }

    /**
     * Log info message
     * @public
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    info(message, context = {}) {
        this.log(this.logLevels.INFO, 'INFO', message, context);
    }

    /**
     * Log warning message
     * @public
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    warn(message, context = {}) {
        this.log(this.logLevels.WARN, 'WARN', message, context);
    }

    /**
     * Log error message
     * @public
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    error(message, context = {}) {
        this.log(this.logLevels.ERROR, 'ERROR', message, context);
    }

    /**
     * Log fatal message
     * @public
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    fatal(message, context = {}) {
        this.log(this.logLevels.FATAL, 'FATAL', message, context);
    }

    /**
     * Log message
     * @private
     * @param {number} level - Log level
     * @param {string} levelName - Log level name
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    log(level, levelName, message, context = {}) {
        if (level < this.currentLogLevel) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            message,
            context: {
                ...context,
                url: window.location.href,
                userAgent: navigator.userAgent,
                userId: this.getUserId(),
                sessionId: this.getSessionId()
            }
        };

        // Add to logs
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const consoleMethod = level >= this.logLevels.ERROR ? 'error' :
                             level >= this.logLevels.WARN ? 'warn' :
                             level >= this.logLevels.INFO ? 'info' : 'log';
        console[consoleMethod](`[${levelName}]`, message, context);

        // Remote logging
        if (this.remoteLoggingEnabled && level >= this.logLevels.INFO) {
            this.queueForRemoteLogging(logEntry);
        }

        // Forward to performance monitoring
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`log:${levelName.toLowerCase()}`, 1, {
                    source: 'comprehensive-logging-system'
                });
            } catch (e) {
                // Avoid recursive logging
            }
        }
    }

    /**
     * Queue log for remote logging
     * @private
     * @param {Object} logEntry - Log entry
     */
    queueForRemoteLogging(logEntry) {
        this.logBatch.push(logEntry);

        if (this.logBatch.length >= this.batchSize) {
            this.flushLogBatch();
        }
    }

    /**
     * Flush log batch
     * @private
     */
    async flushLogBatch() {
        if (this.logBatch.length === 0 || !this.remoteLoggingEndpoint) {
            return;
        }

        const batch = [...this.logBatch];
        this.logBatch = [];

        try {
            await fetch(this.remoteLoggingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ logs: batch })
            });
        } catch (error) {
            console.error('Failed to send logs to remote:', error);
            // Re-queue failed logs
            this.logBatch.unshift(...batch);
        }
    }

    /**
     * Start batch timer
     * @private
     */
    startBatchTimer() {
        this.batchTimer = setInterval(() => {
            if (this.logBatch.length > 0) {
                this.flushLogBatch();
            }
        }, 5000); // Flush every 5 seconds
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
     * Get logs
     * @public
     * @param {Object} filter - Filter options
     * @returns {Array} Filtered logs
     */
    getLogs(filter = {}) {
        let filtered = [...this.logs];

        if (filter.level) {
            const minLevel = this.logLevels[filter.level.toUpperCase()] || 0;
            filtered = filtered.filter(log => 
                this.logLevels[log.level] >= minLevel
            );
        }

        if (filter.startTime) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) >= new Date(filter.startTime)
            );
        }

        if (filter.endTime) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) <= new Date(filter.endTime)
            );
        }

        return filtered;
    }

    /**
     * Clear logs
     * @public
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Set log level
     * @public
     * @param {string} level - Log level name
     */
    setLogLevel(level) {
        const levelValue = this.logLevels[level.toUpperCase()];
        if (levelValue !== undefined) {
            this.currentLogLevel = levelValue;
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`logging_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.ComprehensiveLoggingSystem = ComprehensiveLoggingSystem;
window.logger = new ComprehensiveLoggingSystem();
window.logger.init();

