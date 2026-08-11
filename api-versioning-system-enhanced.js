/**
 * API Versioning System (Enhanced)
 * Enhanced API versioning for Agent 2
 */

class APIVersioningSystemEnhanced {
    constructor() {
        this.versions = new Map();
        this.currentVersion = 'v1';
        this.init();
    }

    init() {
        this.trackEvent('versioning_sys_enh_initialized');
    }

    createVersion(version, api) {
        this.versions.set(version, {
            ...api,
            version,
            createdAt: new Date()
        });
    }

    getVersion(version) {
        return this.versions.get(version || this.currentVersion);
    }

    setCurrentVersion(version) {
        if (this.versions.has(version)) {
            this.currentVersion = version;
        }
    }

    getAllVersions() {
        return Array.from(this.versions.values());
    }

    deprecateVersion(version, deprecationDate) {
        const api = this.versions.get(version);
        if (api) {
            api.deprecated = true;
            api.deprecationDate = deprecationDate;
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`versioning_sys_enh_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiVersioningSystemEnhanced = new APIVersioningSystemEnhanced();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIVersioningSystemEnhanced;
}


