/**
 * Feature Toggles
 * Feature flag management
 */

class FeatureToggles {
    constructor() {
        this.toggles = new Map();
        this.environments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ea_tu_re_to_gg_le_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ea_tu_re_to_gg_le_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createToggle(toggleId, toggleData) {
        const toggle = {
            id: toggleId,
            ...toggleData,
            name: toggleData.name || toggleId,
            description: toggleData.description || '',
            enabled: toggleData.enabled || false,
            environments: {},
            createdAt: new Date()
        };
        
        this.toggles.set(toggleId, toggle);
        console.log(`Feature toggle created: ${toggleId}`);
        return toggle;
    }

    setEnvironment(environmentId, environmentData) {
        const environment = {
            id: environmentId,
            ...environmentData,
            name: environmentData.name || environmentId,
            toggles: {},
            createdAt: new Date()
        };
        
        this.environments.set(environmentId, environment);
        console.log(`Environment created: ${environmentId}`);
        return environment;
    }

    enable(toggleId, environmentId = null) {
        const toggle = this.toggles.get(toggleId);
        if (!toggle) {
            throw new Error('Toggle not found');
        }
        
        if (environmentId) {
            toggle.environments[environmentId] = true;
        } else {
            toggle.enabled = true;
        }
        
        return toggle;
    }

    disable(toggleId, environmentId = null) {
        const toggle = this.toggles.get(toggleId);
        if (!toggle) {
            throw new Error('Toggle not found');
        }
        
        if (environmentId) {
            toggle.environments[environmentId] = false;
        } else {
            toggle.enabled = false;
        }
        
        return toggle;
    }

    isEnabled(toggleId, environmentId = null) {
        const toggle = this.toggles.get(toggleId);
        if (!toggle) {
            return false;
        }
        
        if (environmentId) {
            return toggle.environments[environmentId] === true;
        }
        
        return toggle.enabled;
    }

    getToggle(toggleId) {
        return this.toggles.get(toggleId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.featureToggles = new FeatureToggles();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureToggles;
}

