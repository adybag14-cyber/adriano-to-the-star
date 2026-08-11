/**
 * Dashboard Versioning
 * Manages dashboard versions
 */

class DashboardVersioning {
    constructor() {
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_as_hb_oa_rd_ve_rs_io_ni_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_as_hb_oa_rd_ve_rs_io_ni_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createVersion(dashboardId, dashboard) {
        const version = {
            id: `v${Date.now()}`,
            dashboardId,
            dashboard: JSON.parse(JSON.stringify(dashboard)),
            version: this.getNextVersion(dashboardId),
            createdAt: new Date(),
            createdBy: 'system'
        };

        if (!this.versions.has(dashboardId)) {
            this.versions.set(dashboardId, []);
        }
        
        this.versions.get(dashboardId).push(version);
        return version;
    }

    getNextVersion(dashboardId) {
        const versions = this.versions.get(dashboardId) || [];
        return versions.length + 1;
    }

    getVersion(dashboardId, version) {
        const versions = this.versions.get(dashboardId) || [];
        return versions.find(v => v.version === version);
    }

    getAllVersions(dashboardId) {
        return this.versions.get(dashboardId) || [];
    }

    restoreVersion(dashboardId, version) {
        const versionData = this.getVersion(dashboardId, version);
        if (!versionData) return null;
        
        return versionData.dashboard;
    }
}

// Auto-initialize
const dashboardVersioning = new DashboardVersioning();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardVersioning;
}


