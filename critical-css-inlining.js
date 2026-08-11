/**
 * Critical CSS Inlining
 * Inlines critical CSS for faster rendering
 */

class CriticalCSSInlining {
    constructor() {
        this.init();
    }
    
    init() {
        this.inlineCriticalCSS();
        this.trackEvent('critical_css_inlining_initialized');
    }
    
    inlineCriticalCSS() {
        const criticalCSS = `
            body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
            .header { background: #000; color: #fff; padding: 20px; }
            .main-content { padding: 20px; }
        `;
        
        const style = document.createElement('style');
        style.id = 'critical-css';
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`critical_css_inlining_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.criticalCSSInlining = new CriticalCSSInlining(); });
} else {
    window.criticalCSSInlining = new CriticalCSSInlining();
}


