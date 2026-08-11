/**
 * Resource Quotas
 * Resource quota management system
 */

class ResourceQuotas {
    constructor() {
        this.quotas = new Map();
        this.limits = new Map();
        this.usage = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_es_ou_rc_eq_uo_ta_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_es_ou_rc_eq_uo_ta_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createQuota(quotaId, quotaData) {
        const quota = {
            id: quotaId,
            ...quotaData,
            name: quotaData.name || quotaId,
            limits: quotaData.limits || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.quotas.set(quotaId, quota);
        return quota;
    }

    async check(quotaId, resource, amount) {
        const quota = this.quotas.get(quotaId);
        if (!quota) {
            throw new Error(`Quota ${quotaId} not found`);
        }

        const currentUsage = this.usage.get(`${quotaId}_${resource}`) || 0;
        const limit = quota.limits[resource] || Infinity;

        return {
            quotaId,
            resource,
            currentUsage,
            limit,
            available: limit - currentUsage,
            allowed: (currentUsage + amount) <= limit
        };
    }

    getQuota(quotaId) {
        return this.quotas.get(quotaId);
    }

    getAllQuotas() {
        return Array.from(this.quotas.values());
    }
}

module.exports = ResourceQuotas;

