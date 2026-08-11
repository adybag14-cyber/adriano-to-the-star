/**
 * API Versioning System
 * Manages API versions
 */

class APIVersioningSystem {
    constructor() {
        this.versions = new Map();
        this.currentVersion = 'v2';
        this.init();
    }
    
    init() {
        this.setupVersioning();
        this.trackEvent('versioning_sys_initialized');
    }
    
    setupVersioning() {
        // Setup API versioning
        this.versions.set('v1', { deprecated: true, sunsetDate: null });
        this.versions.set('v2', { deprecated: false, sunsetDate: null });
    }
    
    getVersion(version) {
        // Get version info
        return this.versions.get(version);
    }
    
    async request(version, endpoint, options = {}) {
        // Make versioned API request
        const versionedEndpoint = `/api/${version}${endpoint}`;
        return await fetch(versionedEndpoint, options);
    }
    
    getCurrentVersion() {
        // Get current API version
        return this.currentVersion;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`versioning_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.apiVersioningSystem = new APIVersioningSystem(); });
} else {
    window.apiVersioningSystem = new APIVersioningSystem();
}
