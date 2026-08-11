/**
 * Resource Hints (Advanced)
 * Advanced resource hints (preload, prefetch, preconnect)
 */

class ResourceHintsAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.addPreconnects();
        this.addPrefetches();
        this.addPreloads();
    }
    
    addPreconnects() {
        // Preconnect to important domains
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdn.jsdelivr.net'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    addPrefetches() {
        // Prefetch likely next page resources
        const likelyPages = [
            '/planets',
            '/dashboard',
            '/profile'
        ];
        
        likelyPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });
    }
    
    addPreloads() {
        // Preload critical resources
        const critical = [
            { href: '/styles.css', as: 'style' },
            { href: '/main.js', as: 'script' },
            { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2' }
        ];
        
        critical.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.type) {
                link.type = resource.type;
            }
            if (resource.as === 'font') {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.resourceHintsAdvanced = new ResourceHintsAdvanced(); });
} else {
    window.resourceHintsAdvanced = new ResourceHintsAdvanced();
}

