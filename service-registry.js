/**
 * Service Registry
 * Service registration and discovery
 */

class ServiceRegistry {
    constructor() {
        this.registry = new Map();
        this.services = new Map();
        this.instances = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_er_vi_ce_re_gi_st_ry_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_er_vi_ce_re_gi_st_ry_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerService(serviceId, serviceData) {
        const service = {
            id: serviceId,
            ...serviceData,
            name: serviceData.name || serviceId,
            version: serviceData.version || '1.0.0',
            instances: [],
            createdAt: new Date()
        };
        
        this.services.set(serviceId, service);
        this.registry.set(serviceId, service);
        console.log(`Service registered: ${serviceId}`);
        return service;
    }

    registerInstance(serviceId, instanceId, instanceData) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }
        
        const instance = {
            id: instanceId,
            serviceId,
            ...instanceData,
            address: instanceData.address || 'localhost',
            port: instanceData.port || 8080,
            health: 'healthy',
            registeredAt: new Date(),
            createdAt: new Date()
        };
        
        this.instances.set(instanceId, instance);
        service.instances.push(instanceId);
        
        return instance;
    }

    discover(serviceName) {
        const service = Array.from(this.services.values())
            .find(s => s.name === serviceName);
        
        if (!service) {
            return null;
        }
        
        const healthyInstances = service.instances
            .map(id => this.instances.get(id))
            .filter(i => i && i.health === 'healthy');
        
        return {
            service,
            instances: healthyInstances
        };
    }

    deregisterInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error('Instance not found');
        }
        
        const service = this.services.get(instance.serviceId);
        if (service) {
            const index = service.instances.indexOf(instanceId);
            if (index > -1) {
                service.instances.splice(index, 1);
            }
        }
        
        this.instances.delete(instanceId);
        
        return { deregistered: true, instanceId };
    }

    getService(serviceId) {
        return this.services.get(serviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.serviceRegistry = new ServiceRegistry();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceRegistry;
}

