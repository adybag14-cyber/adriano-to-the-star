/**
 * Image Optimization Pipeline
 * Optimizes images for web delivery
 */

class ImageOptimizationPipeline {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeImages();
    }
    
    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('data-optimized')) {
                img.setAttribute('data-optimized', 'true');
                
                // Lazy load if not already
                if (!img.loading) {
                    img.loading = 'lazy';
                }
                
                // Add responsive srcset if not present
                if (!img.srcset && img.src) {
                    this.addResponsiveSrcset(img);
                }
            }
        });
    }
    
    addResponsiveSrcset(img) {
        const src = img.src;
        if (src) {
            // Generate srcset for different sizes
            img.srcset = `
                ${src}?w=400 400w,
                ${src}?w=800 800w,
                ${src}?w=1200 1200w
            `.trim();
            img.sizes = '(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.imageOptimizationPipeline = new ImageOptimizationPipeline(); });
} else {
    window.imageOptimizationPipeline = new ImageOptimizationPipeline();
}


