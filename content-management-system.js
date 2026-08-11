/**
 * Content Management System
 * @class ContentManagementSystem
 * @description Manages content with versioning, publishing, and workflow.
 */
class ContentManagementSystem {
    constructor() {
        this.content = new Map();
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('content_cms_initialized');
    }

    /**
     * Create content.
     * @param {string} contentId - Content identifier.
     * @param {object} contentData - Content data.
     */
    createContent(contentId, contentData) {
        this.content.set(contentId, {
            ...contentData,
            id: contentId,
            title: contentData.title,
            body: contentData.body,
            type: contentData.type || 'page',
            status: 'draft',
            version: 1,
            createdAt: new Date()
        });
        console.log(`Content created: ${contentId}`);
    }

    /**
     * Update content.
     * @param {string} contentId - Content identifier.
     * @param {object} updates - Updates to apply.
     */
    updateContent(contentId, updates) {
        const content = this.content.get(contentId);
        if (!content) {
            throw new Error(`Content not found: ${contentId}`);
        }

        // Save current version
        const versionId = `${contentId}_v${content.version}`;
        this.versions.set(versionId, {
            ...content,
            versionId,
            savedAt: new Date()
        });

        // Apply updates
        Object.assign(content, updates);
        content.version++;
        content.updatedAt = new Date();

        console.log(`Content updated: ${contentId} -> v${content.version}`);
    }

    /**
     * Publish content.
     * @param {string} contentId - Content identifier.
     */
    publishContent(contentId) {
        const content = this.content.get(contentId);
        if (content) {
            content.status = 'published';
            content.publishedAt = new Date();
            console.log(`Content published: ${contentId}`);
        }
    }

    /**
     * Get content versions.
     * @param {string} contentId - Content identifier.
     * @returns {Array<object>} Content versions.
     */
    getContentVersions(contentId) {
        return Array.from(this.versions.values())
            .filter(v => v.id === contentId)
            .sort((a, b) => b.version - a.version);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_cms_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.contentManagementSystem = new ContentManagementSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentManagementSystem;
}
