/**
 * AI Model Versioning
 * AI model version control and management
 */

class AIModelVersioning {
    constructor() {
        this.models = new Map();
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('versioning_initialized');
    }

    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            versions: [],
            currentVersion: null,
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        this.trackEvent('model_registered', { modelId });
        return model;
    }

    createVersion(modelId, versionData) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        
        const version = {
            id: `version_${Date.now()}`,
            modelId,
            ...versionData,
            version: versionData.version || this.getNextVersion(model),
            metadata: versionData.metadata || {},
            createdAt: new Date()
        };
        
        this.versions.set(version.id, version);
        model.versions.push(version.id);
        model.currentVersion = version.id;
        this.trackEvent('version_created', { modelId, versionId: version.id, version: version.version });
        
        return version;
    }

    getNextVersion(model) {
        if (model.versions.length === 0) {
            return '1.0.0';
        }
        
        const latestVersion = this.versions.get(model.versions[model.versions.length - 1]);
        if (!latestVersion) {
            return '1.0.0';
        }
        
        const parts = latestVersion.version.split('.').map(Number);
        parts[2]++;
        if (parts[2] >= 100) {
            parts[2] = 0;
            parts[1]++;
        }
        if (parts[1] >= 100) {
            parts[1] = 0;
            parts[0]++;
        }
        
        return parts.join('.');
    }

    setCurrentVersion(modelId, versionId) {
        const model = this.models.get(modelId);
        const version = this.versions.get(versionId);
        
        if (!model) {
            throw new Error('Model not found');
        }
        if (!version) {
            throw new Error('Version not found');
        }
        
        model.currentVersion = versionId;
        return model;
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }

    getVersion(versionId) {
        return this.versions.get(versionId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`versioning_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ai_model_versioning', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.aiModelVersioning = new AIModelVersioning();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModelVersioning;
}


