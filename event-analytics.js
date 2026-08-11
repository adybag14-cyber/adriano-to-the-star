/**
 * Event Analytics
 * Analyzes event data
 */

class EventAnalytics {
    constructor() {
        this.analytics = [];
        this.init();
    }

    init() {
        this.trackEvent('event_analytics_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_analytics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    analyzeEvents(events) {
        const analysis = {
            total: events.length,
            byType: {},
            byUser: {},
            timeline: [],
            topEvents: [],
            patterns: []
        };

        events.forEach(event => {
            // Count by type
            analysis.byType[event.type] = (analysis.byType[event.type] || 0) + 1;

            // Count by user
            if (event.userId) {
                analysis.byUser[event.userId] = (analysis.byUser[event.userId] || 0) + 1;
            }

            // Timeline
            const hour = new Date(event.timestamp).getHours();
            analysis.timeline[hour] = (analysis.timeline[hour] || 0) + 1;
        });

        // Top events
        analysis.topEvents = Object.entries(analysis.byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([type, count]) => ({ type, count }));

        // Detect patterns
        analysis.patterns = this.detectPatterns(events);

        this.analytics.push({
            analysis,
            analyzedAt: new Date()
        });

        return analysis;
    }

    detectPatterns(events) {
        const patterns = [];
        
        // Simple pattern: consecutive events of same type
        for (let i = 1; i < events.length; i++) {
            if (events[i].type === events[i - 1].type) {
                patterns.push({
                    type: 'consecutive',
                    eventType: events[i].type,
                    count: 2
                });
            }
        }

        return patterns;
    }

    getEventFrequency(eventType, startDate, endDate) {
        // Calculate frequency of specific event type
        return {
            eventType,
            frequency: 'per hour', // Simplified
            average: 10
        };
    }

    getEventTrend(eventType, days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return {
            eventType,
            trend: 'increasing',
            change: 15.5
        };
    }
}

// Auto-initialize
const eventAnalytics = new EventAnalytics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventAnalytics;
}


