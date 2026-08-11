/**
 * CoAP Server
 * Constrained Application Protocol server
 */

class CoAPServer {
    constructor() {
        this.servers = new Map();
        this.resources = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('coap_initialized');
    }

    createServer(serverId, serverData) {
        const server = {
            id: serverId,
            ...serverData,
            name: serverData.name || serverId,
            host: serverData.host || 'localhost',
            port: serverData.port || 5683,
            resources: [],
            createdAt: new Date()
        };
        
        this.servers.set(serverId, server);
        console.log(`CoAP server created: ${serverId}`);
        return server;
    }

    registerResource(serverId, resourceId, resourceData) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error('Server not found');
        }
        
        const resource = {
            id: resourceId,
            serverId,
            ...resourceData,
            path: resourceData.path || `/${resourceId}`,
            methods: resourceData.methods || ['GET'],
            handler: resourceData.handler || null,
            createdAt: new Date()
        };
        
        this.resources.set(resourceId, resource);
        server.resources.push(resourceId);
        
        return resource;
    }

    async handleRequest(serverId, request) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error('Server not found');
        }
        
        const resource = Array.from(this.resources.values())
            .find(r => r.serverId === serverId && request.path === r.path);
        
        if (!resource) {
            throw new Error('Resource not found');
        }
        
        const requestRecord = {
            id: `request_${Date.now()}`,
            serverId,
            resourceId: resource.id,
            ...request,
            method: request.method || 'GET',
            path: request.path || '',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.requests.set(requestRecord.id, requestRecord);
        
        let response = { status: 200, payload: null };
        
        if (resource.handler) {
            response = await resource.handler(request);
        }
        
        requestRecord.response = response;
        requestRecord.completedAt = new Date();
        
        return { request: requestRecord, response };
    }

    getServer(serverId) {
        return this.servers.get(serverId);
    }

    getResource(resourceId) {
        return this.resources.get(resourceId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`coap_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.coapServer = new CoAPServer();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoAPServer;
}

