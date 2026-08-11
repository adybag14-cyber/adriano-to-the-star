/**
 * API Lifecycle Management
 * API lifecycle management system
 */

class APILifecycleManagement {
    constructor() {
        this.lifecycles = new Map();
        this.apis = new Map();
        this.stages = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_lifecycle_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_lifecycle_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createLifecycle(lifecycleId, lifecycleData) {
        const lifecycle = {
            id: lifecycleId,
            ...lifecycleData,
            name: lifecycleData.name || lifecycleId,
            stages: lifecycleData.stages || ['design', 'develop', 'test', 'deploy', 'deprecate'],
            status: 'active',
            createdAt: new Date()
        };
        
        this.lifecycles.set(lifecycleId, lifecycle);
        return lifecycle;
    }

    async transition(apiId, fromStage, toStage) {
        const api = this.apis.get(apiId);
        if (!api) {
            throw new Error(`API ${apiId} not found`);
        }

        api.stage = toStage;
        api.previousStage = fromStage;
        api.transitionedAt = new Date();

        return api;
    }

    async registerAPI(apiId, apiData) {
        const api = {
            id: apiId,
            ...apiData,
            name: apiData.name || apiId,
            lifecycleId: apiData.lifecycleId || '',
            stage: apiData.stage || 'design',
            status: 'active',
            createdAt: new Date()
        };

        this.apis.set(apiId, api);
        return api;
    }

    getLifecycle(lifecycleId) {
        return this.lifecycles.get(lifecycleId);
    }

    getAllLifecycles() {
        return Array.from(this.lifecycles.values());
    }
}

module.exports = APILifecycleManagement;

