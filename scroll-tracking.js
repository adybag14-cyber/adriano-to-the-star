/**
 * Scroll Tracking
 * Tracks user scrolling behavior
 */

class ScrollTracking {
    constructor() {
        this.scrolls = [];
        this.init();
    }

    init() {
        this.trackEvent('s_cr_ol_lt_ra_ck_in_g_initialized');
        this.setupTracking();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_cr_ol_lt_ra_ck_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupTracking() {
        let lastScrollTop = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollDepth = (scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                
                this.trackScroll({
                    scrollTop,
                    scrollDepth: Math.round(scrollDepth),
                    direction: scrollTop > lastScrollTop ? 'down' : 'up',
                    pageHeight: document.documentElement.scrollHeight,
                    viewportHeight: window.innerHeight,
                    url: window.location.href,
                    timestamp: new Date()
                });
                
                lastScrollTop = scrollTop;
            }, 100);
        });
    }

    trackScroll(scrollData) {
        this.scrolls.push(scrollData);
        
        // Limit storage
        if (this.scrolls.length > 5000) {
            this.scrolls.shift();
        }
    }

    getScrollStats() {
        const depths = this.scrolls.map(s => s.scrollDepth);
        const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length || 0;
        const maxDepth = Math.max(...depths, 0);
        
        return {
            total: this.scrolls.length,
            averageDepth: Math.round(avgDepth),
            maxDepth: Math.round(maxDepth),
            scrollDistribution: this.getScrollDistribution()
        };
    }

    getScrollDistribution() {
        const distribution = {
            '0-25': 0,
            '25-50': 0,
            '50-75': 0,
            '75-100': 0
        };
        
        this.scrolls.forEach(scroll => {
            if (scroll.scrollDepth < 25) distribution['0-25']++;
            else if (scroll.scrollDepth < 50) distribution['25-50']++;
            else if (scroll.scrollDepth < 75) distribution['50-75']++;
            else distribution['75-100']++;
        });
        
        return distribution;
    }
}

// Auto-initialize
const scrollTracking = new ScrollTracking();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollTracking;
}


