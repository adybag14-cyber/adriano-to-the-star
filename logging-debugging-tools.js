/**
 * Logging and Debugging Tools
 * @class LoggingDebuggingTools
 * @description Provides comprehensive logging and debugging capabilities.
 */
class LoggingDebuggingTools {
    constructor() {
        this.logs = [];
        this.logLevels = ['debug', 'info', 'warn', 'error'];
        this.currentLevel = 'info';
        this.init();
    }

    init() {
        this.trackEvent('l_og_gi_ng_de_bu_gg_in_gt_oo_ls_initialized');
        this.setupLogging();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_og_gi_ng_de_bu_gg_in_gt_oo_ls_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupLogging() {
        // Intercept console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog.apply(console, args);
            this.log('info', args.join(' '));
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            this.log('error', args.join(' '));
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.log('warn', args.join(' '));
        };
    }

    /**
     * Log a message.
     * @param {string} level - Log level.
     * @param {string} message - Log message.
     * @param {object} metadata - Additional metadata.
     */
    log(level, message, metadata = {}) {
        const logEntry = {
            level,
            message,
            metadata,
            timestamp: new Date(),
            stack: level === 'error' ? new Error().stack : null
        };

        this.logs.push(logEntry);

        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs.shift();
        }
    }

    /**
     * Get logs.
     * @param {object} filters - Filter options.
     * @returns {Array<object>} Filtered logs.
     */
    getLogs(filters = {}) {
        let filtered = this.logs;

        if (filters.level) {
            filtered = filtered.filter(log => log.level === filters.level);
        }

        if (filters.startDate) {
            filtered = filtered.filter(log => log.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter(log => log.timestamp <= filters.endDate);
        }

        return filtered;
    }

    /**
     * Clear logs.
     */
    clearLogs() {
        this.logs = [];
        console.log('Logs cleared');
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.loggingDebuggingTools = new LoggingDebuggingTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoggingDebuggingTools;
}
