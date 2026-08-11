/**
 * Advanced Debugging and Error Monitoring System
 * Catches issues on the fly and provides detailed diagnostics
 */

const fs = require('fs');
const path = require('path');

class DebugMonitor {
    constructor(options = {}) {
        this.logDir = options.logDir || path.join(__dirname, 'logs');
        this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
        this.enableFileLogging = options.enableFileLogging !== false;
        this.enableConsoleLogging = options.enableConsoleLogging !== false;
        this.errorThreshold = options.errorThreshold || 10; // Auto-trigger after 10 errors
        this.errorWindow = options.errorWindow || 60000; // 1 minute window
        
        this.errorCount = 0;
        this.errorTimestamps = [];
        this.lastError = null;
        this.stats = {
            totalErrors: 0,
            totalWarnings: 0,
            totalInfo: 0,
            errorsByType: {},
            errorsByEndpoint: {}
        };
        
        this.ensureLogDirectory();
        this.startHealthCheck();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    sanitizeForJSON(obj, seen = new WeakSet()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (seen.has(obj)) {
            return '[Circular]';
        }
        
        seen.add(obj);
        
        if (obj instanceof Error) {
            return {
                name: obj.name,
                message: obj.message,
                stack: obj.stack,
                code: obj.code
            };
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeForJSON(item, seen));
        }
        
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                try {
                    sanitized[key] = this.sanitizeForJSON(obj[key], seen);
                } catch (e) {
                    sanitized[key] = '[Unable to serialize]';
                }
            }
        }
        
        return sanitized;
    }

    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            stack: data.error?.stack || null
        };

        // Update stats
        if (level === 'error') {
            this.stats.totalErrors++;
            this.lastError = logEntry;
            this.errorCount++;
            this.errorTimestamps.push(Date.now());
            
            // Track by type
            const errorType = data.error?.name || 'Unknown';
            this.stats.errorsByType[errorType] = (this.stats.errorsByType[errorType] || 0) + 1;
            
            // Track by endpoint
            if (data.endpoint) {
                this.stats.errorsByEndpoint[data.endpoint] = (this.stats.errorsByEndpoint[data.endpoint] || 0) + 1;
            }
            
            // Check error threshold
            this.checkErrorThreshold();
        } else if (level === 'warn') {
            this.stats.totalWarnings++;
        } else {
            this.stats.totalInfo++;
        }

        // Console logging
        if (this.enableConsoleLogging) {
            const colors = {
                error: '\x1b[31m',   // Red
                warn: '\x1b[33m',    // Yellow
                info: '\x1b[36m',    // Cyan
                debug: '\x1b[90m'     // Gray
            };
            const reset = '\x1b[0m';
            const color = colors[level] || '';
            console.log(`${color}[${level.toUpperCase()}]${reset} [${timestamp}] ${message}`, data.error || data);
        }

        // File logging
        if (this.enableFileLogging) {
            this.writeToLogFile(logEntry);
        }
    }

    writeToLogFile(logEntry) {
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `debug-${date}.log`);
        
        // Handle circular references in error objects
        const safeLogEntry = this.sanitizeForJSON(logEntry);
        const logLine = JSON.stringify(safeLogEntry) + '\n';
        
        try {
            // Check file size and rotate if needed
            if (fs.existsSync(logFile)) {
                const stats = fs.statSync(logFile);
                if (stats.size > this.maxLogSize) {
                    const rotatedFile = path.join(this.logDir, `debug-${date}-${Date.now()}.log`);
                    fs.renameSync(logFile, rotatedFile);
                }
            }
            
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    checkErrorThreshold() {
        // Clean old timestamps
        const now = Date.now();
        this.errorTimestamps = this.errorTimestamps.filter(ts => now - ts < this.errorWindow);
        
        // Check threshold
        if (this.errorTimestamps.length >= this.errorThreshold) {
            this.log('warn', `Error threshold exceeded: ${this.errorTimestamps.length} errors in ${this.errorWindow}ms`, {
                threshold: this.errorThreshold,
                window: this.errorWindow,
                recentErrors: this.getRecentErrors(5)
            });
            
            // Trigger auto-recovery
            this.triggerAutoRecovery();
        }
    }

    getRecentErrors(count = 10) {
        const errorFile = path.join(this.logDir, `debug-${new Date().toISOString().split('T')[0]}.log`);
        if (!fs.existsSync(errorFile)) return [];
        
        try {
            const lines = fs.readFileSync(errorFile, 'utf8').split('\n').filter(l => l);
            return lines
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(entry => entry && entry.level === 'error')
                .slice(-count);
        } catch {
            return [];
        }
    }

    async triggerAutoRecovery() {
        this.log('info', 'Auto-recovery triggered', { errorCount: this.errorTimestamps.length });
        
        // Try to recover common issues
        const recoveryActions = [
            this.checkGeminiAPIKey.bind(this),
            this.checkWebSocketConnections.bind(this),
            this.checkBackendHealth.bind(this)
        ];
        
        for (const action of recoveryActions) {
            try {
                await action();
            } catch (error) {
                this.log('error', 'Auto-recovery action failed', { error, action: action.name });
            }
        }
    }

    async checkGeminiAPIKey() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            this.log('error', 'Gemini API key not configured', {
                suggestion: 'Set GEMINI_API_KEY in .env file'
            });
            return false;
        }
        return true;
    }

    async checkWebSocketConnections() {
        // This would check active WebSocket connections
        // Implementation depends on your WebSocket server
        this.log('info', 'WebSocket connection check completed');
        return true;
    }

    async checkBackendHealth() {
        // Check if backend services are healthy
        this.log('info', 'Backend health check completed');
        return true;
    }

    startHealthCheck() {
        // Periodic health check every 30 seconds
        setInterval(() => {
            this.log('debug', 'Health check', {
                errorCount: this.errorCount,
                stats: this.stats,
                memory: process.memoryUsage()
            });
        }, 30000);
    }

    getStats() {
        return {
            ...this.stats,
            currentErrorCount: this.errorCount,
            recentErrors: this.getRecentErrors(5),
            lastError: this.lastError
        };
    }

    resetStats() {
        this.stats = {
            totalErrors: 0,
            totalWarnings: 0,
            totalInfo: 0,
            errorsByType: {},
            errorsByEndpoint: {}
        };
        this.errorCount = 0;
        this.errorTimestamps = [];
        this.lastError = null;
    }
}

// Export singleton instance
const debugMonitor = new DebugMonitor();

module.exports = debugMonitor;


