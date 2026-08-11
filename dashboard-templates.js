/**
 * Dashboard Templates
 * Provides dashboard templates
 */

class DashboardTemplates {
    constructor() {
        this.templates = new Map();
        this.init();
    }

    init() {
        this.loadDefaultTemplates();
        this.trackEvent('dashboard_templates_initialized');
    }

    loadDefaultTemplates() {
        this.templates.set('analytics', {
            name: 'Analytics Dashboard',
            widgets: [
                { type: 'chart', title: 'Traffic Overview' },
                { type: 'metric', title: 'Total Users' },
                { type: 'table', title: 'Top Pages' }
            ]
        });
        
        this.templates.set('sales', {
            name: 'Sales Dashboard',
            widgets: [
                { type: 'metric', title: 'Revenue' },
                { type: 'chart', title: 'Sales Trend' },
                { type: 'table', title: 'Top Products' }
            ]
        });
    }

    getTemplate(name) {
        return this.templates.get(name);
    }

    createTemplate(name, template) {
        this.templates.set(name, {
            ...template,
            createdAt: new Date()
        });
    }

    getAllTemplates() {
        return Array.from(this.templates.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_templates_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dashboardTemplates = new DashboardTemplates();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardTemplates;
}


