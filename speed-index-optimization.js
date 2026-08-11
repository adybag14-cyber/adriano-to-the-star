/**
 * Speed Index Optimization
 * Optimizes Speed Index for faster perceived load time
 */

class SpeedIndexOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeAboveTheFold();
        this.prioritizeCriticalContent();
        this.optimizeProgressiveRendering();
    }
    
    optimizeAboveTheFold() {
        // Prioritize above-the-fold content
        const aboveFold = this.getAboveFoldElements();
        aboveFold.forEach(element => {
            // Preload above-fold resources
            if (element.tagName === 'IMG') {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = element.src;
                document.head.appendChild(link);
            }
        });
    }
    
    getAboveFoldElements() {
        // Get elements visible in viewport
        const viewportHeight = window.innerHeight;
        const elements = [];
        
        document.querySelectorAll('*').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < viewportHeight && rect.bottom > 0) {
                elements.push(element);
            }
        });
        
        return elements;
    }
    
    prioritizeCriticalContent() {
        // Load critical content first
        this.loadCriticalCSS();
        this.loadCriticalFonts();
        this.loadCriticalImages();
    }
    
    loadCriticalCSS() {
        // Inline critical CSS
        const criticalCSS = this.extractCriticalCSS();
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
    }
    
    extractCriticalCSS() {
        // Extract CSS for above-the-fold content
        return `
            body { margin: 0; }
            .header { display: block; }
            .hero { display: block; }
        `;
    }
    
    loadCriticalFonts() {
        // Preload critical fonts
        const fonts = ['/fonts/main.woff2', '/fonts/heading.woff2'];
        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.href = font;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    loadCriticalImages() {
        // Preload critical images
        document.querySelectorAll('img[data-critical]').forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src || img.getAttribute('data-src');
            document.head.appendChild(link);
        });
    }
    
    optimizeProgressiveRendering() {
        // Enable progressive rendering
        // Show content as it loads
        this.enableSkeletonScreens();
    }
    
    enableSkeletonScreens() {
        // Show skeleton screens while content loads
        document.querySelectorAll('[data-skeleton]').forEach(element => {
            element.classList.add('skeleton');
        });
    }
    
    async measureSpeedIndex() {
        // Speed Index measures how quickly content is visually displayed
        // This would typically be measured using Lighthouse or similar tools
        return {
            value: performance.now(),
            note: 'Speed Index is typically measured using Lighthouse'
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.speedIndexOptimization = new SpeedIndexOptimization(); });
} else {
    window.speedIndexOptimization = new SpeedIndexOptimization();
}

