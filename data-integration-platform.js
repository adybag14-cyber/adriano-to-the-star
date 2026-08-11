/**
 * Data Integration Platform
 * Data integration platform
 */

class DataIntegrationPlatform {
    constructor() {
        this.platforms = new Map();
        this.connectors = new Map();
        this.pipelines = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_integ_platform_initialized');
    }

    createPlatform(platformId, platformData) {
        const platform = {
            id: platformId,
            ...platformData,
            name: platformData.name || platformId,
            connectors: [],
            pipelines: [],
            createdAt: new Date()
        };
        
        this.platforms.set(platformId, platform);
        console.log(`Data integration platform created: ${platformId}`);
        return platform;
    }

    registerConnector(platformId, connectorId, connectorData) {
        const platform = this.platforms.get(platformId);
        if (!platform) {
            throw new Error('Platform not found');
        }
        
        const connector = {
            id: connectorId,
            platformId,
            ...connectorData,
            name: connectorData.name || connectorId,
            type: connectorData.type || 'database',
            enabled: connectorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.connectors.set(connectorId, connector);
        platform.connectors.push(connectorId);
        
        return connector;
    }

    createPipeline(platformId, pipelineId, pipelineData) {
        const platform = this.platforms.get(platformId);
        if (!platform) {
            throw new Error('Platform not found');
        }
        
        const pipeline = {
            id: pipelineId,
            platformId,
            ...pipelineData,
            name: pipelineData.name || pipelineId,
            source: pipelineData.source || '',
            target: pipelineData.target || '',
            status: 'pending',
            createdAt: new Date()
        };
        
        this.pipelines.set(pipelineId, pipeline);
        platform.pipelines.push(pipelineId);
        
        return pipeline;
    }

    getPlatform(platformId) {
        return this.platforms.get(platformId);
    }

    getConnector(connectorId) {
        return this.connectors.get(connectorId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_integ_platform_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataIntegrationPlatform = new DataIntegrationPlatform();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataIntegrationPlatform;
}

