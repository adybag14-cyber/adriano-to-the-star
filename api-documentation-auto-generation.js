/**
 * API Documentation Auto Generation
 * Automatically generate API documentation
 */

class APIDocumentationAutoGeneration {
    constructor() {
        this.endpoints = new Map();
        this.schemas = new Map();
        this.documentation = null;
        this.init();
    }

    init() {
        this.trackEvent('auto_gen_initialized');
    }

    registerEndpoint(endpointId, method, path, description, parameters, responses) {
        this.endpoints.set(endpointId, {
            id: endpointId,
            method,
            path,
            description,
            parameters: parameters || [],
            responses: responses || [],
            createdAt: new Date()
        });
        this.trackEvent('endpoint_registered', { endpointId });
    }

    registerSchema(schemaId, schema) {
        this.schemas.set(schemaId, {
            id: schemaId,
            schema,
            createdAt: new Date()
        });
        console.log(`Schema registered: ${schemaId}`);
    }

    generateDocumentation(format = 'openapi') {
        const endpoints = Array.from(this.endpoints.values());
        const schemas = Array.from(this.schemas.values());
        
        switch (format) {
            case 'openapi':
                return this.generateOpenAPISpec(endpoints, schemas);
            case 'markdown':
                return this.generateMarkdown(endpoints, schemas);
            case 'html':
                return this.generateHTML(endpoints, schemas);
            default:
                return this.generateOpenAPISpec(endpoints, schemas);
        }
    }

    generateOpenAPISpec(endpoints, schemas) {
        const spec = {
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
                description: 'Auto-generated API documentation'
            },
            paths: {},
            components: {
                schemas: {}
            }
        };
        
        endpoints.forEach(endpoint => {
            if (!spec.paths[endpoint.path]) {
                spec.paths[endpoint.path] = {};
            }
            
            spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
                summary: endpoint.description,
                parameters: endpoint.parameters,
                responses: this.formatResponses(endpoint.responses)
            };
        });
        
        schemas.forEach(schema => {
            spec.components.schemas[schema.id] = schema.schema;
        });
        
        this.documentation = spec;
        return spec;
    }

    formatResponses(responses) {
        const formatted = {};
        responses.forEach(response => {
            formatted[response.statusCode || '200'] = {
                description: response.description || 'Success',
                content: response.content || {}
            };
        });
        return formatted;
    }

    generateMarkdown(endpoints, schemas) {
        let markdown = '# API Documentation\n\n';
        
        endpoints.forEach(endpoint => {
            markdown += `## ${endpoint.method} ${endpoint.path}\n\n`;
            markdown += `${endpoint.description}\n\n`;
            
            if (endpoint.parameters.length > 0) {
                markdown += '### Parameters\n\n';
                endpoint.parameters.forEach(param => {
                    markdown += `- **${param.name}** (${param.type}): ${param.description || ''}\n`;
                });
                markdown += '\n';
            }
        });
        
        return markdown;
    }

    generateHTML(endpoints, schemas) {
        let html = '<!DOCTYPE html><html><head><title>API Documentation</title></head><body>';
        html += '<h1>API Documentation</h1>';
        
        endpoints.forEach(endpoint => {
            html += `<div class="endpoint">`;
            html += `<h2>${endpoint.method} ${endpoint.path}</h2>`;
            html += `<p>${endpoint.description}</p>`;
            html += `</div>`;
        });
        
        html += '</body></html>';
        return html;
    }

    getDocumentation() {
        return this.documentation;
    }

    getEndpoint(endpointId) {
        return this.endpoints.get(endpointId);
    }

    getAllEndpoints() {
        return Array.from(this.endpoints.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`doc_auto_gen_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_documentation_auto_generation', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiDocumentationAutoGeneration = new APIDocumentationAutoGeneration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIDocumentationAutoGeneration;
}

