/**
 * Webhook Debugging
 * Provides debugging tools for webhooks
 */

class WebhookDebugging {
    constructor() {
        this.debugLogs = [];
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_de_bu_gg_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_de_bu_gg_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    logDebug(webhookId, message, data) {
        this.debugLogs.push({
            webhookId,
            message,
            data,
            timestamp: new Date()
        });
    }

    getDebugLogs(webhookId) {
        return this.debugLogs.filter(log => log.webhookId === webhookId);
    }
}

// Auto-initialize
const webhookDebugging = new WebhookDebugging();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookDebugging;
}

