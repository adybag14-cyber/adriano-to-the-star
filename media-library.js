/**
 * Media Library
 * @class MediaLibrary
 * @description Manages media files with organization and search.
 */
class MediaLibrary {
    constructor() {
        this.media = new Map();
        this.collections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_ed_ia_li_br_ar_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_ed_ia_li_br_ar_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Upload media.
     * @param {string} mediaId - Media identifier.
     * @param {object} mediaData - Media data.
     */
    uploadMedia(mediaId, mediaData) {
        this.media.set(mediaId, {
            ...mediaData,
            id: mediaId,
            filename: mediaData.filename,
            type: mediaData.type || 'image',
            url: mediaData.url,
            size: mediaData.size || 0,
            mimeType: mediaData.mimeType,
            tags: mediaData.tags || [],
            uploadedAt: new Date()
        });
        console.log(`Media uploaded: ${mediaId}`);
    }

    /**
     * Create collection.
     * @param {string} collectionId - Collection identifier.
     * @param {object} collectionData - Collection data.
     */
    createCollection(collectionId, collectionData) {
        this.collections.set(collectionId, {
            ...collectionData,
            id: collectionId,
            name: collectionData.name,
            media: [],
            createdAt: new Date()
        });
        console.log(`Collection created: ${collectionId}`);
    }

    /**
     * Add media to collection.
     * @param {string} collectionId - Collection identifier.
     * @param {string} mediaId - Media identifier.
     */
    addToCollection(collectionId, mediaId) {
        const collection = this.collections.get(collectionId);
        const media = this.media.get(mediaId);
        
        if (!collection) {
            throw new Error(`Collection not found: ${collectionId}`);
        }
        if (!media) {
            throw new Error(`Media not found: ${mediaId}`);
        }

        if (!collection.media.includes(mediaId)) {
            collection.media.push(mediaId);
            console.log(`Media added to collection: ${mediaId} -> ${collectionId}`);
        }
    }

    /**
     * Search media.
     * @param {string} query - Search query.
     * @param {object} filters - Filter options.
     * @returns {Array<object>} Matching media.
     */
    searchMedia(query, filters = {}) {
        let results = Array.from(this.media.values());

        if (query) {
            results = results.filter(media => 
                media.filename.toLowerCase().includes(query.toLowerCase()) ||
                media.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            );
        }

        if (filters.type) {
            results = results.filter(media => media.type === filters.type);
        }

        return results;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.mediaLibrary = new MediaLibrary();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaLibrary;
}

