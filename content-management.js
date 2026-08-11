/**
 * Content Management
 * Content management system
 */

class ContentManagement {
    constructor() {
        this.spaces = new Map();
        this.content = new Map();
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('content_mgmt_initialized');
    }

    createSpace(spaceId, spaceData) {
        const space = {
            id: spaceId,
            ...spaceData,
            name: spaceData.name || spaceId,
            content: [],
            createdAt: new Date()
        };
        
        this.spaces.set(spaceId, space);
        console.log(`Content space created: ${spaceId}`);
        return space;
    }

    createContent(spaceId, contentId, contentData) {
        const space = this.spaces.get(spaceId);
        if (!space) {
            throw new Error('Space not found');
        }
        
        const content = {
            id: contentId,
            spaceId,
            ...contentData,
            name: contentData.name || contentId,
            type: contentData.type || 'page',
            body: contentData.body || '',
            version: 1,
            versions: [],
            createdAt: new Date()
        };
        
        this.content.set(contentId, content);
        space.content.push(contentId);
        
        const version = {
            id: `version_${Date.now()}`,
            contentId,
            version: 1,
            body: content.body,
            createdAt: new Date()
        };
        
        this.versions.set(version.id, version);
        content.versions.push(version.id);
        
        return { content, version };
    }

    updateContent(contentId, updates) {
        const content = this.content.get(contentId);
        if (!content) {
            throw new Error('Content not found');
        }
        
        content.body = updates.body || content.body;
        content.version++;
        
        const version = {
            id: `version_${Date.now()}`,
            contentId,
            version: content.version,
            body: content.body,
            createdAt: new Date()
        };
        
        this.versions.set(version.id, version);
        content.versions.push(version.id);
        
        return { content, version };
    }

    getContent(contentId) {
        return this.content.get(contentId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.contentManagement = new ContentManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManagement;
}

