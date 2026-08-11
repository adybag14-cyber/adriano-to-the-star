/**
 * Data Lineage
 * Data lineage tracking
 */

class DataLineage {
    constructor() {
        this.lineages = new Map();
        this.assets = new Map();
        this.relationships = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_lineage_initialized');
    }

    registerAsset(assetId, assetData) {
        const asset = {
            id: assetId,
            ...assetData,
            name: assetData.name || assetId,
            type: assetData.type || 'dataset',
            upstream: [],
            downstream: [],
            createdAt: new Date()
        };
        
        this.assets.set(assetId, asset);
        console.log(`Asset registered: ${assetId}`);
        return asset;
    }

    createRelationship(sourceId, targetId, relationshipData) {
        const source = this.assets.get(sourceId);
        const target = this.assets.get(targetId);
        
        if (!source || !target) {
            throw new Error('Source or target asset not found');
        }
        
        const relationship = {
            id: `relationship_${Date.now()}`,
            sourceId,
            targetId,
            ...relationshipData,
            type: relationshipData.type || 'transforms',
            createdAt: new Date()
        };
        
        this.relationships.set(relationship.id, relationship);
        
        if (!source.downstream.includes(targetId)) {
            source.downstream.push(targetId);
        }
        
        if (!target.upstream.includes(sourceId)) {
            target.upstream.push(sourceId);
        }
        
        return relationship;
    }

    getLineage(assetId) {
        const asset = this.assets.get(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }
        
        return {
            asset,
            upstream: asset.upstream.map(id => this.assets.get(id)).filter(Boolean),
            downstream: asset.downstream.map(id => this.assets.get(id)).filter(Boolean)
        };
    }

    getAsset(assetId) {
        return this.assets.get(assetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_lineage_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataLineage = new DataLineage();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLineage;
}

