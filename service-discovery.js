/**
 * Service Discovery
 * Service discovery and registration
 */

class ServiceDiscovery {
    constructor() {
        this.registries = new Map();
        this.services = new Map();
        this.instances = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_er_vi_ce_di_sc_ov_er_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_er_vi_ce_di_sc_ov_er_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createRegistry(registryId, registryData) {
        const registry = {
            id: registryId,
            ...registryData,
            name: registryData.name || registryId,
            services: [],
            createdAt: new Date()
        };
        
        this.registries.set(registryId, registry);
        console.log(`Service registry created: ${registryId}`);
        return registry;
    }

    registerService(registryId, serviceId, serviceData) {
        const registry = this.registries.get(registryId);
        if (!registry) {
            throw new Error('Registry not found');
        }
        
        const service = {
            id: serviceId,
            registryId,
            ...serviceData,
            name: serviceData.name || serviceId,
            instances: [],
            createdAt: new Date()
        };
        
        this.services.set(serviceId, service);
        registry.services.push(serviceId);
        
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
            status: 'healthy',
            registeredAt: new Date(),
            createdAt: new Date()
        };
        
        this.instances.set(instanceId, instance);
        service.instances.push(instanceId);
        
        return instance;
    }

    discover(registryId, serviceName) {
        const registry = this.registries.get(registryId);
        if (!registry) {
            throw new Error('Registry not found');
        }
        
        const service = Array.from(this.services.values())
            .find(s => s.registryId === registryId && s.name === serviceName);
        
        if (!service) {
            return null;
        }
        
        const healthyInstances = service.instances
            .map(id => this.instances.get(id))
            .filter(i => i && i.status === 'healthy');
        
        return {
            service,
            instances: healthyInstances
        };
    }

    getRegistry(registryId) {
        return this.registries.get(registryId);
    }

    getService(serviceId) {
        return this.services.get(serviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.serviceDiscovery = new ServiceDiscovery();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceDiscovery;
}

