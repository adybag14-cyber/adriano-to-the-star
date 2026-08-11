/**
 * Font Optimization (Advanced)
 * Advanced font loading and optimization strategies
 */

class FontOptimizationAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeFontLoading();
        this.preloadCriticalFonts();
    }
    
    optimizeFontLoading() {
        // Use font-display: swap
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
        
        // Preload critical fonts
        this.preloadCriticalFonts();
    }
    
    preloadCriticalFonts() {
        const criticalFonts = [
            '/fonts/main.woff2',
            '/fonts/heading.woff2'
        ];
        
        criticalFonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.href = font;
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    async loadFont(fontFamily, fontUrl) {
        // Load font with fallback
        const font = new FontFace(fontFamily, `url(${fontUrl})`);
        await font.load();
        document.fonts.add(font);
    }
    
    optimizeFontSubsetting() {
        // Use font subsetting for smaller file sizes
        // This would typically be done at build time
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.fontOptimizationAdvanced = new FontOptimizationAdvanced(); });
} else {
    window.fontOptimizationAdvanced = new FontOptimizationAdvanced();
}

