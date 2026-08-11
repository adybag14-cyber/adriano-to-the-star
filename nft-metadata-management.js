/**
 * NFT Metadata Management
 * NFT metadata storage and management
 */

class NFTMetadataManagement {
    constructor() {
        this.metadata = new Map();
        this.storages = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_ft_me_ta_da_ta_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_ft_me_ta_da_ta_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerStorage(storageId, storageData) {
        const storage = {
            id: storageId,
            ...storageData,
            name: storageData.name || storageId,
            type: storageData.type || 'ipfs',
            endpoint: storageData.endpoint || '',
            enabled: storageData.enabled !== false,
            createdAt: new Date()
        };
        
        this.storages.set(storageId, storage);
        console.log(`Metadata storage registered: ${storageId}`);
        return storage;
    }

    async storeMetadata(tokenId, metadataData, storageId = null) {
        const storage = storageId ? this.storages.get(storageId) : 
                       Array.from(this.storages.values()).find(s => s.enabled);
        if (!storage) {
            throw new Error('Storage not found');
        }
        
        const metadata = {
            id: `metadata_${Date.now()}`,
            tokenId,
            storageId: storage.id,
            ...metadataData,
            name: metadataData.name || '',
            description: metadataData.description || '',
            image: metadataData.image || '',
            attributes: metadataData.attributes || [],
            uri: this.generateURI(storage, tokenId),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metadata.set(metadata.id, metadata);
        
        return metadata;
    }

    generateURI(storage, tokenId) {
        if (storage.type === 'ipfs') {
            return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`;
        }
        return `https://api.example.com/metadata/${tokenId}`;
    }

    getMetadata(tokenId) {
        return Array.from(this.metadata.values())
            .find(m => m.tokenId === tokenId);
    }

    getStorage(storageId) {
        return this.storages.get(storageId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.nftMetadataManagement = new NFTMetadataManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFTMetadataManagement;
}


