/**
 * Data Tagging
 * Data tagging system
 */

class DataTagging {
    constructor() {
        this.taggings = new Map();
        this.tags = new Map();
        this.assets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_tagging_initialized');
    }

    async tag(taggingId, taggingData) {
        const tagging = {
            id: taggingId,
            ...taggingData,
            assetId: taggingData.assetId || '',
            tags: taggingData.tags || [],
            status: 'tagged',
            createdAt: new Date()
        };
        
        this.taggings.set(taggingId, tagging);
        return tagging;
    }

    async searchByTag(tag) {
        return Array.from(this.taggings.values())
            .filter(t => t.tags.includes(tag));
    }

    getTagging(taggingId) {
        return this.taggings.get(taggingId);
    }

    getAllTaggings() {
        return Array.from(this.taggings.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_tagging_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = DataTagging;

