/**
 * API Documentation (OpenAPI/Swagger)
 * API documentation system
 */

class APIDocumentationOpenAPI {
    constructor() {
        this.spec = null;
        this.init();
    }
    
    init() {
        this.loadSpec();
        this.trackEvent('openapi_initialized');
    }
    
    async loadSpec() {
        // Load OpenAPI specification
        try {
            const response = await fetch('/api/openapi.json');
            this.spec = await response.json();
        } catch (e) {
            console.warn('Could not load OpenAPI spec:', e);
        }
    }
    
    getSpec() {
        // Get OpenAPI specification
        return this.spec;
    }
    
    async generateDocs() {
        // Generate API documentation
        if (this.spec) {
            this.trackEvent('docs_generated');
            return { generated: true, spec: this.spec };
        }
        return { generated: false };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`openapi_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_documentation_openapi', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.apiDocumentationOpenAPI = new APIDocumentationOpenAPI(); });
} else {
    window.apiDocumentationOpenAPI = new APIDocumentationOpenAPI();
}

