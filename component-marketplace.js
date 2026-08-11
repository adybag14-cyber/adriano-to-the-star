/**
 * Component Marketplace
 * Marketplace for sharing and discovering components
 */

class ComponentMarketplace {
    constructor() {
        this.components = new Map();
        this.categories = new Map();
        this.initialized = false;
    }

    /**
     * Initialize Component Marketplace
     */
    async initialize() {
        this.initialized = true;
        this.trackEvent('comp_market_initialized');
        return { success: true, message: 'Component Marketplace initialized' };
    }

    /**
     * Publish component
     * @param {string} name - Component name
     * @param {Object} component - Component data
     */
    publishComponent(name, component) {
        this.components.set(name, {
            ...component,
            publishedAt: new Date(),
            downloads: 0
        });
    }

    /**
     * Get component
     * @param {string} name - Component name
     * @returns {Object|null}
     */
    getComponent(name) {
        const component = this.components.get(name);
        if (component) {
            component.downloads++;
        }
        return component;
    }

    /**
     * Search components
     * @param {string} query - Search query
     * @returns {Array<Object>}
     */
    searchComponents(query) {
        const results = [];
        this.components.forEach((component, name) => {
            if (name.toLowerCase().includes(query.toLowerCase()) ||
                (component.description && component.description.toLowerCase().includes(query.toLowerCase()))) {
                results.push({ name, ...component });
            }
        });
        return results;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`comp_market_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentMarketplace;
}

