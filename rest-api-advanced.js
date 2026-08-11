/**
 * REST API Advanced
 * Advanced REST API system
 */

class RESTAPIAdvanced {
    constructor() {
        this.apis = new Map();
        this.resources = new Map();
        this.operations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_es_ta_pi_ad_va_nc_ed_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_es_ta_pi_ad_va_nc_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createAPI(apiId, apiData) {
        const api = {
            id: apiId,
            ...apiData,
            name: apiData.name || apiId,
            basePath: apiData.basePath || '/api',
            resources: apiData.resources || [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.apis.set(apiId, api);
        return api;
    }

    async createResource(resourceId, resourceData) {
        const resource = {
            id: resourceId,
            ...resourceData,
            name: resourceData.name || resourceId,
            apiId: resourceData.apiId || '',
            path: resourceData.path || '',
            methods: resourceData.methods || ['GET'],
            status: 'active',
            createdAt: new Date()
        };

        this.resources.set(resourceId, resource);
        return resource;
    }

    async handleRequest(apiId, method, path, data) {
        const api = this.apis.get(apiId);
        if (!api) {
            throw new Error(`API ${apiId} not found`);
        }

        const resource = Array.from(this.resources.values())
            .find(r => r.apiId === apiId && r.path === path && r.methods.includes(method));

        return {
            apiId,
            method,
            path,
            resource: resource || null,
            handled: !!resource,
            timestamp: new Date()
        };
    }

    getAPI(apiId) {
        return this.apis.get(apiId);
    }

    getAllAPIs() {
        return Array.from(this.apis.values());
    }
}

module.exports = RESTAPIAdvanced;

