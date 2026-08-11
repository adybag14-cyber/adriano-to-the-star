/**
 * Planet Discovery Logging System
 * Centralized logging with different levels and persistence
 */

class PlanetDiscoveryLoggingSystem {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = 'info'; // 'debug', 'info', 'warn', 'error'
        this.enablePersistence = true;
        this.init();
    }

    init() {
        this.loadLogs();
        this.setupConsoleOverrides();
        console.log('📝 Logging system initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_lo_gg_in_gs_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupConsoleOverrides() {
        // Override console methods to capture logs
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;
        const originalDebug = console.debug;

        console.log = (...args) => {
            this.log('info', ...args);
            originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            this.log('warn', ...args);
            originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            this.log('error', ...args);
            originalError.apply(console, args);
        };

        console.info = (...args) => {
            this.log('info', ...args);
            originalInfo.apply(console, args);
        };

        console.debug = (...args) => {
            this.log('debug', ...args);
            originalDebug.apply(console, args);
        };
    }

    log(level, ...args) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = {
            level,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' '),
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);

        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Persist logs
        if (this.enablePersistence) {
            this.saveLogs();
        }
    }

    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

    setLogLevel(level) {
        this.logLevel = level;
        try {
            localStorage.setItem('log-level', level);
        } catch (e) {
            console.warn('Could not save log level:', e);
        }
    }

    getLogLevel() {
        return this.logLevel;
    }

    loadLogs() {
        try {
            const saved = localStorage.getItem('app-logs');
            if (saved) {
                this.logs = JSON.parse(saved);
            }

            const savedLevel = localStorage.getItem('log-level');
            if (savedLevel) {
                this.logLevel = savedLevel;
            }
        } catch (e) {
            console.warn('Could not load logs:', e);
        }
    }

    saveLogs() {
        try {
            // Only save recent logs to avoid localStorage size limits
            const recentLogs = this.logs.slice(-100);
            localStorage.setItem('app-logs', JSON.stringify(recentLogs));
        } catch (e) {
            console.warn('Could not save logs:', e);
        }
    }

    getLogs(level = null, limit = null) {
        let filtered = this.logs;

        if (level) {
            filtered = filtered.filter(log => log.level === level);
        }

        if (limit) {
            filtered = filtered.slice(-limit);
        }

        return filtered;
    }

    clearLogs() {
        this.logs = [];
        try {
            localStorage.removeItem('app-logs');
        } catch (e) {
            console.warn('Could not clear logs:', e);
        }
    }

    exportLogs(format = 'json') {
        const logs = this.getLogs();

        if (format === 'json') {
            const json = JSON.stringify(logs, null, 2);
            this.downloadFile(json, 'logs.json', 'application/json');
        } else if (format === 'txt') {
            const txt = logs.map(log => 
                `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
            ).join('\n');
            this.downloadFile(txt, 'logs.txt', 'text/plain');
        } else if (format === 'csv') {
            const csv = [
                'Timestamp,Level,Message,URL',
                ...logs.map(log => 
                    `"${log.timestamp}","${log.level}","${log.message.replace(/"/g, '""')}","${log.url}"`
                )
            ].join('\n');
            this.downloadFile(csv, 'logs.csv', 'text/csv');
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    renderLogViewer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const logs = this.getLogs();
        const logLevels = ['debug', 'info', 'warn', 'error'];

        container.innerHTML = `
            <div class="log-viewer" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">📝 Log Viewer</h3>
                    <div style="display: flex; gap: 1rem;">
                        <select id="log-level-filter" style="padding: 0.5rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px;">
                            <option value="">All Levels</option>
                            ${logLevels.map(level => `<option value="${level}">${level.toUpperCase()}</option>`).join('')}
                        </select>
                        <button id="export-logs-btn" style="padding: 0.5rem 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 5px; color: #ba944f; cursor: pointer;">
                            Export
                        </button>
                        <button id="clear-logs-btn" style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 5px; color: #ef4444; cursor: pointer;">
                            Clear
                        </button>
                    </div>
                </div>
                <div id="logs-container" style="max-height: 500px; overflow-y: auto; background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 10px; font-family: monospace; font-size: 0.85em;">
                    ${this.renderLogs(logs)}
                </div>
            </div>
        `;

        document.getElementById('log-level-filter')?.addEventListener('change', (e) => {
            const filtered = this.getLogs(e.target.value || null);
            document.getElementById('logs-container').innerHTML = this.renderLogs(filtered);
        });

        document.getElementById('export-logs-btn')?.addEventListener('click', () => {
            this.exportLogs('json');
        });

        document.getElementById('clear-logs-btn')?.addEventListener('click', () => {
            if (confirm('Clear all logs?')) {
                this.clearLogs();
                document.getElementById('logs-container').innerHTML = this.renderLogs([]);
            }
        });
    }

    renderLogs(logs) {
        if (logs.length === 0) {
            return '<p style="opacity: 0.7; text-align: center;">No logs available</p>';
        }

        return logs.map(log => {
            const levelColor = {
                debug: '#6b7280',
                info: '#3b82f6',
                warn: '#f59e0b',
                error: '#ef4444'
            }[log.level] || '#ffffff';

            return `
                <div style="padding: 0.5rem; border-bottom: 1px solid rgba(186, 148, 79, 0.1);">
                    <span style="color: ${levelColor}; font-weight: bold;">[${log.level.toUpperCase()}]</span>
                    <span style="color: rgba(255, 255, 255, 0.7); margin-left: 0.5rem;">${log.timestamp}</span>
                    <div style="color: rgba(255, 255, 255, 0.9); margin-top: 0.25rem;">${log.message}</div>
                </div>
            `;
        }).join('');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryLoggingSystem = new PlanetDiscoveryLoggingSystem();
}

