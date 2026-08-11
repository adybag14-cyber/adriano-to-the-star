/**
 * Observability Dashboard
 * Observability dashboard system
 */

class ObservabilityDashboard {
    constructor() {
        this.dashboards = new Map();
        this.widgets = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Observability Dashboard initialized' };
    }

    createDashboard(name, widgets) {
        if (!Array.isArray(widgets)) {
            throw new Error('Widgets must be an array');
        }
        const dashboard = {
            id: Date.now().toString(),
            name,
            widgets,
            createdAt: new Date()
        };
        this.dashboards.set(dashboard.id, dashboard);
        return dashboard;
    }

    addWidget(dashboardId, widget) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error('Dashboard not found');
        }
        const widgetObj = {
            id: Date.now().toString(),
            dashboardId,
            ...widget,
            addedAt: new Date()
        };
        this.widgets.set(widgetObj.id, widgetObj);
        dashboard.widgets.push(widgetObj.id);
        return widgetObj;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObservabilityDashboard;
}

