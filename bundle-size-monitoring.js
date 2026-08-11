/**
 * Bundle Size Monitoring
 * Monitors and reports bundle sizes
 */

class BundleSizeMonitoring {
    constructor() {
        this.bundles = new Map();
        this.init();
    }
    
    init() {
        this.analyzeBundles();
        this.trackEvent('bundle_monitor_initialized');
    }
    
    analyzeBundles() {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        scripts.forEach(script => {
            const url = script.src;
            fetch(url, { method: 'HEAD' }).then(response => {
                const size = response.headers.get('content-length');
                if (size) {
                    this.bundles.set(url, {
                        size: parseInt(size),
                        sizeKB: (parseInt(size) / 1024).toFixed(2)
                    });
                }
            }).catch(() => {});
        });
    }
    
    getBundleReport() {
        const report = {
            totalBundles: this.bundles.size,
            totalSize: 0,
            bundles: []
        };
        
        this.bundles.forEach((info, url) => {
            report.totalSize += info.size;
            report.bundles.push({ url, ...info });
        });
        
        report.totalSizeKB = (report.totalSize / 1024).toFixed(2);
        return report;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bundle_monitor_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.bundleSizeMonitoring = new BundleSizeMonitoring(); });
} else {
    window.bundleSizeMonitoring = new BundleSizeMonitoring();
}


