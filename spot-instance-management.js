/**
 * Spot Instance Management
 * Spot instance management system
 */

class SpotInstanceManagement {
    constructor() {
        this.instances = new Map();
        this.bids = new Map();
        this.interruptions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_po_ti_ns_ta_nc_em_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_po_ti_ns_ta_nc_em_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async requestSpot(requestId, requestData) {
        const request = {
            id: requestId,
            ...requestData,
            instanceType: requestData.instanceType || '',
            bidPrice: requestData.bidPrice || 0,
            status: 'requesting',
            createdAt: new Date()
        };

        await this.processRequest(request);
        this.instances.set(requestId, request);
        return request;
    }

    async processRequest(request) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        request.status = 'fulfilled';
        request.instanceId = `i-${Date.now()}`;
        request.fulfilledAt = new Date();
    }

    async handleInterruption(instanceId, reason) {
        const interruption = {
            id: `int_${Date.now()}`,
            instanceId,
            reason: reason || 'price_change',
            status: 'interrupted',
            createdAt: new Date()
        };

        this.interruptions.set(interruption.id, interruption);
        return interruption;
    }

    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }

    getAllInstances() {
        return Array.from(this.instances.values());
    }
}

module.exports = SpotInstanceManagement;

