/**
 * Mobile-Specific Optimizations (Advanced)
 * Advanced mobile-specific performance optimizations
 */

class MobileSpecificOptimizationsAdvanced {
    constructor() {
        this.isMobile = false;
        this.init();
    }
    
    init() {
        this.detectMobile();
        if (this.isMobile) {
            this.applyMobileOptimizations();
        }
    }
    
    detectMobile() {
        this.isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent) ||
                       window.innerWidth < 768;
    }
    
    applyMobileOptimizations() {
        // Reduce image quality on mobile
        this.optimizeImagesForMobile();
        
        // Reduce JavaScript on mobile
        this.optimizeJavaScriptForMobile();
        
        // Optimize touch interactions
        this.optimizeTouchInteractions();
    }
    
    optimizeImagesForMobile() {
        // Use smaller images on mobile
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('data-mobile-optimized')) {
                // Add mobile-optimized srcset
                const src = img.src;
                if (src) {
                    img.srcset = `${src}?w=400 400w, ${src}?w=800 800w`;
                    img.sizes = '(max-width: 400px) 400px, 800px';
                    img.setAttribute('data-mobile-optimized', 'true');
                }
            }
        });
    }
    
    optimizeJavaScriptForMobile() {
        // Defer non-critical JavaScript on mobile
        document.querySelectorAll('script[src]:not([data-critical])').forEach(script => {
            script.defer = true;
        });
    }
    
    optimizeTouchInteractions() {
        // Use passive event listeners for better scroll performance
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.mobileSpecificOptimizationsAdvanced = new MobileSpecificOptimizationsAdvanced(); });
} else {
    window.mobileSpecificOptimizationsAdvanced = new MobileSpecificOptimizationsAdvanced();
}

