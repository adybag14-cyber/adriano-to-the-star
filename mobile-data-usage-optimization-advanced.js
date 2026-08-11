/**
 * Mobile Data Usage Optimization (Advanced)
 * Optimizes data usage on mobile devices
 */

class MobileDataUsageOptimizationAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeDataUsage();
    }
    
    optimizeDataUsage() {
        // Check if user is on mobile data
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.saveData || connection.effectiveType === 'slow-2g') {
                this.enableDataSaverMode();
            }
        }
    }
    
    enableDataSaverMode() {
        // Enable data saver mode
        // Reduce image quality
        document.querySelectorAll('img').forEach(img => {
            if (img.src) {
                img.src = img.src.replace(/\.(jpg|png)$/i, '-low.$1');
            }
        });
        
        // Disable auto-play videos
        document.querySelectorAll('video[autoplay]').forEach(video => {
            video.removeAttribute('autoplay');
        });
        
        // Reduce font loading
        document.querySelectorAll('link[rel="stylesheet"][href*="font"]').forEach(link => {
            link.disabled = true;
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.mobileDataUsageOptimizationAdvanced = new MobileDataUsageOptimizationAdvanced(); });
} else {
    window.mobileDataUsageOptimizationAdvanced = new MobileDataUsageOptimizationAdvanced();
}

