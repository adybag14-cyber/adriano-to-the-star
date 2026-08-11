/**
 * Advanced Analytics Dashboard
 * @class AdvancedAnalyticsDashboard
 * @description Provides comprehensive analytics dashboard with real-time data visualization.
 */
class AdvancedAnalyticsDashboard {
    constructor() {
        this.dashboards = new Map();
        this.widgets = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('analytics_dashboard_initialized');
    }

    /**
     * Create dashboard.
     * @param {string} dashboardId - Dashboard identifier.
     * @param {object} dashboardData - Dashboard data.
     */
    createDashboard(dashboardId, dashboardData) {
        this.dashboards.set(dashboardId, {
            ...dashboardData,
            id: dashboardId,
            name: dashboardData.name,
            widgets: [],
            layout: dashboardData.layout || 'grid',
            createdAt: new Date()
        });
        this.trackEvent('dashboard_created', { dashboardId, name: dashboardData.name, layout: dashboardData.layout });
    }

    /**
     * Add widget to dashboard.
     * @param {string} dashboardId - Dashboard identifier.
     * @param {object} widgetData - Widget data.
     */
    addWidget(dashboardId, widgetData) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard not found: ${dashboardId}`);
        }

        const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.widgets.set(widgetId, {
            id: widgetId,
            dashboardId,
            ...widgetData,
            type: widgetData.type || 'chart',
            config: widgetData.config || {},
            createdAt: new Date()
        });

        dashboard.widgets.push(widgetId);
        this.trackEvent('widget_added', { dashboardId, widgetId, type: widgetData.type });
    }

    /**
     * Get dashboard data.
     * @param {string} dashboardId - Dashboard identifier.
     * @returns {object} Dashboard with widgets.
     */
    getDashboard(dashboardId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) return null;

        return {
            ...dashboard,
            widgets: dashboard.widgets.map(widgetId => this.widgets.get(widgetId)).filter(Boolean)
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`analytics_dashboard_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_analytics_dashboard', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.advancedAnalyticsDashboard = new AdvancedAnalyticsDashboard();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnalyticsDashboard;
}
