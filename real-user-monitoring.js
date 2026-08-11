/**
 * Real User Monitoring
 * Real user monitoring system
 */

class RealUserMonitoring {
    constructor() {
        this.monitors = new Map();
        this.sessions = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ea_lu_se_rm_on_it_or_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ea_lu_se_rm_on_it_or_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            name: monitorData.name || monitorId,
            status: 'active',
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        return monitor;
    }

    async trackSession(sessionId, sessionData) {
        const session = {
            id: sessionId,
            ...sessionData,
            userId: sessionData.userId || '',
            startTime: new Date(),
            metrics: {},
            status: 'active'
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    async recordMetric(sessionId, metricName, value) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.metrics[metricName] = value;
        return session;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    getAllSessions() {
        return Array.from(this.sessions.values());
    }
}

module.exports = RealUserMonitoring;
