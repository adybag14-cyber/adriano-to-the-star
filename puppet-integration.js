/**
 * Puppet Integration
 * Puppet configuration management
 */

class PuppetIntegration {
    constructor() {
        this.manifests = new Map();
        this.nodes = new Map();
        this.catalogs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('puppet_integ_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`puppet_integ_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createManifest(manifestId, manifestData) {
        const manifest = {
            id: manifestId,
            ...manifestData,
            name: manifestData.name || manifestId,
            content: manifestData.content || '',
            resources: manifestData.resources || [],
            createdAt: new Date()
        };
        
        this.manifests.set(manifestId, manifest);
        console.log(`Puppet manifest created: ${manifestId}`);
        return manifest;
    }

    registerNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            environment: nodeData.environment || 'production',
            facts: nodeData.facts || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        console.log(`Puppet node registered: ${nodeId}`);
        return node;
    }

    async compileCatalog(nodeId, manifestId) {
        const node = this.nodes.get(nodeId);
        const manifest = this.manifests.get(manifestId);
        
        if (!node || !manifest) {
            throw new Error('Node or manifest not found');
        }
        
        const catalog = {
            id: `catalog_${Date.now()}`,
            nodeId,
            manifestId,
            resources: manifest.resources,
            compiledAt: new Date(),
            createdAt: new Date()
        };
        
        this.catalogs.set(catalog.id, catalog);
        
        return catalog;
    }

    async apply(nodeId, catalogId) {
        const node = this.nodes.get(nodeId);
        const catalog = this.catalogs.get(catalogId);
        
        if (!node || !catalog) {
            throw new Error('Node or catalog not found');
        }
        
        node.lastApplied = new Date();
        node.status = 'applied';
        
        return { node, catalog };
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getManifest(manifestId) {
        return this.manifests.get(manifestId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.puppetIntegration = new PuppetIntegration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuppetIntegration;
}

