/**
 * API Usage Analytics
 * Tracks and analyzes API usage
 */

class APIUsageAnalytics {
    constructor() {
        this.usage = [];
        this.init();
    }

    init() {
        this.trackEvent('usage_analytics_initialized');
    }

    trackUsage(apiKey, endpoint, method, duration) {
        this.usage.push({
            apiKey,
            endpoint,
            method,
            duration,
            timestamp: new Date()
        });
    }

    getUsageStats(apiKey, startDate, endDate) {
        return this.usage.filter(u => 
            u.apiKey === apiKey &&
            u.timestamp >= startDate &&
            u.timestamp <= endDate
        );
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`usage_analytics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiUsageAnalytics = new APIUsageAnalytics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIUsageAnalytics;
}

