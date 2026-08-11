/**
 * API Health Checks
 * Health check endpoints and monitoring
 */

class APIHealthChecks {
    constructor() {
        this.healthChecks = new Map();
        this.healthStatus = new Map();
        this.init();
    }

    init() {
        this.trackEvent('health_checks_initialized');
    }

    registerHealthCheck(checkId, name, checkFn, interval = 30000) {
        this.healthChecks.set(checkId, {
            id: checkId,
            name,
            checkFn,
            interval,
            enabled: true,
            createdAt: new Date()
        });
        
        // Start periodic health check
        this.startHealthCheck(checkId);
        this.trackEvent('health_check_registered', { checkId });
    }

    async startHealthCheck(checkId) {
        const check = this.healthChecks.get(checkId);
        if (!check || !check.enabled) {
            return;
        }
        
        try {
            const result = await check.checkFn();
            this.healthStatus.set(checkId, {
                id: checkId,
                name: check.name,
                status: result.healthy ? 'healthy' : 'unhealthy',
                details: result.details || {},
                lastCheck: new Date(),
                consecutiveFailures: result.healthy ? 0 : (this.healthStatus.get(checkId)?.consecutiveFailures || 0) + 1
            });
        } catch (error) {
            this.healthStatus.set(checkId, {
                id: checkId,
                name: check.name,
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date(),
                consecutiveFailures: (this.healthStatus.get(checkId)?.consecutiveFailures || 0) + 1
            });
        }
        
        // Schedule next check
        setTimeout(() => {
            this.startHealthCheck(checkId);
        }, check.interval);
    }

    async runHealthCheck(checkId) {
        const check = this.healthChecks.get(checkId);
        if (!check) {
            throw new Error('Health check does not exist');
        }
        
        try {
            const result = await check.checkFn();
            this.healthStatus.set(checkId, {
                id: checkId,
                name: check.name,
                status: result.healthy ? 'healthy' : 'unhealthy',
                details: result.details || {},
                lastCheck: new Date()
            });
            
            return this.healthStatus.get(checkId);
        } catch (error) {
            this.healthStatus.set(checkId, {
                id: checkId,
                name: check.name,
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date()
            });
            
            return this.healthStatus.get(checkId);
        }
    }

    getHealthStatus(checkId = null) {
        if (checkId) {
            return this.healthStatus.get(checkId);
        }
        
        const allStatus = Array.from(this.healthStatus.values());
        const healthy = allStatus.filter(s => s.status === 'healthy').length;
        const unhealthy = allStatus.filter(s => s.status === 'unhealthy').length;
        
        return {
            overall: unhealthy === 0 ? 'healthy' : 'unhealthy',
            total: allStatus.length,
            healthy,
            unhealthy,
            checks: allStatus
        };
    }

    getHealthCheck(checkId) {
        return this.healthChecks.get(checkId);
    }

    getAllHealthChecks() {
        return Array.from(this.healthChecks.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`health_checks_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_health_checks', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiHealthChecks = new APIHealthChecks();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIHealthChecks;
}

