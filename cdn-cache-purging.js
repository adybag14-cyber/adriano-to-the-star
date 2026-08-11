/**
 * CDN Cache Purging
 * Manages CDN cache purging and invalidation
 */

class CDNCachePurging {
    constructor() {
        this.purgeQueue = [];
        this.init();
    }
    
    init() {
        this.setupPurgeQueue();
        this.trackEvent('cdn_purge_initialized');
    }
    
    setupPurgeQueue() {
        // Setup purge queue processing
        setInterval(() => {
            this.processPurgeQueue();
        }, 10000); // Process every 10 seconds
    }
    
    async purge(urls, options = {}) {
        const { immediate = false, pattern = null } = options;
        
        if (immediate) {
            await this.executePurge(urls);
        } else {
            // Add to queue
            this.purgeQueue.push({ urls, timestamp: Date.now() });
        }
    }
    
    async executePurge(urls) {
        // Execute CDN cache purge
        if (window.cdnAPI) {
            try {
                await window.cdnAPI.purge(urls);
                console.log('CDN cache purged for:', urls);
            } catch (error) {
                console.error('CDN purge failed:', error);
            }
        } else {
            // Fallback: use Cache-Control headers
            console.log('CDN purge requested for:', urls);
        }
    }
    
    async processPurgeQueue() {
        if (this.purgeQueue.length === 0) return;
        
        const batch = this.purgeQueue.splice(0, 10);
        const allUrls = batch.flatMap(item => item.urls);
        
        await this.executePurge(allUrls);
    }
    
    async purgeByPattern(pattern) {
        // Purge all URLs matching pattern
        const urls = this.getUrlsByPattern(pattern);
        await this.purge(urls, { immediate: true });
    }
    
    getUrlsByPattern(pattern) {
        // Get URLs matching pattern
        const urls = [];
        document.querySelectorAll('link[href], script[src], img[src]').forEach(element => {
            const url = element.href || element.src;
            if (url && pattern.test(url)) {
                urls.push(url);
            }
        });
        return urls;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cdn_purge_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cdnCachePurging = new CDNCachePurging(); });
} else {
    window.cdnCachePurging = new CDNCachePurging();
}

