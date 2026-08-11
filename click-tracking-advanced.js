/**
 * Click Tracking (Advanced)
 * Advanced click tracking
 */

class ClickTrackingAdvanced {
    constructor() {
        this.clicks = [];
        this.init();
    }
    
    init() {
        this.setupClickTracking();
        this.trackEvent('click_track_adv_initialized');
    }
    
    setupClickTracking() {
        // Track all clicks
        document.addEventListener('click', (e) => {
            this.trackClick(e);
        }, true);
    }
    
    trackClick(event) {
        // Track click
        const click = {
            target: event.target.tagName,
            id: event.target.id,
            className: event.target.className,
            text: event.target.textContent?.substring(0, 50),
            x: event.clientX,
            y: event.clientY,
            page: window.location.pathname,
            timestamp: Date.now()
        };
        
        this.clicks.push(click);
        
        // Keep only last 1000 clicks
        if (this.clicks.length > 1000) {
            this.clicks.shift();
        }
    }
    
    async getClickStats() {
        // Get click statistics
        const stats = {
            total: this.clicks.length,
            byElement: {},
            byPage: {},
            topTargets: []
        };
        
        this.clicks.forEach(click => {
            stats.byElement[click.target] = (stats.byElement[click.target] || 0) + 1;
            stats.byPage[click.page] = (stats.byPage[click.page] || 0) + 1;
        });
        
        stats.topTargets = Object.entries(stats.byElement)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([element, count]) => ({ element, count }));
        
        return stats;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`click_track_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.clickTrackingAdvanced = new ClickTrackingAdvanced(); });
} else {
    window.clickTrackingAdvanced = new ClickTrackingAdvanced();
}

