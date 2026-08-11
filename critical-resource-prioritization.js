/**
 * Critical Resource Prioritization
 * Prioritizes critical resources for faster loading
 */

class CriticalResourcePrioritization {
    constructor() {
        this.criticalResources = [];
        this.init();
    }
    
    init() {
        this.identifyCriticalResources();
        this.prioritizeResources();
        this.trackEvent('critical_res_initialized');
    }
    
    identifyCriticalResources() {
        // Identify critical resources
        this.criticalResources = [
            { type: 'stylesheet', selector: 'link[rel="stylesheet"][data-critical]' },
            { type: 'script', selector: 'script[data-critical]' },
            { type: 'font', selector: 'link[rel="preload"][as="font"]' },
            { type: 'image', selector: 'img[data-critical]' }
        ];
    }
    
    prioritizeResources() {
        // Set fetchpriority for critical resources
        this.criticalResources.forEach(resource => {
            document.querySelectorAll(resource.selector).forEach(element => {
                if (element.tagName === 'LINK' || element.tagName === 'SCRIPT') {
                    element.setAttribute('fetchpriority', 'high');
                }
            });
        });
    }
    
    preloadCriticalResources() {
        // Preload critical resources
        const critical = [
            '/styles.css',
            '/main.js',
            '/fonts/main.woff2'
        ];
        
        critical.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = url.endsWith('.css') ? 'style' : url.endsWith('.js') ? 'script' : 'font';
            document.head.appendChild(link);
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`critical_res_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.criticalResourcePrioritization = new CriticalResourcePrioritization(); });
} else {
    window.criticalResourcePrioritization = new CriticalResourcePrioritization();
}

