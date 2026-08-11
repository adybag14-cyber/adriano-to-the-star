/**
 * API Documentation (OpenAPI/Swagger)
 * Generates OpenAPI/Swagger documentation
 */

class APIDocumentationOpenAPISwagger {
    constructor() {
        this.specs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('openapi_swagger_initialized');
    }

    createSpec(apiId, info) {
        const spec = {
            openapi: '3.0.0',
            info: {
                title: info.title,
                version: info.version,
                description: info.description
            },
            paths: {},
            components: {
                schemas: {},
                securitySchemes: {}
            }
        };
        
        this.specs.set(apiId, spec);
        return spec;
    }

    addEndpoint(apiId, path, method, endpoint) {
        const spec = this.specs.get(apiId);
        if (!spec) return null;
        
        if (!spec.paths[path]) {
            spec.paths[path] = {};
        }
        
        spec.paths[path][method.toLowerCase()] = {
            summary: endpoint.summary,
            description: endpoint.description,
            parameters: endpoint.parameters || [],
            requestBody: endpoint.requestBody,
            responses: endpoint.responses || {}
        };
        
        return spec;
    }

    generateSwaggerJSON(apiId) {
        const spec = this.specs.get(apiId);
        return spec ? JSON.stringify(spec, null, 2) : null;
    }

    exportSpec(apiId, format = 'json') {
        const spec = this.specs.get(apiId);
        if (!spec) return null;
        
        if (format === 'yaml') {
            return this.toYAML(spec);
        }
        
        return JSON.stringify(spec, null, 2);
    }

    toYAML(spec) {
        // Simplified YAML conversion
        return `openapi: ${spec.openapi}\ninfo:\n  title: ${spec.info.title}\n  version: ${spec.info.version}`;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`openapi_swagger_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_documentation_openapi_swagger', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiDocumentationOpenAPI = new APIDocumentationOpenAPISwagger();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIDocumentationOpenAPISwagger;
}


