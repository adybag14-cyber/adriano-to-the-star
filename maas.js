/**
 * MaaS
 * Monitoring as a Service
 */

class MaaS {
    constructor() {
        this.monitors = new Map();
        this.metrics = new Map();
        this.dashboards = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_aa_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_aa_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            type: monitorData.type || 'http',
            target: monitorData.target || '',
            interval: monitorData.interval || 60,
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Monitor created: ${monitorId}`);
        return monitor;
    }

    recordMetric(monitorId, metricData) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }
        
        const metric = {
            id: `metric_${Date.now()}`,
            monitorId,
            ...metricData,
            name: metricData.name || 'unknown',
            value: metricData.value || 0,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metrics.set(metric.id, metric);
        
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

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }

    getDashboard(dashboardId) {
        return this.dashboards.get(dashboardId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.maas = new MaaS();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaaS;
}

