/**
 * Gamification Analytics v2
 * Advanced analytics for gamification systems
 */

class GamificationAnalyticsV2 {
    constructor() {
        this.dataPoints = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('gamification_analytics_v2_initialized');
        return { success: true, message: 'Gamification Analytics v2 initialized' };
    }

    logInteraction(userId, feature, outcome) {
        const point = {
            userId,
            feature,
            outcome,
            timestamp: new Date()
        };
        this.dataPoints.push(point);
        this.trackEvent('interaction_logged', { userId, feature, outcome });
    }

    getReport(feature) {
        const filtered = this.dataPoints.filter(p => p.feature === feature);
        return {
            feature,
            totalInteractions: filtered.length,
            uniqueUsers: new Set(filtered.map(p => p.userId)).size
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`gamification_analytics_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'gamification_analytics_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.GamificationAnalyticsV2 = GamificationAnalyticsV2;
    window.gamificationAnalyticsV2 = new GamificationAnalyticsV2();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamificationAnalyticsV2;
}
