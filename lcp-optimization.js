/**
 * LCP (Largest Contentful Paint) Optimization
 * Optimizes the largest contentful paint metric
 */

class LCPOptimization {
    constructor() {
        this.lcpElement = null;
        this.init();
    }
    
    init() {
        this.identifyLCPElement();
        this.optimizeLCP();
    }
    
    identifyLCPElement() {
        // Identify potential LCP elements
        const candidates = [
            ...document.querySelectorAll('img'),
            ...document.querySelectorAll('video'),
            ...document.querySelectorAll('[style*="background-image"]'),
            document.querySelector('h1'),
            document.querySelector('main')
        ];
        
        // Find the largest element
        let maxSize = 0;
        candidates.forEach(element => {
            const rect = element.getBoundingClientRect();
            const size = rect.width * rect.height;
            if (size > maxSize) {
                maxSize = size;
                this.lcpElement = element;
            }
        });
    }
    
    optimizeLCP() {
        if (!this.lcpElement) return;
        
        // Preload LCP element
        if (this.lcpElement.tagName === 'IMG') {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = this.lcpElement.src || this.lcpElement.getAttribute('data-src');
            document.head.appendChild(link);
            
            // Ensure image is loaded
            if (this.lcpElement.loading !== 'eager') {
                this.lcpElement.loading = 'eager';
            }
        }
        
        // Add fetchpriority
        if (this.lcpElement.tagName === 'IMG') {
            this.lcpElement.fetchPriority = 'high';
        }
        
        // Optimize font loading for text LCP
        if (this.lcpElement.tagName === 'H1' || this.lcpElement.tagName === 'MAIN') {
            this.preloadFonts();
        }
    }
    
    preloadFonts() {
        const fontFamilies = getComputedStyle(this.lcpElement).fontFamily;
        // Extract and preload fonts
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        // Add font URL here
        document.head.appendChild(link);
    }
    
    async measureLCP() {
        if ('PerformanceObserver' in window) {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve({
                        value: lastEntry.renderTime || lastEntry.loadTime,
                        element: lastEntry.element
                    });
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            });
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.lcpOptimization = new LCPOptimization(); });
} else {
    window.lcpOptimization = new LCPOptimization();
}

