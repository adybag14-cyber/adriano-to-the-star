/**
 * API Request/Response Logging
 * Logs all API requests and responses for debugging and analytics
 */

class APIRequestResponseLogging {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000;
        this.logLevel = 'info'; // debug, info, warn, error
        this.sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
        this.serverLoggingEnabled = true;
        this.originalFetch = null;
        this.init();
    }

    init() {
        this.setupInterceptors();
        this.trackEvent('response_logging_initialized');
    }

    setupInterceptors() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        this.originalFetch = originalFetch;
        const self = this;

        window.fetch = async function(...args) {
            const [url, options = {}] = args;
            const requestId = self.generateRequestId();
            const startTime = Date.now();

            // Log request
            const requestLog = {
                id: requestId,
                method: options.method || 'GET',
                url: url,
                headers: self.sanitizeHeaders(options.headers),
                body: self.sanitizeBody(options.body),
                timestamp: new Date(),
                type: 'request'
            };

            self.log(requestLog);

            try {
                const response = await originalFetch.apply(this, args);
                const endTime = Date.now();
                const duration = endTime - startTime;

                // Clone response to read body
                const clonedResponse = response.clone();
                let responseBody = null;

                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        responseBody = await clonedResponse.json();
                    } else {
                        responseBody = await clonedResponse.text();
                    }
                } catch (e) {
                    // Could not read body
                }

                // Log response
                const responseLog = {
                    id: requestId,
                    status: response.status,
                    statusText: response.statusText,
                    headers: self.sanitizeHeaders(Object.fromEntries(response.headers.entries())),
                    body: self.sanitizeBody(responseBody),
                    duration: duration,
                    timestamp: new Date(),
                    type: 'response'
                };

                self.log(responseLog);

                return response;
            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;

                // Log error
                const errorLog = {
                    id: requestId,
                    error: error.message,
                    duration: duration,
                    timestamp: new Date(),
                    type: 'error'
                };

                self.log(errorLog);
                throw error;
            }
        };
    }

    log(logEntry) {
        // Add to logs array
        this.logs.push(logEntry);

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Store in localStorage
        this.persistLogs();

        // Send to server if configured
        if (this.shouldSendToServer(logEntry)) {
            this.sendToServer(logEntry);
        }
    }

    sanitizeHeaders(headers) {
        if (!headers) return {};

        const sanitized = {};
        const headerObj = headers instanceof Headers 
            ? Object.fromEntries(headers.entries())
            : headers;

        for (const [key, value] of Object.entries(headerObj)) {
            if (this.isSensitiveField(key)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    sanitizeBody(body) {
        if (!body) return null;

        try {
            let parsed;
            if (typeof body === 'string') {
                parsed = JSON.parse(body);
            } else if (body instanceof FormData) {
                // Convert FormData to object
                parsed = {};
                for (const [key, value] of body.entries()) {
                    parsed[key] = this.isSensitiveField(key) ? '[REDACTED]' : value;
                }
            } else {
                parsed = body;
            }

            return this.sanitizeObject(parsed);
        } catch (e) {
            return '[Unable to parse body]';
        }
    }

    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (this.isSensitiveField(key)) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    isSensitiveField(fieldName) {
        const lowerField = fieldName.toLowerCase();
        return this.sensitiveFields.some(sensitive => 
            lowerField.includes(sensitive.toLowerCase())
        );
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    persistLogs() {
        try {
            const logsToStore = this.logs.slice(-1000); // Store last 1000 logs
            localStorage.setItem('apiLogs', JSON.stringify(logsToStore));
        } catch (e) {
            console.warn('Could not persist logs to localStorage:', e);
        }
    }

    shouldSendToServer(logEntry) {
        if (!this.serverLoggingEnabled) return false;

        try {
            const h = location.hostname;
            if (h === 'localhost' || h === '127.0.0.1') return false;
        } catch (e) {}

        // Only send errors and slow requests to server
        return logEntry.type === 'error' || 
               (logEntry.type === 'response' && logEntry.duration > 5000);
    }

    async sendToServer(logEntry) {
        if (!this.serverLoggingEnabled) return;

        try {
            const h = location.hostname;
            if (h === 'localhost' || h === '127.0.0.1') return;
        } catch (e) {}

        try {
            const fetchImpl = this.originalFetch || window.fetch;
            const response = await fetchImpl('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            });
            if (response && response.ok === false) {
                this.serverLoggingEnabled = false;
            }
        } catch (e) {
            this.serverLoggingEnabled = false;
            console.warn('Could not send log to server:', e);
        }
    }

    getLogs(filter = {}) {
        let filteredLogs = [...this.logs];

        if (filter.type) {
            filteredLogs = filteredLogs.filter(log => log.type === filter.type);
        }

        if (filter.method) {
            filteredLogs = filteredLogs.filter(log => log.method === filter.method);
        }

        if (filter.status) {
            filteredLogs = filteredLogs.filter(log => log.status === filter.status);
        }

        if (filter.startTime) {
            filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime);
        }

        if (filter.endTime) {
            filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime);
        }

        return filteredLogs;
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem('apiLogs');
    }

    exportLogs(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(this.logs);
        }
    }

    convertToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = Object.keys(logs[0]).join(',');
        const rows = logs.map(log => 
            Object.values(log).map(val => 
                typeof val === 'object' ? JSON.stringify(val) : val
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`response_logging_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiLogging = new APIRequestResponseLogging();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestResponseLogging;
}

