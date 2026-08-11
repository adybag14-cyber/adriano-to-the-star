/**
 * Scroll Tracking (Advanced)
 * Advanced scroll tracking
 */

class ScrollTrackingAdvanced {
    constructor() {
        this.scrolls = [];
        this.maxScroll = 0;
        this.init();
    }
    
    init() {
        this.setupScrollTracking();
    }
    
    setupScrollTracking() {
        // Track scrolls
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const scrollPercent = (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            // Record significant scroll changes
            if (Math.abs(scrollY - lastScroll) > 100 || scrollPercent > this.maxScroll + 25) {
                this.trackScroll(scrollY, scrollPercent);
                lastScroll = scrollY;
                this.maxScroll = Math.max(this.maxScroll, scrollPercent);
            }
        });
    }
    
    trackScroll(y, percent) {
        // Track scroll
        this.scrolls.push({
            y,
            percent: percent.toFixed(2),
            page: window.location.pathname,
            timestamp: Date.now()
        });
    }
    
    async getScrollStats() {
        // Get scroll statistics
        return {
            totalScrolls: this.scrolls.length,
            maxScrollPercent: this.maxScroll.toFixed(2),
            averageScrollDepth: this.scrolls.length > 0 ?
                (this.scrolls.reduce((sum, s) => sum + parseFloat(s.percent), 0) / this.scrolls.length).toFixed(2) : 0
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.scrollTrackingAdvanced = new ScrollTrackingAdvanced(); });
} else {
    window.scrollTrackingAdvanced = new ScrollTrackingAdvanced();
}

