/**
 * Resource Bundling
 * Optimizes resource bundling for better performance
 */

class ResourceBundling {
    constructor() {
        this.init();
    }
    
    init() {
        // Resource bundling is typically done at build time
        // This provides runtime optimization
        this.optimizeBundleLoading();
    }
    
    optimizeBundleLoading() {
        // Load bundles in optimal order
        this.loadCriticalBundlesFirst();
    }
    
    loadCriticalBundlesFirst() {
        // Prioritize critical bundles
        const criticalBundles = document.querySelectorAll('script[data-critical]');
        criticalBundles.forEach(script => {
            script.setAttribute('fetchpriority', 'high');
        });
    }
    
    async loadBundle(bundleName) {
        // Dynamically load bundle
        return import(`/bundles/${bundleName}.js`);
    }
    
    splitBundlesByRoute() {
        // Split bundles by route for code splitting
        // This would typically be done at build time
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.resourceBundling = new ResourceBundling(); });
} else {
    window.resourceBundling = new ResourceBundling();
}

