/**
 * Dashboard Analytics
 * Analytics for dashboard usage
 */

class DashboardAnalytics {
    constructor() {
        this.analytics = [];
        this.init();
    }

    init() {
        this.trackEvent('dashboard_analytics_initialized');
    }

    trackView(dashboardId, userId) {
        this.analytics.push({
            dashboardId,
            userId,
            action: 'view',
            timestamp: new Date()
        });
    }

    trackInteraction(dashboardId, userId, interaction) {
        this.analytics.push({
            dashboardId,
            userId,
            action: 'interaction',
            interaction,
            timestamp: new Date()
        });
    }

    getDashboardStats(dashboardId) {
        const views = this.analytics.filter(a => 
            a.dashboardId === dashboardId && a.action === 'view'
        );
        const interactions = this.analytics.filter(a => 
            a.dashboardId === dashboardId && a.action === 'interaction'
        );
        const uniqueUsers = new Set(views.map(v => v.userId)).size;

        return {
            totalViews: views.length,
            totalInteractions: interactions.length,
            uniqueUsers,
            averageViewsPerUser: uniqueUsers > 0 ? views.length / uniqueUsers : 0
        };
    }

    getPopularDashboards(limit = 10) {
        const dashboardCounts = {};
        
        this.analytics.forEach(a => {
            if (a.action === 'view') {
                dashboardCounts[a.dashboardId] = (dashboardCounts[a.dashboardId] || 0) + 1;
            }
        });

        return Object.entries(dashboardCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([dashboardId, count]) => ({ dashboardId, views: count }));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_analytics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dashboardAnalytics = new DashboardAnalytics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardAnalytics;
}


