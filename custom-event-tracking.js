class CustomEventTracking {
    constructor() {
        this.events = [];
        this.enabled = true;
        this.flushIntervalMs = 60000;
        this.flushHandler = null;
        this.startAutoFlush();
        this.trackTelemetry('custom_evt_track_initialized');
    }
    configure(config) {
        this.enabled = config?.enabled !== false;
        if (config?.flushIntervalMs) {
            this.flushIntervalMs = config.flushIntervalMs;
            this.startAutoFlush();
        }
        if (config?.onFlush && typeof config.onFlush === 'function') {
            this.flushHandler = config.onFlush;
        }
    }
    track(category, action, label = '', value = null, meta = {}) {
        if (!this.enabled) return null;
        const evt = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            category,
            action,
            label,
            value,
            meta,
            timestamp: new Date()
        };
        this.events.push(evt);
        return evt;
    }
    getEvents(filters = {}) {
        let list = [...this.events];
        if (filters.category) list = list.filter(e => e.category === filters.category);
        if (filters.action) list = list.filter(e => e.action === filters.action);
        if (filters.after) list = list.filter(e => e.timestamp >= filters.after);
        if (filters.before) list = list.filter(e => e.timestamp <= filters.before);
        return list;
    }
    clear() {
        this.events = [];
    }
    startAutoFlush() {
        if (this._timer) clearInterval(this._timer);
        this._timer = setInterval(() => this.flush(), this.flushIntervalMs);
    }
    async flush() {
        if (!this.flushHandler || this.events.length === 0) return { flushed: 0 };
        const batch = [...this.events];
        this.clear();
        try {
            await Promise.resolve(this.flushHandler(batch));
            return { flushed: batch.length };
        } catch (_) {
            this.events = batch.concat(this.events);
            return { flushed: 0 };
        }
    }
    trackTelemetry(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`custom_evt_track_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}
const customEventTracking = new CustomEventTracking();
if (typeof window !== 'undefined') {
    window.customEventTracking = customEventTracking;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomEventTracking;
}
