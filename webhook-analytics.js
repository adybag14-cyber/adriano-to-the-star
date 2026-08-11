/**
 * Webhook Analytics
 * Provides analytics for webhook usage
 */

class WebhookAnalytics {
    constructor() {
        this.analytics = [];
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_an_al_yt_ic_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    trackEvent(webhookId, eventType, data) {
        this.analytics.push({
            webhookId,
            eventType,
            data,
            timestamp: new Date()
        });
    }

    getAnalytics(webhookId, startDate, endDate) {
        return this.analytics.filter(a => 
            a.webhookId === webhookId &&
            a.timestamp >= startDate &&
            a.timestamp <= endDate
        );
    }
}

// Auto-initialize
const webhookAnalytics = new WebhookAnalytics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookAnalytics;
}

