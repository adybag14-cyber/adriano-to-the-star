/**
 * Downloadable Resources
 * @class DownloadableResources
 * @description Manages downloadable resources with organization, access control, and tracking.
 */
class DownloadableResources {
    constructor() {
        this.resources = new Map();
        this.categories = new Map();
        this.downloads = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ow_nl_oa_da_bl_er_es_ou_rc_es_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ow_nl_oa_da_bl_er_es_ou_rc_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add a downloadable resource.
     * @param {string} resourceId - Resource identifier.
     * @param {object} resourceData - Resource data.
     */
    addResource(resourceId, resourceData) {
        this.resources.set(resourceId, {
            ...resourceData,
            downloadCount: 0,
            createdAt: new Date(),
            fileSize: resourceData.fileSize || 0,
            fileType: resourceData.fileType || 'unknown'
        });
        console.log(`Resource added: ${resourceId}`);
    }

    /**
     * Download a resource.
     * @param {string} userId - User identifier.
     * @param {string} resourceId - Resource identifier.
     * @returns {object} Download information.
     */
    downloadResource(userId, resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            throw new Error(`Resource not found: ${resourceId}`);
        }

        resource.downloadCount++;
        
        const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.downloads.set(downloadId, {
            id: downloadId,
            userId,
            resourceId,
            downloadedAt: new Date()
        });

        console.log(`Resource ${resourceId} downloaded by user ${userId}`);
        
        return {
            downloadId,
            url: resource.url,
            filename: resource.filename || resourceId
        };
    }

    /**
     * Get resources by category.
     * @param {string} categoryId - Category identifier.
     * @returns {Array<object>} Resources in category.
     */
    getResourcesByCategory(categoryId) {
        return Array.from(this.resources.values())
            .filter(resource => resource.category === categoryId);
    }

    /**
     * Get download statistics.
     * @param {string} resourceId - Resource identifier.
     * @returns {object} Download statistics.
     */
    getDownloadStats(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) return null;

        const resourceDownloads = Array.from(this.downloads.values())
            .filter(dl => dl.resourceId === resourceId);

        return {
            totalDownloads: resource.downloadCount,
            uniqueUsers: new Set(resourceDownloads.map(dl => dl.userId)).size,
            recentDownloads: resourceDownloads.slice(-10)
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.downloadableResources = new DownloadableResources();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DownloadableResources;
}
