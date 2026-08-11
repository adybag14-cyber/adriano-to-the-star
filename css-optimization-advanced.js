/**
 * CSS Optimization (Advanced)
 * Advanced CSS optimization techniques
 */

class CSSOptimizationAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeCSSLoading();
        this.removeUnusedCSS();
    }
    
    optimizeCSSLoading() {
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
        // Extract and inline critical CSS
        const criticalCSS = `
            body { margin: 0; padding: 0; }
            .header { display: block; }
            .main { display: block; }
        `;
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
    }
    
    removeUnusedCSS() {
        // Remove unused CSS rules
        // This would typically be done at build time with tools like PurgeCSS
    }
    
    optimizeCSSSelectors() {
        // Optimize CSS selectors for better performance
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cssOptimizationAdvanced = new CSSOptimizationAdvanced(); });
} else {
    window.cssOptimizationAdvanced = new CSSOptimizationAdvanced();
}

