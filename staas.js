/**
 * STaaS
 * Storage as a Service
 */

class STaaS {
    constructor() {
        this.storages = new Map();
        this.volumes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ta_as_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ta_as_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createStorage(storageId, storageData) {
        const storage = {
            id: storageId,
            ...storageData,
            name: storageData.name || storageId,
            type: storageData.type || 'block',
            provider: storageData.provider || 'aws',
            region: storageData.region || 'us-east-1',
            volumes: [],
            createdAt: new Date()
        };
        
        this.storages.set(storageId, storage);
        console.log(`Storage created: ${storageId}`);
        return storage;
    }

    createVolume(storageId, volumeId, volumeData) {
        const storage = this.storages.get(storageId);
        if (!storage) {
            throw new Error('Storage not found');
        }
        
        const volume = {
            id: volumeId,
            storageId,
            ...volumeData,
            name: volumeData.name || volumeId,
            size: volumeData.size || 100,
            type: volumeData.type || 'ssd',
            status: 'available',
            createdAt: new Date()
        };
        
        this.volumes.set(volumeId, volume);
        storage.volumes.push(volumeId);
        
        return volume;
    }

    attachVolume(volumeId, resourceId) {
        const volume = this.volumes.get(volumeId);
        if (!volume) {
            throw new Error('Volume not found');
        }
        
        volume.status = 'attached';
        volume.attachedTo = resourceId;
        volume.attachedAt = new Date();
        
        return volume;
    }

    detachVolume(volumeId) {
        const volume = this.volumes.get(volumeId);
        if (!volume) {
            throw new Error('Volume not found');
        }
        
        volume.status = 'available';
        volume.attachedTo = null;
        volume.detachedAt = new Date();
        
        return volume;
    }

    getStorage(storageId) {
        return this.storages.get(storageId);
    }

    getVolume(volumeId) {
        return this.volumes.get(volumeId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.staas = new STaaS();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = STaaS;
}

