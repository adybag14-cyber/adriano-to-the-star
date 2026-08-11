/**
 * Asset Compression (Advanced)
 * Advanced compression for assets (gzip, brotli)
 */

class AssetCompressionAdvanced {
    constructor() {
        this.supportsBrotli = false;
        this.supportsGzip = true;
        this.init();
    }
    
    init() {
        this.detectCompressionSupport();
        this.optimizeRequestHeaders();
        this.trackEvent('compression_adv_initialized');
    }
    
    detectCompressionSupport() {
        // Check browser support for compression
        this.supportsBrotli = navigator.userAgent.includes('Chrome') || 
                             navigator.userAgent.includes('Firefox');
        this.supportsGzip = true; // All modern browsers support gzip
    }
    
    optimizeRequestHeaders() {
        // Add compression headers to requests
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            options.headers = {
                ...options.headers,
                'Accept-Encoding': self.getAcceptEncoding()
            };
            return originalFetch(url, options);
        };
    }
    
    getAcceptEncoding() {
        if (this.supportsBrotli) {
            return 'br, gzip, deflate';
        }
        return 'gzip, deflate';
    }
    
    async compressData(data, encoding = 'gzip') {
        // Client-side compression for large payloads
        if (window.CompressionStream) {
            try {
                const stream = new CompressionStream(encoding);
                const blob = new Blob([data]);
                const compressedStream = blob.stream().pipeThrough(stream);
                return await new Response(compressedStream).blob();
            } catch (e) {
                console.warn('Compression failed:', e);
            }
        }
        return data;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`compression_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.assetCompressionAdvanced = new AssetCompressionAdvanced(); });
} else {
    window.assetCompressionAdvanced = new AssetCompressionAdvanced();
}

