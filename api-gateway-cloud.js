/**
 * API Gateway (Cloud)
 * Cloud API gateway management
 */

class APIGatewayCloud {
    constructor() {
        this.gateways = new Map();
        this.apis = new Map();
        this.routes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('gateway_cloud_initialized');
    }

    createGateway(gatewayId, gatewayData) {
        const gateway = {
            id: gatewayId,
            ...gatewayData,
            name: gatewayData.name || gatewayId,
            provider: gatewayData.provider || 'aws',
            region: gatewayData.region || 'us-east-1',
            apis: [],
            createdAt: new Date()
        };
        
        this.gateways.set(gatewayId, gateway);
        this.trackEvent('gateway_created', { gatewayId });
        return gateway;
    }

    createAPI(gatewayId, apiId, apiData) {
        const gateway = this.gateways.get(gatewayId);
        if (!gateway) {
            throw new Error('Gateway not found');
        }
        
        const api = {
            id: apiId,
            gatewayId,
            ...apiData,
            name: apiData.name || apiId,
            version: apiData.version || 'v1',
            routes: [],
            createdAt: new Date()
        };
        
        this.apis.set(apiId, api);
        gateway.apis.push(apiId);
        
        return api;
    }

    createRoute(gatewayId, apiId, routeId, routeData) {
        const gateway = this.gateways.get(gatewayId);
        const api = this.apis.get(apiId);
        
        if (!gateway || !api) {
            throw new Error('Gateway or API not found');
        }
        
        const route = {
            id: routeId,
            gatewayId,
            apiId,
            ...routeData,
            path: routeData.path || '/',
            method: routeData.method || 'GET',
            target: routeData.target || '',
            createdAt: new Date()
        };
        
        this.routes.set(routeId, route);
        api.routes.push(routeId);
        
        return route;
    }

    getGateway(gatewayId) {
        return this.gateways.get(gatewayId);
    }

    getAPI(apiId) {
        return this.apis.get(apiId);
    }

    getRoute(routeId) {
        return this.routes.get(routeId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`gateway_cloud_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_gateway_cloud', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiGatewayCloud = new APIGatewayCloud();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIGatewayCloud;
}

