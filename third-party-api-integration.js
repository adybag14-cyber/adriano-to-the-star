/**
 * Third-Party API Integration
 * @class ThirdPartyAPIIntegration
 * @description Manages integrations with third-party APIs.
 */
class ThirdPartyAPIIntegration {
    constructor() {
        this.integrations = new Map();
        this.connections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_hi_rd_pa_rt_ya_pi_in_te_gr_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_hi_rd_pa_rt_ya_pi_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Register integration.
     * @param {string} integrationId - Integration identifier.
     * @param {object} integrationData - Integration data.
     */
    registerIntegration(integrationId, integrationData) {
        this.integrations.set(integrationId, {
            ...integrationData,
            id: integrationId,
            provider: integrationData.provider,
            apiKey: integrationData.apiKey,
            endpoint: integrationData.endpoint,
            version: integrationData.version || 'v1',
            status: 'active',
            registeredAt: new Date()
        });
        console.log(`Integration registered: ${integrationId}`);
    }

    /**
     * Call third-party API.
     * @param {string} integrationId - Integration identifier.
     * @param {string} method - HTTP method.
     * @param {string} path - API path.
     * @param {object} data - Request data.
     * @returns {Promise<object>} API response.
     */
    async callAPI(integrationId, method, path, data = {}) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error(`Integration not found: ${integrationId}`);
        }

        const url = `${integration.endpoint}/${integration.version}${path}`;
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${integration.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API call error for ${integrationId}:`, error);
            throw error;
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.thirdPartyAPIIntegration = new ThirdPartyAPIIntegration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThirdPartyAPIIntegration;
}

