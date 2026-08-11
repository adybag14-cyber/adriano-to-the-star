/**
 * API Rate Limiting - Sliding Window
 * Sliding window algorithm for rate limiting
 */

class APIRateLimitingSlidingWindow {
    constructor() {
        this.windows = new Map();
        this.init();
    }

    init() {
        this.trackEvent('sliding_window_initialized');
    }

    createWindow(windowId, limit, windowSize) {
        const window = {
            id: windowId,
            limit,
            windowSize, // milliseconds
            requests: [],
            stats: {
                totalRequests: 0,
                allowed: 0,
                rejected: 0
            },
            createdAt: new Date()
        };
        
        this.windows.set(windowId, window);
        this.trackEvent('window_created', { windowId });
        return window;
    }

    isAllowed(windowId) {
        const window = this.windows.get(windowId);
        if (!window) {
            throw new Error('Window does not exist');
        }
        
        const now = Date.now();
        const cutoff = now - window.windowSize;
        
        // Remove old requests outside the window
        window.requests = window.requests.filter(timestamp => timestamp > cutoff);
        
        window.stats.totalRequests++;
        
        if (window.requests.length < window.limit) {
            window.requests.push(now);
            window.stats.allowed++;
            console.log(`Request allowed in window: ${windowId}, count: ${window.requests.length}/${window.limit}`);
            return { allowed: true, remaining: window.limit - window.requests.length };
        } else {
            window.stats.rejected++;
            console.log(`Request rejected in window: ${windowId}, limit reached`);
            return { allowed: false, remaining: 0 };
        }
    }

    getWindowStats(windowId) {
        const window = this.windows.get(windowId);
        if (!window) {
            throw new Error('Window does not exist');
        }
        
        const now = Date.now();
        const cutoff = now - window.windowSize;
        window.requests = window.requests.filter(timestamp => timestamp > cutoff);
        
        return {
            id: window.id,
            limit: window.limit,
            current: window.requests.length,
            remaining: window.limit - window.requests.length,
            windowSize: window.windowSize,
            stats: window.stats
        };
    }

    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sliding_window_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRateLimitingSlidingWindow = new APIRateLimitingSlidingWindow();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRateLimitingSlidingWindow;
}

