class WebhookSystem {
    constructor() {
        this.handlers = new Map();
        this.events = [];
        this.maxRetries = 3;
    }
    register(source, handler) {
        if (typeof handler !== 'function') return false;
        this.handlers.set(source, handler);
        return true;
    }
    async handle(source, payload) {
        const h = this.handlers.get(source);
        const evt = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), source, payload, attempts: 0, timestamp: new Date() };
        this.events.push(evt);
        if (!h) return { delivered: false, reason: 'no_handler' };
        let lastError = null;
        for (let i = 0; i < this.maxRetries; i++) {
            evt.attempts = i + 1;
            try {
                const result = await Promise.resolve(h(payload));
                return { delivered: true, attempts: i + 1, result };
            } catch (e) {
                lastError = e;
            }
        }
        return { delivered: false, attempts: this.maxRetries, error: lastError ? lastError.message : 'unknown' };
    }
    recent(limit = 20) {
        return this.events.slice(-limit).reverse();
    }
}
const webhookSystem = new WebhookSystem();
if (typeof window !== 'undefined') {
    window.webhookSystem = webhookSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookSystem;
}
