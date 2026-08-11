/**
 * Custom Dashboard Builder
 * Allows users to build custom dashboards
 */

class CustomDashboardBuilder {
    constructor() {
        this.dashboards = [];
        this.widgets = [];
        this.init();
    }

    init() {
        this.trackEvent('custom_dash_builder_initialized');
    }

    createDashboard(name, layout) {
        const dashboard = {
            id: `dashboard_${Date.now()}`,
            name,
            layout: layout || { rows: 1, cols: 1 },
            widgets: [],
            createdAt: new Date()
        };
        
        this.dashboards.push(dashboard);
        return dashboard;
    }

    addWidget(dashboardId, widget) {
        const dashboard = this.dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return null;
        
        dashboard.widgets.push({
            ...widget,
            id: `widget_${Date.now()}`,
            position: widget.position || { row: 0, col: 0 }
        });
        
        return dashboard;
    }

    updateLayout(dashboardId, layout) {
        const dashboard = this.dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return null;
        
        dashboard.layout = layout;
        return dashboard;
    }

    getDashboard(dashboardId) {
        return this.dashboards.find(d => d.id === dashboardId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`custom_dash_builder_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const customDashboardBuilder = new CustomDashboardBuilder();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomDashboardBuilder;
}


