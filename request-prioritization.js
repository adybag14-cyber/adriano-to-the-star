/**
 * Request Prioritization
 * Prioritizes network requests for optimal loading
 */

class RequestPrioritization {
    constructor() {
        this.priorities = {
            critical: 1,
            high: 2,
            normal: 3,
            low: 4
        };
        this.init();
    }
    
    init() {
        this.setupPriorities();
    }
    
    setupPriorities() {
        // Set priorities for different resource types
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.hasAttribute('data-critical')) {
                link.setAttribute('fetchpriority', 'high');
            }
        });
        
        document.querySelectorAll('script').forEach(script => {
            if (script.hasAttribute('data-critical')) {
                script.setAttribute('fetchpriority', 'high');
            } else {
                script.setAttribute('fetchpriority', 'low');
            }
        });
    }
    
    prioritizeRequest(url, priority = 'normal') {
        // Set priority for request
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.setAttribute('fetchpriority', priority);
        document.head.appendChild(link);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.requestPrioritization = new RequestPrioritization(); });
} else {
    window.requestPrioritization = new RequestPrioritization();
}
