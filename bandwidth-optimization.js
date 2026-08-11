/**
 * Bandwidth Optimization
 * Optimizes bandwidth usage for better performance
 */

class BandwidthOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeImageSizes();
        this.enableCompression();
        this.optimizeVideoQuality();
        this.trackEvent('bandwidth_initialized');
    }
    
    optimizeImageSizes() {
        // Use responsive images
        document.querySelectorAll('img').forEach(img => {
            if (!img.srcset) {
                this.addResponsiveSrcset(img);
            }
        });
    }
    
    addResponsiveSrcset(img) {
        const src = img.src;
        if (src) {
            img.srcset = `
                ${src}?w=400 400w,
                ${src}?w=800 800w,
                ${src}?w=1200 1200w
            `.trim();
            img.sizes = '(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px';
        }
    }
    
    enableCompression() {
        // Ensure compression is enabled
        // This is typically done server-side
    }
    
    optimizeVideoQuality() {
        // Adjust video quality based on connection
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Use lower quality video
                document.querySelectorAll('video').forEach(video => {
                    video.setAttribute('data-quality', 'low');
                });
            }
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bandwidth_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.bandwidthOptimization = new BandwidthOptimization(); });
} else {
    window.bandwidthOptimization = new BandwidthOptimization();
}

