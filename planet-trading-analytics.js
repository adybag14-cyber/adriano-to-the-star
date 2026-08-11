/**
 * Planet Trading Analytics Dashboard
 * Track trading statistics
 */

class PlanetTradingAnalytics {
    constructor() {
        this.analytics = {
            totalTrades: 0,
            totalVolume: 0,
            averagePrice: 0,
            highestPrice: 0,
            lowestPrice: Infinity,
            tradesByDay: {},
            topPlanets: []
        };
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadAnalytics();
        this.isInitialized = true;
        console.log('📊 Planet Trading Analytics initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tt_ra_di_ng_an_al_yt_ic_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadAnalytics() {
        try {
            const stored = localStorage.getItem('trading-analytics');
            if (stored) this.analytics = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    saveAnalytics() {
        try {
            localStorage.setItem('trading-analytics', JSON.stringify(this.analytics));
        } catch (error) {
            console.error('Error saving analytics:', error);
        }
    }

    recordTrade(planetName, price, date = new Date()) {
        this.analytics.totalTrades++;
        this.analytics.totalVolume += price;
        this.analytics.averagePrice = this.analytics.totalVolume / this.analytics.totalTrades;
        
        if (price > this.analytics.highestPrice) {
            this.analytics.highestPrice = price;
        }
        if (price < this.analytics.lowestPrice) {
            this.analytics.lowestPrice = price;
        }

        const dayKey = date.toISOString().split('T')[0];
        if (!this.analytics.tradesByDay[dayKey]) {
            this.analytics.tradesByDay[dayKey] = 0;
        }
        this.analytics.tradesByDay[dayKey]++;

        const planetIndex = this.analytics.topPlanets.findIndex(p => p.name === planetName);
        if (planetIndex >= 0) {
            this.analytics.topPlanets[planetIndex].trades++;
            this.analytics.topPlanets[planetIndex].volume += price;
        } else {
            this.analytics.topPlanets.push({
                name: planetName,
                trades: 1,
                volume: price
            });
        }

        this.analytics.topPlanets.sort((a, b) => b.volume - a.volume);
        this.analytics.topPlanets = this.analytics.topPlanets.slice(0, 10);

        this.saveAnalytics();
    }

    renderAnalytics(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="trading-analytics" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📊 Trading Analytics</h3>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Total Trades</div>
                        <div style="color: #ba944f; font-size: 2rem; font-weight: bold;">${this.analytics.totalTrades}</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Total Volume</div>
                        <div style="color: #4ade80; font-size: 2rem; font-weight: bold;">${this.analytics.totalVolume.toFixed(2)} ETH</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Avg Price</div>
                        <div style="color: #4a90e2; font-size: 2rem; font-weight: bold;">${this.analytics.averagePrice.toFixed(2)} ETH</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Highest Price</div>
                        <div style="color: #fbbf24; font-size: 2rem; font-weight: bold;">${this.analytics.highestPrice.toFixed(2)} ETH</div>
                    </div>
                </div>
                <div class="top-planets">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Top Traded Planets</h4>
                    ${this.renderTopPlanets()}
                </div>
            </div>
        `;
    }

    renderTopPlanets() {
        if (this.analytics.topPlanets.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No trading data yet</p>';
        }

        return this.analytics.topPlanets.map((planet, index) => `
            <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #ba944f; font-weight: 600;">#${index + 1} ${planet.name}</div>
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">${planet.trades} trades</div>
                </div>
                <div style="color: #4ade80; font-weight: 600;">${planet.volume.toFixed(2)} ETH</div>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetTradingAnalytics = PlanetTradingAnalytics;
    window.planetTradingAnalytics = new PlanetTradingAnalytics();
}

