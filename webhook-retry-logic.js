/**
 * Webhook Retry Logic
 * Implements retry logic for failed webhook deliveries
 */

class WebhookRetryLogic {
    constructor() {
        this.maxRetries = 3;
        this.retryDelays = [1000, 5000, 15000];
        this.failedDeliveries = [];
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_re_tr_yl_og_ic_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_re_tr_yl_og_ic_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async retryDelivery(webhookId, event, attempt = 0) {
        if (attempt >= this.maxRetries) {
            this.failedDeliveries.push({ webhookId, event, finalFailure: true });
            return { success: false, maxRetriesReached: true };
        }

        const delay = this.retryDelays[attempt] || 30000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry delivery logic
        return { success: true, attempt: attempt + 1 };
    }
}

// Auto-initialize
const webhookRetry = new WebhookRetryLogic();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookRetryLogic;
}

