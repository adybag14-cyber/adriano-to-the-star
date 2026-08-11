/**
 * Click Tracking
 * Tracks user clicks throughout the application
 */

class ClickTracking {
    constructor() {
        this.clicks = [];
        this.init();
    }

    init() {
        this.setupTracking();
        this.trackEvent('click_track_initialized');
    }

    setupTracking() {
        document.addEventListener('click', (e) => {
            this.trackClick({
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName,
                id: e.target.id,
                className: e.target.className,
                text: e.target.textContent?.substring(0, 50),
                url: window.location.href,
                timestamp: new Date()
            });
        });
    }

    trackClick(clickData) {
        this.clicks.push(clickData);
        
        // Limit storage
        if (this.clicks.length > 10000) {
            this.clicks.shift();
        }
    }

    getClicks(filter = {}) {
        let filtered = this.clicks;
        
        if (filter.target) {
            filtered = filtered.filter(c => c.target === filter.target);
        }
        
        if (filter.startDate && filter.endDate) {
            filtered = filtered.filter(c => 
                c.timestamp >= filter.startDate && 
                c.timestamp <= filter.endDate
            );
        }
        
        return filtered;
    }

    getClickStats() {
        const stats = {
            total: this.clicks.length,
            byTarget: {},
            byPage: {},
            recent: this.clicks.slice(-100)
        };
        
        this.clicks.forEach(click => {
            stats.byTarget[click.target] = (stats.byTarget[click.target] || 0) + 1;
            const page = new URL(click.url).pathname;
            stats.byPage[page] = (stats.byPage[page] || 0) + 1;
        });
        
        return stats;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`click_track_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const clickTracking = new ClickTracking();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClickTracking;
}


