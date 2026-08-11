/**
 * 💹 EXOPLANET PIONEER: INTERSTELLAR STOCK EXCHANGE (ISE)
 * Item 6001: 5,000+ AI-run corporations with fluctuating valuations.
 */

class InterstellarStockExchange {
    constructor() {
        this.corporations = [];
        this.sectors = ["ENERGY", "MINING", "LOGISTICS", "BIOTECH", "WARP_TECH"];
        this.init();
    }

    init() {
        for (let i = 0; i < 5000; i++) {
            this.corporations.push({
                id: `CORP-${i}`,
                name: this._generateCorpName(),
                sector: this.sectors[Math.floor(Math.random() * this.sectors.length)],
                valuation: 100 + Math.random() * 900,
                volatility: 0.01 + Math.random() * 0.04,
                momentum: 0
            });
        }
        console.log("💹 ISE: 5,000 AI Corporations listed.");
        this._startMarketLoop();
    }

    _generateCorpName() {
        const prefixes = ["Omni", "Galactic", "Stellar", "Quantum", "Nexus", "Void"];
        const suffixes = ["Dynamics", "Systems", "Solutions", "Industries", "Core", "Foundry"];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]} ${Math.floor(Math.random() * 99)}`;
    }

    _startMarketLoop() {
        setInterval(() => {
            this.corporations.forEach(corp => {
                // Random walk with momentum
                const change = (Math.random() - 0.5) * corp.volatility * 10;
                corp.momentum = (corp.momentum * 0.9) + change;
                corp.valuation = Math.max(1, corp.valuation + corp.momentum);
            });
            
            this.fireEvent("MARKET_TICK", { topGainer: this._getTopGainer() });
        }, 5000);
    }

    _getTopGainer() {
        return [...this.corporations].sort((a,b) => b.momentum - a.momentum)[0];
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const ise = new InterstellarStockExchange();
window.ise = ise;
