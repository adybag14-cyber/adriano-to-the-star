/**
 * Infrastructure Monitoring
 * Infrastructure monitoring system
 */

class InfrastructureMonitoring {
    constructor() {
        this.resources = new Map();
        this.metrics = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('infra_mon_initialized');
        return { success: true, message: 'Infrastructure Monitoring initialized' };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`infra_mon_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    registerResource(name, type, config) {
        const resource = {
            id: Date.now().toString(),
            name,
            type,
            config: config || {},
            registeredAt: new Date(),
            status: 'active'
        };
        this.resources.set(resource.id, resource);
        return resource;
    }

    collectMetric(resourceId, metricName, value) {
        const resource = this.resources.get(resourceId);
        if (!resource || resource.status !== 'active') {
            throw new Error('Resource not found or inactive');
        }
        const metric = {
            resourceId,
            metricName,
            value,
            collectedAt: new Date()
        };
        this.metrics.push(metric);
        return metric;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfrastructureMonitoring;
}
