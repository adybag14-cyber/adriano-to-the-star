/**
 * CMDB
 * Configuration Management Database
 */

class CMDB {
    constructor() {
        this.configurations = new Map();
        this.items = new Map();
        this.relationships = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cmdb_initialized');
    }

    createConfigurationItem(itemId, itemData) {
        const item = {
            id: itemId,
            ...itemData,
            name: itemData.name || itemId,
            type: itemData.type || 'server',
            status: itemData.status || 'active',
            attributes: itemData.attributes || {},
            relationships: [],
            createdAt: new Date()
        };
        
        this.items.set(itemId, item);
        console.log(`Configuration item created: ${itemId}`);
        return item;
    }

    createRelationship(sourceId, targetId, relationshipData) {
        const source = this.items.get(sourceId);
        const target = this.items.get(targetId);
        
        if (!source || !target) {
            throw new Error('Source or target item not found');
        }
        
        const relationship = {
            id: `relationship_${Date.now()}`,
            sourceId,
            targetId,
            ...relationshipData,
            type: relationshipData.type || 'depends_on',
            createdAt: new Date()
        };
        
        this.relationships.set(relationship.id, relationship);
        
        if (!source.relationships.includes(relationship.id)) {
            source.relationships.push(relationship.id);
        }
        
        return relationship;
    }

    getItem(itemId) {
        return this.items.get(itemId);
    }

    getRelationships(itemId) {
        const item = this.items.get(itemId);
        if (!item) {
            throw new Error('Item not found');
        }
        
        return item.relationships
            .map(id => this.relationships.get(id))
            .filter(Boolean);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cmdb_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cmdb = new CMDB();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMDB;
}

