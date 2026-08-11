const fs = require('fs');
const path = require('path');

class APIRequestLogging {
    constructor(options = {}) {
        this.dir = options.dir || path.join(process.cwd(), 'logs');
        this.enabled = options.enabled !== false;
        try { if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true }); } catch (_) {}
        this.trackEvent('logging_initialized');
    }
    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`logging_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    logRequest(id, method, url, headers = {}, body = null) {
        if (!this.enabled) return;
        const entry = `[${new Date().toISOString()}] ${id} -> ${method} ${url}\n`;
        this._append('requests.log', entry);
    }
    logResponse(id, statusCode, headers = {}, body = null, durationMs = 0) {
        if (!this.enabled) return;
        const entry = `[${new Date().toISOString()}] ${id} <- ${statusCode} (${durationMs}ms)\n`;
        this._append('responses.log', entry);
    }
    _append(file, line) {
        try { fs.appendFileSync(path.join(this.dir, file), line); } catch (_) {}
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestLogging;
}
