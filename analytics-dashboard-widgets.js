/**
 * Custom Dashboard Widgets for Analytics
 * Additional analytics widgets for the dashboard
 */

class AnalyticsDashboardWidgets {
    constructor() {
        this.widgets = [];
        this.currentUser = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
            }
        }

        this.initializeWidgets();

        this.isInitialized = true;
        this.trackEvent('dashboard_widgets_initialized');
    }

    initializeWidgets() {
        this.widgets = [
            {
                id: 'user-activity',
                name: 'User Activity',
                type: 'chart',
                data: []
            },
            {
                id: 'planet-claims-trend',
                name: 'Planet Claims Trend',
                type: 'line-chart',
                data: []
            },
            {
                id: 'popular-planets',
                name: 'Popular Planets',
                type: 'list',
                data: []
            },
            {
                id: 'discovery-timeline',
                name: 'Discovery Timeline',
                type: 'timeline',
                data: []
            }
        ];
    }

    /**
     * Get widget data
     */
    async getWidgetData(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return null;

        switch (widgetId) {
            case 'user-activity':
                return await this.getUserActivityData();
            case 'planet-claims-trend':
                return await this.getClaimsTrendData();
            case 'popular-planets':
                return await this.getPopularPlanetsData();
            case 'discovery-timeline':
                return await this.getDiscoveryTimelineData();
            default:
                return null;
        }
    }

    async getUserActivityData() {
        // Get user activity data
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            values: [10, 15, 8, 12, 20, 18, 14]
        };
    }

    async getClaimsTrendData() {
        // Get claims trend data
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            values: [50, 75, 60, 90, 110, 95]
        };
    }

    async getPopularPlanetsData() {
        // Get popular planets
        return [
            { name: 'Kepler-452b', views: 1250 },
            { name: 'Kepler-186f', views: 980 },
            { name: 'Kepler-442b', views: 850 }
        ];
    }

    async getDiscoveryTimelineData() {
        // Get discovery timeline
        return [
            { date: '2024-01-15', count: 5 },
            { date: '2024-02-20', count: 8 },
            { date: '2024-03-10', count: 12 }
        ];
    }

    /**
     * Render widget
     */
    renderWidget(widgetId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        this.getWidgetData(widgetId).then(data => {
            container.innerHTML = this.generateWidgetHTML(widget, data);
        });
    }

    generateWidgetHTML(widget, data) {
        switch (widget.type) {
            case 'chart':
                return `<div class="widget-chart">Chart: ${widget.name}</div>`;
            case 'line-chart':
                return `<div class="widget-line-chart">Line Chart: ${widget.name}</div>`;
            case 'list':
                return `<div class="widget-list">List: ${widget.name}</div>`;
            case 'timeline':
                return `<div class="widget-timeline">Timeline: ${widget.name}</div>`;
            default:
                return `<div class="widget-default">${widget.name}</div>`;
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_widgets_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'analytics_dashboard_widgets', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.analyticsDashboardWidgets) {
            window.analyticsDashboardWidgets = new AnalyticsDashboardWidgets();
        }
    });
}


