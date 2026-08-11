/**
 * Digital Asset Management
 * Digital asset management system
 */

class DigitalAssetManagement {
    constructor() {
        this.libraries = new Map();
        this.assets = new Map();
        this.metadata = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ig_it_al_as_se_tm_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ig_it_al_as_se_tm_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createLibrary(libraryId, libraryData) {
        const library = {
            id: libraryId,
            ...libraryData,
            name: libraryData.name || libraryId,
            assets: [],
            createdAt: new Date()
        };
        
        this.libraries.set(libraryId, library);
        console.log(`Asset library created: ${libraryId}`);
        return library;
    }

    uploadAsset(libraryId, assetId, assetData) {
        const library = this.libraries.get(libraryId);
        if (!library) {
            throw new Error('Library not found');
        }
        
        const asset = {
            id: assetId,
            libraryId,
            ...assetData,
            name: assetData.name || assetId,
            type: assetData.type || 'image',
            url: assetData.url || '',
            size: assetData.size || 0,
            metadata: assetData.metadata || {},
            createdAt: new Date()
        };
        
        this.assets.set(assetId, asset);
        library.assets.push(assetId);
        
        const metadataRecord = {
            id: `metadata_${Date.now()}`,
            assetId,
            metadata: asset.metadata,
            createdAt: new Date()
        };
        
        this.metadata.set(metadataRecord.id, metadataRecord);
        
        return { asset, metadata: metadataRecord };
    }

    updateMetadata(assetId, metadata) {
        const asset = this.assets.get(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        
        asset.metadata = { ...asset.metadata, ...metadata };
        asset.updatedAt = new Date();
        
        return asset;
    }

    getAsset(assetId) {
        return this.assets.get(assetId);
    }

    getLibrary(libraryId) {
        return this.libraries.get(libraryId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.digitalAssetManagement = new DigitalAssetManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DigitalAssetManagement;
}

