/**
 * Integration Analytics
 * Provides analytics for integrations
 */

class IntegrationAnalytics {
    constructor() {
        this.analytics = [];
        this.init();
    }

    init() {
        this.trackEvent('i_nt_eg_ra_ti_on_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_eg_ra_ti_on_an_al_yt_ic_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    trackEvent(integrationId, eventType, data) {
        this.analytics.push({
            integrationId,
            eventType,
            data,
            timestamp: new Date()
        });
    }

    getAnalytics(integrationId) {
        return this.analytics.filter(a => a.integrationId === integrationId);
    }
}

// Auto-initialize
const integrationAnalytics = new IntegrationAnalytics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationAnalytics;
}

