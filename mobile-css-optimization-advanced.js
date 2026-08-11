/**
 * Mobile CSS Optimization (Advanced)
 * Advanced CSS optimization for mobile
 */

class MobileCSSOptimizationAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.optimizeCSSForMobile();
    }
    
    optimizeCSSForMobile() {
        // Load mobile-specific CSS
        const mobileCSS = document.createElement('link');
        mobileCSS.rel = 'stylesheet';
        mobileCSS.href = '/mobile.css';
        mobileCSS.media = '(max-width: 768px)';
        document.head.appendChild(mobileCSS);
        
        // Inline critical mobile CSS
        this.inlineCriticalMobileCSS();
    }
    
    inlineCriticalMobileCSS() {
        const criticalCSS = `
            body { margin: 0; padding: 0; }
            .mobile-header { display: block; }
        `;
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.mobileCSSOptimizationAdvanced = new MobileCSSOptimizationAdvanced(); });
} else {
    window.mobileCSSOptimizationAdvanced = new MobileCSSOptimizationAdvanced();
}

