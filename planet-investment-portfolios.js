/**
 * Planet Investment Portfolios
 * System for managing planet investment portfolios
 * 
 * Features:
 * - Portfolio management
 * - Value tracking
 * - Diversification analysis
 * - Performance metrics
 */

class PlanetInvestmentPortfolios {
    constructor() {
        this.portfolios = new Map();
        this.init();
    }

    init() {
        this.loadPortfolios();
        console.log('💼 Planet Investment Portfolios initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_ti_nv_es_tm_en_tp_or_tf_ol_io_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadPortfolios() {
        try {
            const saved = localStorage.getItem('investment-portfolios');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(portfolio => {
                    this.portfolios.set(portfolio.id, portfolio);
                });
            }
        } catch (e) {
            console.warn('Failed to load portfolios:', e);
        }
    }

    createPortfolio(name) {
        const portfolio = {
            id: Date.now().toString(),
            name,
            planets: [],
            created_at: new Date().toISOString()
        };

        this.portfolios.set(portfolio.id, portfolio);
        this.savePortfolios();
        return portfolio;
    }

    addPlanetToPortfolio(portfolioId, planetId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (portfolio && !portfolio.planets.includes(planetId)) {
            portfolio.planets.push(planetId);
            this.savePortfolios();
        }
    }

    /**
     * Render the portfolio UI into a container
     * @param {string} containerId - ID of the container element
     */
    renderPortfolioUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #8b5cf6; margin-bottom: 15px;">Planet Investment Portfolios</h3>
                <p style="color: #ccc; margin-bottom: 20px;">Manage your planet investments and track performance.</p>
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="window.planetInvestmentPortfolios.createPortfolioPrompt()" style="
                        padding: 8px 16px;
                        background: rgba(139, 92, 246, 0.2);
                        border: 1px solid #8b5cf6;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">+ New Portfolio</button>
                    <!-- <button ...>Import Portfolio</button> -->
                </div>
            </div>
            <div id="portfolio-list" style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                ${this.renderPortfoliosList()}
            </div>
        `;
    }

    renderPortfoliosList() {
        if (this.portfolios.size === 0) {
            return `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <p style="color: #888;">No investment portfolios created yet.</p>
                </div>
            `;
        }

        return Array.from(this.portfolios.values()).map(portfolio => `
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 15px;">
                <h4 style="color: #8b5cf6; margin: 0 0 10px 0;">${portfolio.name}</h4>
                <p>Planets: ${portfolio.planets.length}</p>
                <p style="font-size: 0.8rem; color: #aaa;">Created: ${new Date(portfolio.created_at).toLocaleDateString()}</p>
                <button style="width: 100%; margin-top: 10px; padding: 8px; background: rgba(139, 92, 246, 0.3); border: none; color: white; border-radius: 4px; cursor: pointer;">View Analytics</button>
            </div>
        `).join('');
    }

    createPortfolioPrompt() {
        const name = prompt("Enter portfolio name:");
        if (name) {
            this.createPortfolio(name);
            // Re-render if container visible
            const container = document.getElementById('investments-container');
            if (container && container.style.display !== 'none') {
                this.renderPortfolioUI('investments-container');
            }
        }
    }

    savePortfolios() {
        try {
            const data = Array.from(this.portfolios.values());
            localStorage.setItem('investment-portfolios', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save portfolios:', e);
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetInvestmentPortfolios = new PlanetInvestmentPortfolios();
    });
} else {
    window.planetInvestmentPortfolios = new PlanetInvestmentPortfolios();
}
