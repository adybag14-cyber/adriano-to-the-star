/**
 * Threat Intelligence
 * Threat intelligence system
 */

class ThreatIntelligence {
    constructor() {
        this.intelligence = new Map();
        this.feeds = new Map();
        this.indicators = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_hr_ea_ti_nt_el_li_ge_nc_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_hr_ea_ti_nt_el_li_ge_nc_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async subscribeFeed(feedId, feedData) {
        const feed = {
            id: feedId,
            ...feedData,
            name: feedData.name || feedId,
            source: feedData.source || '',
            status: 'subscribed',
            createdAt: new Date()
        };
        
        this.feeds.set(feedId, feed);
        return feed;
    }

    async addIndicator(indicatorId, indicatorData) {
        const indicator = {
            id: indicatorId,
            ...indicatorData,
            type: indicatorData.type || 'ip',
            value: indicatorData.value || '',
            threatLevel: indicatorData.threatLevel || 'medium',
            status: 'active',
            createdAt: new Date()
        };

        this.indicators.set(indicatorId, indicator);
        return indicator;
    }

    async check(indicatorValue) {
        const indicator = Array.from(this.indicators.values())
            .find(i => i.value === indicatorValue);

        return {
            indicatorValue,
            found: !!indicator,
            threatLevel: indicator ? indicator.threatLevel : 'none',
            timestamp: new Date()
        };
    }

    getFeed(feedId) {
        return this.feeds.get(feedId);
    }

    getAllFeeds() {
        return Array.from(this.feeds.values());
    }
}

module.exports = ThreatIntelligence;

