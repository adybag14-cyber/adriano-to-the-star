/**
 * Gzip/Brotli Compression
 * Client-side compression detection and optimization
 */

class CompressionGzipBrotli {
    constructor() {
        this.supportsBrotli = false;
        this.supportsGzip = false;
        this.init();
    }
    
    init() {
        this.detectCompressionSupport();
        this.trackEvent('compression_initialized');
    }
    
    detectCompressionSupport() {
        // Check Accept-Encoding header support
        const acceptEncoding = navigator.userAgent.includes('Chrome') || 
                              navigator.userAgent.includes('Firefox') ||
                              navigator.userAgent.includes('Safari');
        
        // Modern browsers support both
        this.supportsBrotli = acceptEncoding;
        this.supportsGzip = true; // All modern browsers support gzip
        
        // Set preferred encoding
        this.preferredEncoding = this.supportsBrotli ? 'br' : 'gzip';
    }
    
    getAcceptEncoding() {
        if (this.supportsBrotli) {
            return 'br, gzip, deflate';
        }
        return 'gzip, deflate';
    }
    
    async compressData(data, encoding = 'gzip') {
        // Client-side compression for large payloads
        if (!window.CompressionStream) {
            return data; // Fallback if not supported
        }
        
        try {
            const stream = new CompressionStream(encoding);
            const blob = new Blob([data]);
            const compressedStream = blob.stream().pipeThrough(stream);
            return await new Response(compressedStream).blob();
        } catch (e) {
            console.warn('Compression failed:', e);
            return data;
        }
    }
    
    async decompressData(compressedData, encoding = 'gzip') {
        if (!window.DecompressionStream) {
            return compressedData;
        }
        
        try {
            const stream = new DecompressionStream(encoding);
            const blob = new Blob([compressedData]);
            const decompressedStream = blob.stream().pipeThrough(stream);
            return await new Response(decompressedStream).blob();
        } catch (e) {
            console.warn('Decompression failed:', e);
            return compressedData;
        }
    }
    
    optimizeRequestHeaders(headers = {}) {
        // Add compression headers to requests
        return {
            ...headers,
            'Accept-Encoding': this.getAcceptEncoding()
        };
    }
    
    checkResponseCompression(response) {
        const contentEncoding = response.headers.get('Content-Encoding');
        return {
            compressed: !!contentEncoding,
            encoding: contentEncoding,
            size: parseInt(response.headers.get('Content-Length') || '0'),
            originalSize: this.estimateOriginalSize(response, contentEncoding)
        };
    }
    
    estimateOriginalSize(response, encoding) {
        const compressedSize = parseInt(response.headers.get('Content-Length') || '0');
        if (encoding === 'br') {
            return compressedSize * 3; // Brotli typically 30-40% compression
        } else if (encoding === 'gzip') {
            return compressedSize * 2.5; // Gzip typically 40-50% compression
        }
        return compressedSize;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`compression_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.compressionGzipBrotli = new CompressionGzipBrotli(); });
} else {
    window.compressionGzipBrotli = new CompressionGzipBrotli();
}

