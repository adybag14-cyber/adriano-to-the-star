/**
 * RESTful API Documentation (OpenAPI)
 * Generates and manages OpenAPI/Swagger documentation
 */

class RESTfulAPIDocumentation {
    constructor() {
        this.openAPISpec = {
            openapi: '3.0.0',
            info: {
                title: 'Adriano To The Star API',
                version: '1.0.0',
                description: 'API documentation for Adriano To The Star platform',
                contact: {
                    name: 'API Support',
                    email: 'support@adrianotothestar.com'
                }
            },
            servers: [
                {
                    url: 'https://api.adrianotothestar.com/v1',
                    description: 'Production server'
                },
                {
                    url: 'https://staging-api.adrianotothestar.com/v1',
                    description: 'Staging server'
                }
            ],
            paths: {},
            components: {
                schemas: {},
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        };
        this.init();
    }

    init() {
        this.trackEvent('r_es_tf_ul_ap_id_oc_um_en_ta_ti_on_initialized');
        this.setupDefaultPaths();
        this.setupDefaultSchemas();
        this.generateDocumentation();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_es_tf_ul_ap_id_oc_um_en_ta_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultPaths() {
        // Planets endpoints
        this.openAPISpec.paths['/planets'] = {
            get: {
                summary: 'List all planets',
                tags: ['Planets'],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Planet' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Create a new planet',
                tags: ['Planets'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PlanetInput' }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Planet created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Planet' }
                            }
                        }
                    }
                }
            }
        };

        this.openAPISpec.paths['/planets/{id}'] = {
            get: {
                summary: 'Get planet by ID',
                tags: ['Planets'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Planet' }
                            }
                        }
                    }
                }
            },
            put: {
                summary: 'Update planet',
                tags: ['Planets'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PlanetInput' }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Planet updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Planet' }
                            }
                        }
                    }
                }
            },
            delete: {
                summary: 'Delete planet',
                tags: ['Planets'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '204': {
                        description: 'Planet deleted'
                    }
                }
            }
        };
    }

    setupDefaultSchemas() {
        this.openAPISpec.components.schemas.Planet = {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string' },
                distance: { type: 'number', format: 'float' },
                discovered: { type: 'string', format: 'date' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'name']
        };

        this.openAPISpec.components.schemas.PlanetInput = {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                distance: { type: 'number', format: 'float' }
            },
            required: ['name']
        };

        this.openAPISpec.components.schemas.Error = {
            type: 'object',
            properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                details: { type: 'string' }
            }
        };
    }

    addPath(path, method, definition) {
        if (!this.openAPISpec.paths[path]) {
            this.openAPISpec.paths[path] = {};
        }
        this.openAPISpec.paths[path][method.toLowerCase()] = definition;
    }

    addSchema(name, schema) {
        this.openAPISpec.components.schemas[name] = schema;
    }

    generateDocumentation() {
        // Generate interactive documentation
        this.renderSwaggerUI();
    }

    renderSwaggerUI() {
        // Check if Swagger UI container exists
        const container = document.querySelector('[data-swagger-ui]');
        if (!container) return;

        // Load Swagger UI library if not already loaded
        if (!window.SwaggerUIBundle) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js';
            script.onload = () => this.initSwaggerUI(container);
            document.head.appendChild(script);

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css';
            document.head.appendChild(link);
        } else {
            this.initSwaggerUI(container);
        }
    }

    initSwaggerUI(container) {
        window.SwaggerUIBundle({
            url: this.getSpecURL(),
            dom_id: container.id || 'swagger-ui',
            presets: [
                window.SwaggerUIBundle.presets.apis,
                window.SwaggerUIBundle.presets.standalone
            ],
            layout: 'BaseLayout',
            deepLinking: true,
            showExtensions: true,
            showCommonExtensions: true
        });
    }

    getSpecURL() {
        // Return URL to OpenAPI spec JSON
        return '/api/openapi.json';
    }

    exportSpec(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.openAPISpec, null, 2);
        } else if (format === 'yaml') {
            // Convert to YAML (would need a YAML library)
            return this.convertToYAML(this.openAPISpec);
        }
    }

    convertToYAML(obj) {
        // Basic YAML conversion (would use a proper library in production)
        return JSON.stringify(obj, null, 2);
    }

    validateRequest(path, method, request) {
        // Validate request against OpenAPI spec
        const endpoint = this.openAPISpec.paths[path]?.[method.toLowerCase()];
        if (!endpoint) {
            return { valid: false, error: 'Endpoint not found' };
        }

        // Validate request body
        if (endpoint.requestBody) {
            const schema = endpoint.requestBody.content['application/json']?.schema;
            if (schema) {
                return this.validateSchema(request, schema);
            }
        }

        return { valid: true };
    }

    validateSchema(data, schema) {
        // Basic schema validation
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in data)) {
                    return { valid: false, error: `Missing required field: ${field}` };
                }
            }
        }
        return { valid: true };
    }
}

// Auto-initialize
const apiDocumentation = new RESTfulAPIDocumentation();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RESTfulAPIDocumentation;
}

