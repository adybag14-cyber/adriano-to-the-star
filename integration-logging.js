/**
 * Integration Logging
 * @class IntegrationLogging
 * @description Provides logging capabilities for integration operations.
 */
class IntegrationLogging {
    constructor() {
        this.logs = [];
        this.logLevels = ['debug', 'info', 'warn', 'error'];
        this.currentLevel = 'info';
        this.init();
    }

    init() {
        this.trackEvent('i_nt_eg_ra_ti_on_lo_gg_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_eg_ra_ti_on_lo_gg_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Set log level.
     * @param {string} level - Log level ('debug', 'info', 'warn', 'error').
     */
    setLogLevel(level) {
        if (this.logLevels.includes(level)) {
            this.currentLevel = level;
            console.log(`Log level set to: ${level}`);
        }
    }

    /**
     * Check if a log level should be logged.
     * @param {string} level - Log level to check.
     * @returns {boolean} Whether the level should be logged.
     */
    shouldLog(level) {
        const levelIndex = this.logLevels.indexOf(level);
        const currentIndex = this.logLevels.indexOf(this.currentLevel);
        return levelIndex >= currentIndex;
    }

    /**
     * Log a message.
     * @param {string} level - Log level.
     * @param {string} message - Log message.
     * @param {object} metadata - Additional metadata.
     */
    log(level, message, metadata = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = {
            level,
            message,
            metadata,
            timestamp: new Date(),
            integration: metadata.integration || 'unknown'
        };

        this.logs.push(logEntry);

        // Output to console based on level
        const consoleMethod = level === 'error' ? 'error' : 
                            level === 'warn' ? 'warn' : 
                            level === 'debug' ? 'debug' : 'log';
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, metadata);
    }

    /**
     * Log debug message.
     * @param {string} message - Log message.
     * @param {object} metadata - Additional metadata.
     */
    debug(message, metadata = {}) {
        this.log('debug', message, metadata);
    }

    /**
     * Log info message.
     * @param {string} message - Log message.
     * @param {object} metadata - Additional metadata.
     */
    info(message, metadata = {}) {
        this.log('info', message, metadata);
    }

    /**
     * Log warning message.
     * @param {string} message - Log message.
     * @param {object} metadata - Additional metadata.
     */
    warn(message, metadata = {}) {
        this.log('warn', message, metadata);
    }

    /**
     * Log error message.
     * @param {string} message - Log message.
     * @param {object} metadata - Additional metadata.
     */
    error(message, metadata = {}) {
        this.log('error', message, metadata);
    }

    /**
     * Get logs.
     * @param {object} filters - Optional filters (level, integration, startDate, endDate).
     * @returns {Array<object>} Filtered logs.
     */
    getLogs(filters = {}) {
        let filteredLogs = this.logs;

        if (filters.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filters.level);
        }

        if (filters.integration) {
            filteredLogs = filteredLogs.filter(log => log.integration === filters.integration);
        }

        if (filters.startDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate);
        }

        return filteredLogs;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.integrationLogging = new IntegrationLogging();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationLogging;
}
