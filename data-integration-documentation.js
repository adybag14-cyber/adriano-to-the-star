/**
 * Data Integration Documentation
 * @class DataIntegrationDocumentation
 * @description Generates and manages documentation for data integration workflows and APIs.
 */
class DataIntegrationDocumentation {
    constructor() {
        this.documentation = new Map();
        this.templates = new Map();
        this.init();
    }

    init() {
        this.setupDefaultTemplates();
        this.trackEvent('data_integ_docs_initialized');
    }

    setupDefaultTemplates() {
        // API documentation template
        this.templates.set('api', {
            format: 'markdown',
            sections: ['overview', 'endpoints', 'authentication', 'examples']
        });

        // Integration workflow template
        this.templates.set('workflow', {
            format: 'markdown',
            sections: ['overview', 'steps', 'configuration', 'troubleshooting']
        });
    }

    /**
     * Generate documentation for an integration.
     * @param {string} integrationId - Integration identifier.
     * @param {object} data - Integration data.
     * @param {string} templateType - Template type to use.
     * @returns {string} Generated documentation.
     */
    generateDocumentation(integrationId, data, templateType = 'api') {
        const template = this.templates.get(templateType);
        if (!template) {
            throw new Error(`Template not found: ${templateType}`);
        }

        let doc = `# ${data.name || integrationId}\n\n`;
        doc += `## Overview\n\n${data.description || 'No description provided.'}\n\n`;

        if (template.sections.includes('endpoints') && data.endpoints) {
            doc += `## Endpoints\n\n`;
            for (const endpoint of data.endpoints) {
                doc += `### ${endpoint.method} ${endpoint.path}\n\n`;
                doc += `${endpoint.description || ''}\n\n`;
            }
        }

        this.documentation.set(integrationId, {
            content: doc,
            template: templateType,
            generatedAt: new Date()
        });

        return doc;
    }

    /**
     * Get documentation for an integration.
     * @param {string} integrationId - Integration identifier.
     * @returns {string} Documentation content.
     */
    getDocumentation(integrationId) {
        const doc = this.documentation.get(integrationId);
        return doc ? doc.content : null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_integ_docs_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataIntegrationDocumentation = new DataIntegrationDocumentation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataIntegrationDocumentation;
}
