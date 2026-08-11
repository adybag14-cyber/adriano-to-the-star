/**
 * Mobile Image Optimization (Advanced)
 * Advanced mobile image optimization
 */

class MobileImageOptimizationAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeImagesForMobile();
    }
    
    optimizeImagesForMobile() {
        // Use responsive images with mobile-optimized sizes
        document.querySelectorAll('img').forEach(img => {
            if (!img.srcset) {
                const src = img.src;
                if (src) {
                    img.srcset = `
                        ${src}?w=300 300w,
                        ${src}?w=600 600w,
                        ${src}?w=900 900w
                    `.trim();
                    img.sizes = '(max-width: 300px) 300px, (max-width: 600px) 600px, 900px';
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.mobileImageOptimizationAdvanced = new MobileImageOptimizationAdvanced(); });
} else {
    window.mobileImageOptimizationAdvanced = new MobileImageOptimizationAdvanced();
}

