/**
 * Data Mesh
 * Data mesh architecture
 */

class DataMesh {
    constructor() {
        this.meshes = new Map();
        this.domains = new Map();
        this.products = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_mesh_initialized');
    }

    createMesh(meshId, meshData) {
        const mesh = {
            id: meshId,
            ...meshData,
            name: meshData.name || meshId,
            domains: [],
            createdAt: new Date()
        };
        
        this.meshes.set(meshId, mesh);
        console.log(`Data mesh created: ${meshId}`);
        return mesh;
    }

    createDomain(meshId, domainId, domainData) {
        const mesh = this.meshes.get(meshId);
        if (!mesh) {
            throw new Error('Mesh not found');
        }
        
        const domain = {
            id: domainId,
            meshId,
            ...domainData,
            name: domainData.name || domainId,
            owner: domainData.owner || '',
            products: [],
            createdAt: new Date()
        };
        
        this.domains.set(domainId, domain);
        mesh.domains.push(domainId);
        
        return domain;
    }

    createProduct(domainId, productId, productData) {
        const domain = this.domains.get(domainId);
        if (!domain) {
            throw new Error('Domain not found');
        }
        
        const product = {
            id: productId,
            domainId,
            ...productData,
            name: productData.name || productId,
            type: productData.type || 'dataset',
            format: productData.format || 'api',
            createdAt: new Date()
        };
        
        this.products.set(productId, product);
        domain.products.push(productId);
        
        return product;
    }

    getMesh(meshId) {
        return this.meshes.get(meshId);
    }

    getDomain(domainId) {
        return this.domains.get(domainId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_mesh_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataMesh = new DataMesh();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataMesh;
}

