/**
 * Zapier Integration
 * Integrates with Zapier automation platform
 */

class ZapierIntegration {
    constructor() {
        this.webhookUrl = null;
        this.apiKey = null;
        this.init();
    }

    init() {
        this.trackEvent('z_ap_ie_ri_nt_eg_ra_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("z_ap_ie_ri_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (_e) { /* Silent fail */ }
    }


    configure(apiKey, webhookUrl) {
        this.apiKey = apiKey;
        this.webhookUrl = webhookUrl;
    }

    async triggerZap(data) {
        if (!this.webhookUrl) {
            throw new Error('Zapier webhook URL not configured');
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Zapier trigger failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Zapier trigger error:', error);
            throw error;
        }
    }

    createZap(trigger, action) {
        return {
            trigger,
            action,
            createdAt: new Date()
        };
    }
}

// Auto-initialize
new ZapierIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZapierIntegration;
}

