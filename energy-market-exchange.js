/**
 * Energy Market Exchange
 * High-fidelity interstellar energy trading floor
 */
class EnergyMarketExchange {
    constructor() {
        this.orders = [];
        this.pricePerMW = 0.05; // Base price in Credits
        this.volatility = 0.02;
    }

    submitOrder(type, amount, clientId) {
        const order = {
            id: `ord_${Date.now()}_${clientId}`,
            type, // BUY or SELL
            amount,
            price: this.pricePerMW,
            timestamp: new Date(),
            status: 'PENDING'
        };
        this.orders.push(order);
        this.processMarket();
        return order;
    }

    processMarket() {
        // Simple supply/demand price discovery
        const buyVolume = this.orders.filter(o => o.type === 'BUY').reduce((a, b) => a + b.amount, 0);
        const sellVolume = this.orders.filter(o => o.type === 'SELL').reduce((a, b) => a + b.amount, 0);
        
        const spread = (buyVolume - sellVolume) / 1000000;
        this.pricePerMW *= (1 + spread + (Math.random() - 0.5) * this.volatility);
        this.pricePerMW = Math.max(0.01, this.pricePerMW);
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = EnergyMarketExchange;
