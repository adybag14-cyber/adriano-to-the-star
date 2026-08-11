/**
 * Font Loading Optimization
 * Optimizes font loading for performance
 */

class FontLoadingOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeFonts();
    }
    
    optimizeFonts() {
        document.querySelectorAll('link[rel="stylesheet"][href*="font"]').forEach(link => {
            link.setAttribute('media', 'print');
            link.setAttribute('onload', "this.media='all'");
            
            const noscript = document.createElement('noscript');
            const fallback = link.cloneNode(true);
            fallback.removeAttribute('onload');
            fallback.setAttribute('media', 'all');
            noscript.appendChild(fallback);
            link.parentElement.insertBefore(noscript, link.nextSibling);
        });
        
        // Preload font files
        const fonts = [
            'https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrFb.woff2'
        ];
        
        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = font;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.fontLoadingOptimization = new FontLoadingOptimization(); });
} else {
    window.fontLoadingOptimization = new FontLoadingOptimization();
}


