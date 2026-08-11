/**
 * Webhook Documentation
 * Generates documentation for webhooks
 */

class WebhookDocumentation {
    constructor() {
        this.docs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_do_cu_me_nt_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_do_cu_me_nt_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    documentWebhook(webhookId, description, events, payload) {
        this.docs.set(webhookId, {
            description,
            events,
            payload,
            examples: []
        });
    }

    generateDocs() {
        return Array.from(this.docs.entries()).map(([id, doc]) => ({
            id,
            ...doc
        }));
    }
}

// Auto-initialize
const webhookDocs = new WebhookDocumentation();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookDocumentation;
}

