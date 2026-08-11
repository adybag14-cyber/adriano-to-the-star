/**
 * Resource Hints (preconnect, prefetch, preload)
 * Performance optimization with resource hints
 */

class ResourceHintsSystem {
    constructor() {
        this.hints = [];
        this.init();
    }
    
    init() {
        this.addCriticalHints();
    }
    
    addCriticalHints() {
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net',
            'https://*.supabase.co'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        // Preload critical resources
        const critical = ['styles.css', 'navigation.js', 'loader.js'];
        critical.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.resourceHintsSystem = new ResourceHintsSystem(); });
} else {
    window.resourceHintsSystem = new ResourceHintsSystem();
}


