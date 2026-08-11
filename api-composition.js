/**
 * API Composition
 * API composition and orchestration
 */

class APIComposition {
    constructor() {
        this.compositions = new Map();
        this.apis = new Map();
        this.init();
    }

    init() {
        this.trackEvent('composition_initialized');
    }

    registerAPI(apiId, apiData) {
        const api = {
            id: apiId,
            ...apiData,
            name: apiData.name || apiId,
            endpoint: apiData.endpoint || '',
            methods: apiData.methods || ['GET'],
            createdAt: new Date()
        };
        
        this.apis.set(apiId, api);
        this.trackEvent('api_registered', { apiId });
        return api;
    }

    createComposition(compositionId, compositionData) {
        const composition = {
            id: compositionId,
            ...compositionData,
            name: compositionData.name || compositionId,
            apis: compositionData.apis || [],
            flow: compositionData.flow || [],
            createdAt: new Date()
        };
        
        this.compositions.set(compositionId, composition);
        console.log(`API composition created: ${compositionId}`);
        return composition;
    }

    async execute(compositionId, input) {
        const composition = this.compositions.get(compositionId);
        if (!composition) {
            throw new Error('Composition not found');
        }
        
        let result = input;
        
        for (const step of composition.flow) {
            const api = this.apis.get(step.apiId);
            if (!api) {
                throw new Error(`API not found: ${step.apiId}`);
            }
            
            result = await this.callAPI(api, result, step);
        }
        
        return result;
    }

    async callAPI(api, input, step) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    apiId: api.id,
                    input,
                    output: { data: 'processed' }
                });
            }, 500);
        });
    }

    getComposition(compositionId) {
        return this.compositions.get(compositionId);
    }

    getAPI(apiId) {
        return this.apis.get(apiId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_composition_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_composition', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiComposition = new APIComposition();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIComposition;
}

