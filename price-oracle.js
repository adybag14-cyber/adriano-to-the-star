/**
 * Price Oracle
 * Cryptocurrency price oracle
 */

class PriceOracle {
    constructor() {
        this.oracles = new Map();
        this.prices = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ri_ce_or_ac_le_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ri_ce_or_ac_le_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerOracle(oracleId, oracleData) {
        const oracle = {
            id: oracleId,
            ...oracleData,
            name: oracleData.name || oracleId,
            source: oracleData.source || 'aggregated',
            enabled: oracleData.enabled !== false,
            createdAt: new Date()
        };
        
        this.oracles.set(oracleId, oracle);
        console.log(`Price oracle registered: ${oracleId}`);
        return oracle;
    }

    async updatePrice(oracleId, pair, price) {
        const oracle = this.oracles.get(oracleId);
        if (!oracle) {
            throw new Error('Oracle not found');
        }
        
        const priceRecord = {
            id: `price_${Date.now()}`,
            oracleId,
            pair,
            price,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.prices.set(priceRecord.id, priceRecord);
        
        return priceRecord;
    }

    getPrice(oracleId, pair) {
        const oracle = this.oracles.get(oracleId);
        if (!oracle) {
            throw new Error('Oracle not found');
        }
        
        const price = Array.from(this.prices.values())
            .filter(p => p.oracleId === oracleId && p.pair === pair)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (!price) {
            throw new Error('Price not found');
        }
        
        return {
            pair: price.pair,
            price: price.price,
            timestamp: price.timestamp
        };
    }

    getOracle(oracleId) {
        return this.oracles.get(oracleId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.priceOracle = new PriceOracle();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceOracle;
}


