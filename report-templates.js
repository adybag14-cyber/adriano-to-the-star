/**
 * Report Templates
 * Templates for analytics reports
 */

class ReportTemplates {
    constructor() {
        this.templates = new Map();
        this.init();
    }
    
    init() {
        this.loadTemplates();
    }
    
    loadTemplates() {
        // Load report templates
        this.templates.set('standard', {
            name: 'Standard Report',
            metrics: ['pageViews', 'users', 'sessions'],
            format: 'json'
        });
        
        this.templates.set('executive', {
            name: 'Executive Summary',
            metrics: ['revenue', 'conversions', 'growth'],
            format: 'pdf'
        });
    }
    
    async createFromTemplate(templateId, config) {
        // Create report from template
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }
        
        if (window.customAnalyticsReports) {
            return await window.customAnalyticsReports.createReport({
                name: config.name || template.name,
                metrics: config.metrics || template.metrics,
                format: config.format || template.format,
                filters: config.filters || {}
            });
        }
        
        return null;
    }
    
    async saveTemplate(template) {
        // Save custom template
        this.templates.set(template.id, template);
        return template;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.reportTemplates = new ReportTemplates(); });
} else {
    window.reportTemplates = new ReportTemplates();
}

