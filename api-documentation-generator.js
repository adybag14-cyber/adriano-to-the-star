/**
 * API Documentation Generator
 * @class APIDocumentationGenerator
 * @description Automatically generates API documentation from code.
 */
class APIDocumentationGenerator {
    constructor() {
        this.docs = new Map();
        this.templates = new Map();
        this.init();
    }

    init() {
        this.setupTemplates();
        this.trackEvent('doc_generator_initialized');
    }

    setupTemplates() {
        this.templates.set('openapi', {
            name: 'OpenAPI/Swagger',
            format: 'yaml'
        });

        this.templates.set('markdown', {
            name: 'Markdown',
            format: 'md'
        });
    }

    /**
     * Generate documentation.
     * @param {string} docId - Documentation identifier.
     * @param {object} apiData - API data.
     * @param {string} templateId - Template identifier.
     * @returns {string} Generated documentation.
     */
    generateDocumentation(docId, apiData, templateId = 'openapi') {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        let documentation = '';

        if (templateId === 'openapi') {
            documentation = this.generateOpenAPI(apiData);
        } else if (templateId === 'markdown') {
            documentation = this.generateMarkdown(apiData);
        }

        this.docs.set(docId, {
            id: docId,
            content: documentation,
            template: templateId,
            generatedAt: new Date()
        });

        this.trackEvent('documentation_generated', { docId, templateId });
        return documentation;
    }

    /**
     * Generate OpenAPI spec.
     * @param {object} apiData - API data.
     * @returns {string} OpenAPI YAML.
     */
    generateOpenAPI(apiData) {
        return `openapi: 3.0.0
info:
  title: ${apiData.title || 'API'}
  version: ${apiData.version || '1.0.0'}
paths:
  ${apiData.paths || {}}
`;
    }

    /**
     * Generate Markdown.
     * @param {object} apiData - API data.
     * @returns {string} Markdown documentation.
     */
    generateMarkdown(apiData) {
        return `# ${apiData.title || 'API Documentation'}

## Overview
${apiData.description || ''}

## Endpoints
${apiData.endpoints?.map(e => `### ${e.method} ${e.path}\n${e.description || ''}`).join('\n\n') || ''}
`;
    }
}

APIDocumentationGenerator.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (typeof window !== 'undefined' && window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`doc_generator_${eventName}`, 1, data);
        }
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.track(eventName, { module: 'api_documentation_generator', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiDocumentationGenerator = new APIDocumentationGenerator();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIDocumentationGenerator;
}
