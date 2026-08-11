/**
 * Oracle Integration
 * Blockchain oracle integration
 */

class OracleIntegration {
    constructor() {
        this.oracles = new Map();
        this.feeds = new Map();
        this.init();
    }

    init() {
        this.trackEvent('o_ra_cl_ei_nt_eg_ra_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("o_ra_cl_ei_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerOracle(oracleId, oracleData) {
        const oracle = {
            id: oracleId,
            ...oracleData,
            name: oracleData.name || oracleId,
            type: oracleData.type || 'price',
            enabled: oracleData.enabled !== false,
            createdAt: new Date()
        };
        
        this.oracles.set(oracleId, oracle);
        console.log(`Oracle registered: ${oracleId}`);
        return oracle;
    }

    createFeed(feedId, feedData) {
        const feed = {
            id: feedId,
            ...feedData,
            oracleId: feedData.oracleId,
            pair: feedData.pair || 'ETH/USD',
            value: feedData.value || 0,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.feeds.set(feedId, feed);
        console.log(`Oracle feed created: ${feedId}`);
        return feed;
    }

    async updateFeed(feedId, value) {
        const feed = this.feeds.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        
        feed.value = value;
        feed.timestamp = new Date();
        feed.updatedAt = new Date();
        
        return feed;
    }

    getLatestValue(oracleId, pair) {
        const feed = Array.from(this.feeds.values())
            .find(f => f.oracleId === oracleId && f.pair === pair);
        
        if (!feed) {
            throw new Error('Feed not found');
        }
        
        return {
            pair: feed.pair,
            value: feed.value,
            timestamp: feed.timestamp
        };
    }

    getOracle(oracleId) {
        return this.oracles.get(oracleId);
    }

    getFeed(feedId) {
        return this.feeds.get(feedId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.oracleIntegration = new OracleIntegration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OracleIntegration;
}


