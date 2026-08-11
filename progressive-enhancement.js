/**
 * Progressive Enhancement
 * Implements progressive enhancement strategy
 */

class ProgressiveEnhancement {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkFeatureSupport();
        this.applyEnhancements();
    }
    
    checkFeatureSupport() {
        // Check browser feature support
        this.supports = {
            serviceWorker: 'serviceWorker' in navigator,
            webp: this.checkWebPSupport(),
            intersectionObserver: 'IntersectionObserver' in window,
            fetch: 'fetch' in window
        };
    }
    
    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    
    applyEnhancements() {
        // Apply enhancements based on support
        if (this.supports.serviceWorker) {
            this.enableServiceWorker();
        }
        
        if (this.supports.intersectionObserver) {
            this.enableLazyLoading();
        }
        
        // Always provide fallbacks
        this.provideFallbacks();
    }
    
    enableServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    }
    
    enableLazyLoading() {
        // Enable lazy loading if supported
    }
    
    provideFallbacks() {
        // Provide fallbacks for unsupported features
        if (!this.supports.fetch) {
            // Use XMLHttpRequest fallback
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.progressiveEnhancement = new ProgressiveEnhancement(); });
} else {
    window.progressiveEnhancement = new ProgressiveEnhancement();
}

