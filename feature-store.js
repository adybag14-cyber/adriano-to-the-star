/**
 * Feature Store
 * Centralized feature storage and management
 */

class FeatureStore {
    constructor() {
        this.features = new Map();
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ea_tu_re_st_or_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ea_tu_re_st_or_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerFeature(featureId, featureData) {
        const feature = {
            id: featureId,
            ...featureData,
            name: featureData.name || featureId,
            type: featureData.type || 'numeric',
            description: featureData.description || '',
            versions: [],
            createdAt: new Date()
        };
        
        this.features.set(featureId, feature);
        console.log(`Feature registered: ${featureId}`);
        return feature;
    }

    createVersion(featureId, versionData) {
        const feature = this.features.get(featureId);
        if (!feature) {
            throw new Error('Feature not found');
        }
        
        const version = {
            id: `version_${Date.now()}`,
            featureId,
            ...versionData,
            version: versionData.version || this.getNextVersion(feature),
            data: versionData.data || [],
            createdAt: new Date()
        };
        
        this.versions.set(version.id, version);
        feature.versions.push(version.id);
        
        return version;
    }

    getNextVersion(feature) {
        return feature.versions.length + 1;
    }

    getFeature(featureId, version = null) {
        const feature = this.features.get(featureId);
        if (!feature) {
            return null;
        }
        
        if (version) {
            const versionData = this.versions.get(version);
            return versionData ? { ...feature, version: versionData } : feature;
        }
        
        return feature;
    }

    getVersion(versionId) {
        return this.versions.get(versionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.featureStore = new FeatureStore();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureStore;
}


