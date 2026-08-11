class ErrorTracking {
    constructor() {
        this.sinks = [];
        this.errors = [];
        this.enabled = true;
        this.trackEvent('error_tracking_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_tracking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    addSink(sink) {
        if (typeof sink !== 'function') return;
        this.sinks.push(sink);
    }
    configure(config) {
        this.enabled = config?.enabled !== false;
    }
    capture(error, context = {}) {
        if (!this.enabled || !error) return null;
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack || '',
            context,
            timestamp: new Date()
        };
        this.errors.push(entry);
        this.sinks.forEach(s => {
            try { s(entry); } catch (_) {}
        });
        return entry;
    }
    getRecent(limit = 50) {
        return this.errors.slice(-limit).reverse();
    }
    clear() {
        this.errors = [];
    }
}
const errorTracking = new ErrorTracking();
if (typeof window !== 'undefined') {
    window.errorTracking = errorTracking;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTracking;
}
