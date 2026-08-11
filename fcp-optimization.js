/**
 * FCP (First Contentful Paint) Optimization
 * Optimizes first contentful paint for faster initial render
 */

class FCPOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeCriticalResources();
        this.minimizeRenderBlocking();
        this.optimizeCSS();
        this.optimizeFonts();
    }
    
    optimizeCriticalResources() {
        // Preload critical resources
        const criticalResources = [
            { href: '/styles.css', as: 'style' },
            { href: '/critical.css', as: 'style' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });
    }
    
    minimizeRenderBlocking() {
        // Inline critical CSS
        this.inlineCriticalCSS();
        
        // Defer non-critical CSS
        document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])').forEach(link => {
            link.media = 'print';
            link.onload = function() {
                this.media = 'all';
            };
        });
    }
    
    inlineCriticalCSS() {
        // Inline critical CSS in head
        const criticalCSS = `
            body { margin: 0; padding: 0; }
            .header { display: block; }
            .main { display: block; }
        `;
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
    }
    
    optimizeCSS() {
        // Remove unused CSS
        // Minify CSS
        // Split CSS by route
    }
    
    optimizeFonts() {
        // Use font-display: swap
        // Preload critical fonts
        // Use system fonts as fallback
    }
    
    async measureFCP() {
        if ('PerformanceObserver' in window) {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            resolve({ value: entry.startTime });
                        }
                    });
                });
                observer.observe({ entryTypes: ['paint'] });
            });
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.fcpOptimization = new FCPOptimization(); });
} else {
    window.fcpOptimization = new FCPOptimization();
}

