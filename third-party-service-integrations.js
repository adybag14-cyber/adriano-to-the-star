/**
 * Third-Party Service Integrations
 * Base class for integrating with various third-party services
 */

class ThirdPartyServiceIntegrations {
    constructor() {
        this.integrations = new Map();
        this.configs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_or_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerIntegration(name, integration) {
        this.integrations.set(name, integration);
    }

    getIntegration(name) {
        return this.integrations.get(name);
    }

    configureService(name, config) {
        this.configs.set(name, config);
    }

    getConfig(name) {
        return this.configs.get(name);
    }

    async callService(name, method, params) {
        const integration = this.getIntegration(name);
        if (!integration) {
            throw new Error(`Integration ${name} not found`);
        }

        const config = this.getConfig(name);
        if (!config) {
            throw new Error(`Configuration for ${name} not found`);
        }

        if (typeof integration[method] !== 'function') {
            throw new Error(`Method ${method} not found in integration ${name}`);
        }

        return await integration[method](config, params);
    }
}

// Auto-initialize
const thirdPartyIntegrations = new ThirdPartyServiceIntegrations();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThirdPartyServiceIntegrations;
}

