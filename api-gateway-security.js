/**
 * API Gateway Security
 * API gateway security system
 */

class APIGatewaySecurity {
    constructor() {
        this.gateways = new Map();
        this.policies = new Map();
        this.filters = new Map();
        this.init();
    }

    init() {
        this.trackEvent('gateway_security_initialized');
    }

    async secureGateway(gatewayId, gatewayData) {
        const gateway = {
            id: gatewayId,
            ...gatewayData,
            name: gatewayData.name || gatewayId,
            securityPolicies: gatewayData.securityPolicies || [],
            status: 'secured',
            createdAt: new Date()
        };
        
        this.gateways.set(gatewayId, gateway);
        return gateway;
    }

    async applyFilter(filterId, filterData) {
        const filter = {
            id: filterId,
            ...filterData,
            gatewayId: filterData.gatewayId || '',
            type: filterData.type || 'authentication',
            status: 'active',
            createdAt: new Date()
        };

        this.filters.set(filterId, filter);
        return filter;
    }

    getGateway(gatewayId) {
        return this.gateways.get(gatewayId);
    }

    getAllGateways() {
        return Array.from(this.gateways.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`gateway_sec_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = APIGatewaySecurity;

