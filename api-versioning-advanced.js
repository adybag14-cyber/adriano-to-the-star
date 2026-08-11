/**
 * API Versioning Advanced
 * Advanced API versioning system
 */

class APIVersioningAdvanced {
    constructor() {
        this.apis = new Map();
        this.versions = new Map();
        this.strategies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_versioning_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_versioning_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createAPI(apiId, apiData) {
        const api = {
            id: apiId,
            ...apiData,
            name: apiData.name || apiId,
            versions: apiData.versions || [],
            strategy: apiData.strategy || 'url',
            status: 'active',
            createdAt: new Date()
        };
        
        this.apis.set(apiId, api);
        return api;
    }

    async createVersion(versionId, versionData) {
        const version = {
            id: versionId,
            ...versionData,
            apiId: versionData.apiId || '',
            version: versionData.version || '1.0.0',
            status: versionData.status || 'active',
            createdAt: new Date()
        };

        this.versions.set(versionId, version);
        return version;
    }

    async resolveVersion(apiId, request) {
        const api = this.apis.get(apiId);
        if (!api) {
            throw new Error(`API ${apiId} not found`);
        }

        return {
            apiId,
            request,
            version: this.extractVersion(request, api),
            timestamp: new Date()
        };
    }

    extractVersion(request, api) {
        if (api.strategy === 'url') {
            return request.path.split('/')[1] || '1.0.0';
        } else if (api.strategy === 'header') {
            return request.headers['api-version'] || '1.0.0';
        }
        return '1.0.0';
    }

    getAPI(apiId) {
        return this.apis.get(apiId);
    }

    getAllAPIs() {
        return Array.from(this.apis.values());
    }
}

module.exports = APIVersioningAdvanced;

