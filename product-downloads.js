/**
 * Product Downloads
 * @class ProductDownloads
 * @description Manages product file downloads with access control and tracking.
 */
class ProductDownloads {
    constructor() {
        this.downloads = new Map();
        this.files = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_do_wn_lo_ad_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_do_wn_lo_ad_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Register a downloadable file.
     * @param {string} productId - Product identifier.
     * @param {object} fileData - File data.
     */
    registerFile(productId, fileData) {
        if (!this.files.has(productId)) {
            this.files.set(productId, []);
        }

        this.files.get(productId).push({
            ...fileData,
            id: fileData.id || `file_${Date.now()}`,
            url: fileData.url,
            filename: fileData.filename,
            size: fileData.size || 0,
            downloadCount: 0
        });
        console.log(`File registered for product ${productId}`);
    }

    /**
     * Download a file.
     * @param {string} productId - Product identifier.
     * @param {string} fileId - File identifier.
     * @param {string} userId - User identifier.
     * @returns {object} Download information.
     */
    downloadFile(productId, fileId, userId) {
        const productFiles = this.files.get(productId);
        if (!productFiles) {
            throw new Error(`Product not found: ${productId}`);
        }

        const file = productFiles.find(f => f.id === fileId);
        if (!file) {
            throw new Error(`File not found: ${fileId}`);
        }

        file.downloadCount++;

        const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.downloads.set(downloadId, {
            id: downloadId,
            productId,
            fileId,
            userId,
            downloadedAt: new Date()
        });

        console.log(`File downloaded: ${fileId} by user ${userId}`);
        return {
            downloadId,
            url: file.url,
            filename: file.filename
        };
    }

    /**
     * Get download statistics.
     * @param {string} productId - Product identifier.
     * @returns {object} Download statistics.
     */
    getDownloadStats(productId) {
        const files = this.files.get(productId) || [];
        const totalDownloads = files.reduce((sum, file) => sum + file.downloadCount, 0);
        
        return {
            productId,
            totalFiles: files.length,
            totalDownloads,
            files: files.map(file => ({
                id: file.id,
                filename: file.filename,
                downloads: file.downloadCount
            }))
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.productDownloads = new ProductDownloads();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductDownloads;
}

