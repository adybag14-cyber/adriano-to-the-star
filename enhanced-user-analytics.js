/**
 * Enhanced User Behavior Analytics
 * More detailed tracking with heatmaps, scroll depth, click tracking, and user flow analysis
 */

class EnhancedUserAnalytics {
    constructor(baseAnalytics) {
        this.baseAnalytics = baseAnalytics || window.userBehaviorAnalytics;
        this.heatmapData = [];
        this.scrollDepth = 0;
        this.clickMap = new Map();
        this.timeOnPage = 0;
        this.interactionCount = 0;
        this.formInteractions = [];
        this.searchQueries = [];
        this.userFlow = [];
        this.init();
    }

    init() {
        // Check if tracking is enabled
        if (localStorage.getItem('analytics-opt-out') === 'true') {
            return;
        }

        // Track scroll depth
        this.trackScrollDepth();
        
        // Track clicks for heatmap
        this.trackClicks();
        
        // Track time on page
        this.trackTimeOnPage();
        
        // Track form interactions
        this.trackFormInteractions();
        
        // Track search queries
        this.trackSearchQueries();
        
        // Track user flow
        this.trackUserFlow();
        
        // Track mouse movements (optional, for heatmap)
        this.trackMouseMovements();
        
        // Track focus/blur events
        this.trackFocusEvents();
        
        console.log('✅ Enhanced User Analytics initialized');
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        let maxScroll = 0;
        const scrollThresholds = [25, 50, 75, 90, 100];
        const reachedThresholds = new Set();

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            // Track when thresholds are reached
            scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !reachedThresholds.has(threshold)) {
                    reachedThresholds.add(threshold);
                    this.recordEvent('scroll', 'depth', `${threshold}%`, Math.round(scrollPercent));
                }
            });
        }, { passive: true });

        // Record final scroll depth on page unload
        window.addEventListener('beforeunload', () => {
            this.scrollDepth = maxScroll;
            this.recordEvent('scroll', 'max_depth', null, Math.round(maxScroll));
        });
    }

    /**
     * Track clicks for heatmap
     */
    trackClicks() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            const element = {
                tag: target.tagName.toLowerCase(),
                id: target.id || null,
                className: target.className || null,
                text: target.textContent?.substring(0, 50) || null,
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now()
            };

            // Store click data
            const key = `${element.tag}-${element.id || element.className || 'no-id'}`;
            const count = this.clickMap.get(key) || 0;
            this.clickMap.set(key, count + 1);

            // Add to heatmap data
            this.heatmapData.push({
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now()
            });

            // Keep only last 1000 clicks
            if (this.heatmapData.length > 1000) {
                this.heatmapData.shift();
            }

            // Record click event
            this.recordEvent('click', element.tag, element.id || element.className, null);
        }, { passive: true });
    }

    /**
     * Track time on page
     */
    trackTimeOnPage() {
        const startTime = Date.now();
        
        // Update every 10 seconds
        const interval = setInterval(() => {
            this.timeOnPage = Math.floor((Date.now() - startTime) / 1000);
        }, 10000);

        // Record on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(interval);
            this.timeOnPage = Math.floor((Date.now() - startTime) / 1000);
            this.recordEvent('engagement', 'time_on_page', null, this.timeOnPage);
        });
    }

    /**
     * Track form interactions
     */
    trackFormInteractions() {
        document.addEventListener('focusin', (event) => {
            const target = event.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                this.formInteractions.push({
                    type: 'focus',
                    field: target.name || target.id || target.type,
                    form: target.form?.id || target.closest('form')?.id || 'unknown',
                    timestamp: Date.now()
                });
            }
        }, true);

        document.addEventListener('focusout', (event) => {
            const target = event.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                const interaction = this.formInteractions.find(i => 
                    i.field === (target.name || target.id || target.type) && 
                    i.type === 'focus'
                );
                
                if (interaction) {
                    interaction.duration = Date.now() - interaction.timestamp;
                    interaction.type = 'complete';
                }
            }
        }, true);
    }

    /**
     * Track search queries
     */
    trackSearchQueries() {
        // Monitor search inputs
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i], input[name*="search" i]');
        
        searchInputs.forEach(input => {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && input.value.trim()) {
                    this.searchQueries.push({
                        query: input.value.trim(),
                        timestamp: Date.now(),
                        page: window.location.pathname
                    });
                    
                    this.recordEvent('search', 'query', input.value.trim(), null);
                }
            });
        });
    }

    /**
     * Track user flow
     */
    trackUserFlow() {
        const currentPage = {
            page: window.location.pathname,
            entryTime: Date.now(),
            exitTime: null,
            interactions: []
        };

        this.userFlow.push(currentPage);

        // Track navigation
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href) {
                const targetUrl = new URL(link.href);
                if (targetUrl.origin === window.location.origin) {
                    currentPage.exitTime = Date.now();
                    currentPage.nextPage = targetUrl.pathname;
                    this.recordEvent('navigation', 'internal_link', targetUrl.pathname, null);
                } else if (targetUrl.origin !== window.location.origin) {
                    this.recordEvent('navigation', 'external_link', targetUrl.hostname, null);
                }
            }
        }, { passive: true });
    }

    /**
     * Track mouse movements (for heatmap)
     */
    trackMouseMovements() {
        const movementData = [];
        let lastRecordedTime = Date.now();

        document.addEventListener('mousemove', (event) => {
            // Only record every 100ms to reduce data
            if (Date.now() - lastRecordedTime < 100) return;
            
            lastRecordedTime = Date.now();
            
            movementData.push({
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now()
            });

            // Keep only last 500 movements
            if (movementData.length > 500) {
                movementData.shift();
            }
        }, { passive: true });

        // Store movement data periodically
        setInterval(() => {
            if (movementData.length > 0) {
                // This could be used for heatmap visualization
                // For now, we just store it
            }
        }, 5000);
    }

    /**
     * Track focus/blur events
     */
    trackFocusEvents() {
        let focusStartTime = Date.now();
        let isFocused = true;

        window.addEventListener('focus', () => {
            if (!isFocused) {
                const awayTime = Date.now() - focusStartTime;
                this.recordEvent('engagement', 'returned_to_page', null, Math.floor(awayTime / 1000));
            }
            isFocused = true;
            focusStartTime = Date.now();
        });

        window.addEventListener('blur', () => {
            if (isFocused) {
                const activeTime = Date.now() - focusStartTime;
                this.recordEvent('engagement', 'left_page', null, Math.floor(activeTime / 1000));
            }
            isFocused = false;
            focusStartTime = Date.now();
        });
    }

    /**
     * Record event to base analytics
     */
    recordEvent(category, action, label, value) {
        if (this.baseAnalytics && this.baseAnalytics.trackEvent) {
            this.baseAnalytics.trackEvent(category, action, label, value);
        }
        this.interactionCount++;
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            scrollDepth: Math.round(this.scrollDepth),
            timeOnPage: this.timeOnPage,
            interactionCount: this.interactionCount,
            clickCount: this.clickMap.size,
            topClicks: Array.from(this.clickMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([key, count]) => ({ element: key, clicks: count })),
            formInteractions: this.formInteractions.length,
            searchQueries: this.searchQueries.length,
            userFlow: this.userFlow,
            heatmapData: this.heatmapData.slice(-100) // Last 100 clicks
        };
    }

    /**
     * Export analytics data
     */
    exportData() {
        const data = {
            exported: new Date().toISOString(),
            summary: this.getSummary(),
            formInteractions: this.formInteractions,
            searchQueries: this.searchQueries,
            userFlow: this.userFlow
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize globally
let enhancedAnalyticsInstance = null;

function initEnhancedAnalytics() {
    if (!enhancedAnalyticsInstance && window.userBehaviorAnalytics) {
        enhancedAnalyticsInstance = new EnhancedUserAnalytics(window.userBehaviorAnalytics);
    }
    return enhancedAnalyticsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for base analytics to initialize
        setTimeout(initEnhancedAnalytics, 1000);
    });
} else {
    setTimeout(initEnhancedAnalytics, 1000);
}

// Export globally
window.EnhancedUserAnalytics = EnhancedUserAnalytics;
window.enhancedAnalytics = () => enhancedAnalyticsInstance;

