/**
 * Content Templates
 * Templates for course content
 */

class ContentTemplates {
    constructor() {
        this.templates = new Map();
        this.init();
    }
    
    init() {
        this.loadTemplates();
        this.trackEvent('content_tpl_initialized');
    }
    
    loadTemplates() {
        this.templates.set('lesson', { type: 'lesson', structure: [] });
        this.templates.set('quiz', { type: 'quiz', structure: [] });
    }
    
    async createFromTemplate(templateId, data) {
        const template = this.templates.get(templateId);
        return { ...template, ...data };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_tpl_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.contentTemplates = new ContentTemplates(); });
} else {
    window.contentTemplates = new ContentTemplates();
}

