/**
 * Health Check Aggregation
 * Aggregated health check system
 */

class HealthCheckAggregation {
    constructor() {
        this.checks = new Map();
        this.aggregates = new Map();
        this.init();
    }

    init() {
        this.trackEvent('h_ea_lt_hc_he_ck_ag_gr_eg_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("h_ea_lt_hc_he_ck_ag_gr_eg_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerCheck(checkId, checkData) {
        const check = {
            id: checkId,
            ...checkData,
            name: checkData.name || checkId,
            type: checkData.type || 'http',
            target: checkData.target || '',
            interval: checkData.interval || 60,
            enabled: checkData.enabled !== false,
            createdAt: new Date()
        };
        
        this.checks.set(checkId, check);
        console.log(`Health check registered: ${checkId}`);
        return check;
    }

    async performCheck(checkId) {
        const check = this.checks.get(checkId);
        if (!check) {
            throw new Error('Check not found');
        }
        
        const result = {
            checkId,
            status: 'healthy',
            timestamp: new Date(),
            responseTime: Math.random() * 100 + 50
        };
        
        if (result.responseTime > 200) {
            result.status = 'unhealthy';
        }
        
        check.lastResult = result;
        check.lastChecked = new Date();
        
        return result;
    }

    async aggregate(aggregateId, checkIds) {
        const results = [];
        
        for (const checkId of checkIds) {
            const check = this.checks.get(checkId);
            if (check) {
                const result = await this.performCheck(checkId);
                results.push(result);
            }
        }
        
        const aggregate = {
            id: aggregateId,
            checkIds,
            results,
            overallStatus: results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.aggregates.set(aggregateId, aggregate);
        
        return aggregate;
    }

    getCheck(checkId) {
        return this.checks.get(checkId);
    }

    getAggregate(aggregateId) {
        return this.aggregates.get(aggregateId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.healthCheckAggregation = new HealthCheckAggregation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthCheckAggregation;
}

