/**
 * Webhook Monitoring
 * Monitors webhook delivery and performance
 */

class WebhookMonitoring {
    constructor() {
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_mo_ni_to_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_mo_ni_to_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    recordDelivery(webhookId, success, duration) {
        if (!this.metrics.has(webhookId)) {
            this.metrics.set(webhookId, { total: 0, successful: 0, failed: 0, avgDuration: 0 });
        }
        
        const metric = this.metrics.get(webhookId);
        metric.total++;
        if (success) {
            metric.successful++;
        } else {
            metric.failed++;
        }
        metric.avgDuration = (metric.avgDuration * (metric.total - 1) + duration) / metric.total;
    }

    getMetrics(webhookId) {
        return this.metrics.get(webhookId) || { total: 0, successful: 0, failed: 0, avgDuration: 0 };
    }
}

// Auto-initialize
const webhookMonitoring = new WebhookMonitoring();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookMonitoring;
}

