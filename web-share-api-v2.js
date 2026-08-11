/**
 * Web Share API v2
 * Enhanced sharing capabilities with additional features
 */

class WebShareAPIV2 {
    constructor() {
        this.supported = false;
        this.initialized = false;
    }

    /**
     * Initialize Web Share API v2
     */
    async initialize() {
        this.supported = this.isSupported();
        if (!this.supported) {
            throw new Error('Web Share API is not supported in this browser');
        }
        this.initialized = true;
        return { success: true, message: 'Web Share API v2 initialized' };
    }

    /**
     * Check if Web Share API is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof navigator !== 'undefined' && 'share' in navigator;
    }

    /**
     * Share data
     * @param {Object} data - Share data
     * @returns {Promise<void>}
     */
    async share(data) {
        if (!this.supported) {
            throw new Error('Web Share API is not supported');
        }

        const shareData = {
            title: data.title || '',
            text: data.text || '',
            url: data.url || ''
        };

        try {
            await navigator.share(shareData);
            this.trackEvent('content_shared', { title: shareData.title });
            return { success: true, message: 'Content shared successfully' };
        } catch (error) {
            if (error.name === 'AbortError') {
                this.trackEvent('share_cancelled');
                return { success: false, message: 'Share cancelled by user' };
            }
            this.trackEvent('share_failed', { error: error.message });
            throw new Error(`Share failed: ${error.message}`);
        }
    }

    /**
     * Share file
     * @param {File|File[]} files - File(s) to share
     * @param {Object} options - Additional options
     * @returns {Promise<void>}
     */
    async shareFiles(files, options = {}) {
        if (!this.supported) {
            throw new Error('Web Share API is not supported');
        }

        const fileArray = Array.isArray(files) ? files : [files];
        const shareData = {
            files: fileArray,
            title: options.title || '',
            text: options.text || ''
        };

        try {
            await navigator.share(shareData);
            return { success: true, message: 'Files shared successfully' };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, message: 'Share cancelled by user' };
            }
            throw new Error(`File share failed: ${error.message}`);
        }
    }

    /**
     * Check if can share
     * @param {Object} data - Share data
     * @returns {boolean}
     */
    canShare(data) {
        if (!this.supported) {
            return false;
        }

        try {
            return navigator.canShare(data);
        } catch (error) {
            return false;
        }
    }

    /**
     * Share with fallback
     * @param {Object} data - Share data
     * @param {Function} fallback - Fallback function
     * @returns {Promise<void>}
     */
    async shareWithFallback(data, fallback) {
        try {
            await this.share(data);
        } catch (error) {
            if (fallback && typeof fallback === 'function') {
                fallback(data);
            } else {
                this.fallbackShare(data);
            }
        }
    }

    /**
     * Fallback share method
     * @param {Object} data - Share data
     */
    fallbackShare(data) {
        const text = `${data.title || ''} ${data.text || ''} ${data.url || ''}`.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
            this.trackEvent('fallback_share_clipboard');
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`share:${eventName}`, 1, {
                    source: 'web-share-api-v2',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record share event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Share Event', { event: eventName, ...data });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebShareAPIV2;
}

