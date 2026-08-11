/**
 * Enterprise Architecture
 * Enterprise architecture management
 */

class EnterpriseArchitecture {
    constructor() {
        this.architectures = new Map();
        this.components = new Map();
        this.init();
    }

    init() {
        this.trackEvent('enterprise_arch_initialized');
    }

    createArchitecture(architectureId, architectureData) {
        const architecture = {
            id: architectureId,
            ...architectureData,
            name: architectureData.name || architectureId,
            layers: architectureData.layers || [],
            components: [],
            createdAt: new Date()
        };
        
        this.architectures.set(architectureId, architecture);
        console.log(`Enterprise architecture created: ${architectureId}`);
        return architecture;
    }

    registerComponent(architectureId, componentId, componentData) {
        const architecture = this.architectures.get(architectureId);
        if (!architecture) {
            throw new Error('Architecture not found');
        }
        
        const component = {
            id: componentId,
            architectureId,
            ...componentData,
            name: componentData.name || componentId,
            type: componentData.type || 'service',
            layer: componentData.layer || 'application',
            createdAt: new Date()
        };
        
        this.components.set(componentId, component);
        architecture.components.push(componentId);
        
        return component;
    }

    getArchitecture(architectureId) {
        return this.architectures.get(architectureId);
    }

    getComponent(componentId) {
        return this.components.get(componentId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`enterprise_arch_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.enterpriseArchitecture = new EnterpriseArchitecture();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseArchitecture;
}

