/**
 * Dashboard Sharing
 * Shares dashboards with users
 */

class DashboardSharing {
    constructor() {
        this.shares = [];
        this.init();
    }

    init() {
        this.trackEvent('dashboard_sharing_initialized');
    }

    shareDashboard(dashboardId, userId, permissions = ['view']) {
        const share = {
            id: `share_${Date.now()}`,
            dashboardId,
            userId,
            permissions,
            sharedAt: new Date(),
            expiresAt: null
        };
        
        this.shares.push(share);
        return share;
    }

    sharePublicly(dashboardId, link) {
        const share = {
            id: `share_${Date.now()}`,
            dashboardId,
            public: true,
            link,
            sharedAt: new Date()
        };
        
        this.shares.push(share);
        return share;
    }

    revokeShare(shareId) {
        const index = this.shares.findIndex(s => s.id === shareId);
        if (index !== -1) {
            this.shares.splice(index, 1);
            return true;
        }
        return false;
    }

    getSharedDashboards(userId) {
        return this.shares.filter(s => 
            s.userId === userId || s.public === true
        );
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_sharing_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dashboardSharing = new DashboardSharing();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardSharing;
}


