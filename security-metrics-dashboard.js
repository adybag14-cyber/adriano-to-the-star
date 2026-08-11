/**
 * Security Metrics Dashboard
 * Security metrics collection and visualization
 */

class SecurityMetricsDashboard {
    constructor() {
        this.metrics = new Map();
        this.dashboards = new Map();
        this.widgets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_ym_et_ri_cs_da_sh_bo_ar_d_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_ym_et_ri_cs_da_sh_bo_ar_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    recordMetric(metricId, metricData) {
        const metric = {
            id: metricId,
            ...metricData,
            name: metricData.name || metricId,
            value: metricData.value || 0,
            category: metricData.category || 'general',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metrics.set(metricId, metric);
        return metric;
    }

    createDashboard(dashboardId, dashboardData) {
        const dashboard = {
            id: dashboardId,
            ...dashboardData,
            name: dashboardData.name || dashboardId,
            widgets: dashboardData.widgets || [],
            createdAt: new Date()
        };
        
        this.dashboards.set(dashboardId, dashboard);
        console.log(`Dashboard created: ${dashboardId}`);
        return dashboard;
    }

    addWidget(dashboardId, widgetData) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error('Dashboard not found');
        }
        
        const widget = {
            id: `widget_${Date.now()}`,
            ...widgetData,
            type: widgetData.type || 'metric',
            metricId: widgetData.metricId || null,
            createdAt: new Date()
        };
        
        dashboard.widgets.push(widget);
        this.widgets.set(widget.id, widget);
        
        return widget;
    }

    getMetrics(category = null, startDate = null, endDate = null) {
        let metrics = Array.from(this.metrics.values());
        
        if (category) {
            metrics = metrics.filter(m => m.category === category);
        }
        
        if (startDate) {
            metrics = metrics.filter(m => m.timestamp >= startDate);
        }
        
        if (endDate) {
            metrics = metrics.filter(m => m.timestamp <= endDate);
        }
        
        return metrics;
    }

    calculateTrend(metricName, period = '7d') {
        const now = Date.now();
        const periodMs = this.getPeriodMs(period);
        const startDate = new Date(now - periodMs);
        
        const metrics = this.getMetrics(null, startDate, new Date())
            .filter(m => m.name === metricName)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        if (metrics.length < 2) {
            return { trend: 'insufficient_data', change: 0 };
        }
        
        const first = metrics[0].value;
        const last = metrics[metrics.length - 1].value;
        const change = last - first;
        const percentChange = first > 0 ? (change / first) * 100 : 0;
        
        let trend = 'stable';
        if (percentChange > 10) {
            trend = 'increasing';
        } else if (percentChange < -10) {
            trend = 'decreasing';
        }
        
        return { trend, change, percentChange };
    }

    getPeriodMs(period) {
        const periods = {
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        return periods[period] || periods['7d'];
    }

    getDashboard(dashboardId) {
        return this.dashboards.get(dashboardId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityMetricsDashboard = new SecurityMetricsDashboard();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityMetricsDashboard;
}


