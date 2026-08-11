/**
 * Performance Analytics (Advanced)
 * Advanced performance analytics and reporting
 */

class PerformanceAnalyticsAdvanced {
    constructor() {
        this.analytics = [];
        this.init();
    }
    
    init() {
        this.startAnalytics();
    }
    
    startAnalytics() {
        // Collect performance analytics
        window.addEventListener('load', () => {
            this.collectAnalytics();
        });
    }
    
    collectAnalytics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        
        const analytics = {
            pageLoad: navigation ? navigation.loadEventEnd - navigation.navigationStart : null,
            resourceCount: resources.length,
            resourceSizes: resources.map(r => ({
                name: r.name,
                size: r.transferSize || 0,
                duration: r.duration
            })),
            timestamp: Date.now()
        };
        
        this.analytics.push(analytics);
        
        // Send to analytics service
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Performance Analytics', analytics);
        }
    }
    
    getAnalytics() {
        return [...this.analytics];
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.performanceAnalyticsAdvanced = new PerformanceAnalyticsAdvanced(); });
} else {
    window.performanceAnalyticsAdvanced = new PerformanceAnalyticsAdvanced();
}

