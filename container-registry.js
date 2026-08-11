/**
 * Container Registry
 * Container image registry management
 */

class ContainerRegistry {
    constructor() {
        this.registries = new Map();
        this.repositories = new Map();
        this.images = new Map();
        this.init();
    }

    init() {
        this.trackEvent('container_registry_initialized');
    }

    createRegistry(registryId, registryData) {
        const registry = {
            id: registryId,
            ...registryData,
            name: registryData.name || registryId,
            url: registryData.url || `registry.${registryId}.com`,
            repositories: [],
            createdAt: new Date()
        };
        
        this.registries.set(registryId, registry);
        console.log(`Container registry created: ${registryId}`);
        return registry;
    }

    createRepository(registryId, repositoryId, repositoryData) {
        const registry = this.registries.get(registryId);
        if (!registry) {
            throw new Error('Registry not found');
        }
        
        const repository = {
            id: repositoryId,
            registryId,
            ...repositoryData,
            name: repositoryData.name || repositoryId,
            images: [],
            createdAt: new Date()
        };
        
        this.repositories.set(repositoryId, repository);
        registry.repositories.push(repositoryId);
        
        return repository;
    }

    pushImage(registryId, repositoryId, imageData) {
        const registry = this.registries.get(registryId);
        const repository = this.repositories.get(repositoryId);
        
        if (!registry || !repository) {
            throw new Error('Registry or repository not found');
        }
        
        const image = {
            id: `image_${Date.now()}`,
            registryId,
            repositoryId,
            ...imageData,
            tag: imageData.tag || 'latest',
            digest: imageData.digest || this.generateDigest(),
            size: imageData.size || 0,
            pushedAt: new Date(),
            createdAt: new Date()
        };
        
        this.images.set(image.id, image);
        repository.images.push(image.id);
        
        return image;
    }

    generateDigest() {
        return 'sha256:' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getRegistry(registryId) {
        return this.registries.get(registryId);
    }

    getRepository(repositoryId) {
        return this.repositories.get(repositoryId);
    }

    getImage(imageId) {
        return this.images.get(imageId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`container_registry_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.containerRegistry = new ContainerRegistry();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContainerRegistry;
}

