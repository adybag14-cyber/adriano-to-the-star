/**
 * API Documentation
 * @class APIDocumentation
 * @description Generates and manages API documentation.
 */
class APIDocumentation {
    constructor() {
        this.endpoints = new Map();
        this.schemas = new Map();
        this.init();
    }

    init() {
        this.trackEvent('documentation_initialized');
    }

    /**
     * Register API endpoint.
     * @param {string} endpointId - Endpoint identifier.
     * @param {object} endpointData - Endpoint data.
     */
    registerEndpoint(endpointId, endpointData) {
        this.endpoints.set(endpointId, {
            ...endpointData,
            id: endpointId,
            method: endpointData.method || 'GET',
            path: endpointData.path,
            description: endpointData.description,
            parameters: endpointData.parameters || [],
            responses: endpointData.responses || {},
            createdAt: new Date()
        });
        this.trackEvent('endpoint_registered', { endpointId });
    }

    /**
     * Generate API documentation.
     * @param {string} format - Documentation format (markdown, html, openapi).
     * @returns {string} Generated documentation.
     */
    generateDocumentation(format = 'markdown') {
        const endpoints = Array.from(this.endpoints.values());
        let documentation = '';

        if (format === 'markdown') {
            documentation = '# API Documentation\n\n';
            endpoints.forEach(endpoint => {
                documentation += `## ${endpoint.method} ${endpoint.path}\n\n`;
                documentation += `${endpoint.description || ''}\n\n`;
            });
        }

        return documentation;
    }

    /**
     * Get endpoint documentation.
     * @param {string} endpointId - Endpoint identifier.
     * @returns {object} Endpoint documentation.
     */
    getEndpointDoc(endpointId) {
        return this.endpoints.get(endpointId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_doc_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_documentation', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiDocumentation = new APIDocumentation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIDocumentation;
}

