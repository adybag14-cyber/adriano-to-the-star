/**
 * Popular Planet Trends
 * Analytics on trending and popular planets
 * 
 * Features:
 * - Trend tracking
 * - Popular planets list
 * - Trend visualization
 * - Trend alerts
 */

class PopularPlanetTrends {
    constructor() {
        this.trends = [];
        this.popularPlanets = [];
        this.trendingPlanets = [];
        this.init();
    }
    
    init() {
        // Load trend data
        this.loadTrends();
        
        // Calculate popular planets
        this.calculatePopularPlanets();
        
        // Create trends display
        this.createTrendsDisplay();
        
        // Start trend tracking
        this.startTrendTracking();
        
        console.log('📈 Popular Planet Trends initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_op_ul_ar_pl_an_et_tr_en_ds_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadTrends() {
        try {
            const saved = localStorage.getItem('planet-trends');
            if (saved) {
                this.trends = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load trends:', e);
        }
    }
    
    saveTrends() {
        try {
            localStorage.setItem('planet-trends', JSON.stringify(this.trends));
        } catch (e) {
            console.warn('Failed to save trends:', e);
        }
    }
    
    trackPlanetInteraction(planetId, planetName, interactionType) {
        const trend = {
            planetId: planetId,
            planetName: planetName,
            interactionType: interactionType, // 'view', 'favorite', 'claim', 'share'
            timestamp: Date.now()
        };
        
        this.trends.push(trend);
        
        // Keep only last 1000 trends
        if (this.trends.length > 1000) {
            this.trends = this.trends.slice(-1000);
        }
        
        this.saveTrends();
        this.calculatePopularPlanets();
    }
    
    calculatePopularPlanets() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        const last7d = now - (7 * 24 * 60 * 60 * 1000);
        
        // Count interactions per planet
        const planetScores = {};
        
        this.trends.forEach(trend => {
            if (!planetScores[trend.planetId]) {
                planetScores[trend.planetId] = {
                    planetId: trend.planetId,
                    planetName: trend.planetName,
                    totalInteractions: 0,
                    last24h: 0,
                    last7d: 0,
                    views: 0,
                    favorites: 0,
                    claims: 0,
                    shares: 0
                };
            }
            
            const score = planetScores[trend.planetId];
            score.totalInteractions++;
            
            if (trend.timestamp > last24h) {
                score.last24h++;
            }
            if (trend.timestamp > last7d) {
                score.last7d++;
            }
            
            // Count by interaction type
            if (trend.interactionType === 'view') score.views++;
            if (trend.interactionType === 'favorite') score.favorites++;
            if (trend.interactionType === 'claim') score.claims++;
            if (trend.interactionType === 'share') score.shares++;
        });
        
        // Sort by popularity (last 24h)
        this.trendingPlanets = Object.values(planetScores)
            .sort((a, b) => b.last24h - a.last24h)
            .slice(0, 10);
        
        // Sort by total interactions
        this.popularPlanets = Object.values(planetScores)
            .sort((a, b) => b.totalInteractions - a.totalInteractions)
            .slice(0, 10);
    }
    
    createTrendsDisplay() {
        const container = document.createElement('div');
        container.id = 'popular-planet-trends';
        container.className = 'popular-planet-trends';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
        `;
        
        // Insert into page
        const main = document.querySelector('main') || document.body;
        const firstSection = main.querySelector('section');
        if (firstSection) {
            firstSection.insertAdjacentElement('afterend', container);
        } else {
            main.appendChild(container);
        }
        
        this.renderTrends(container);
    }
    
    renderTrends(container) {
        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">📈 Popular Planet Trends</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div>
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">🔥 Trending Now (24h)</h3>
                    <div class="trending-list">
                        ${this.trendingPlanets.length > 0 
                            ? this.trendingPlanets.map((planet, index) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(186, 148, 79, 0.1); border-radius: 5px; margin-bottom: 0.5rem;">
                                    <div>
                                        <div style="font-weight: bold; color: #ba944f;">#${index + 1} ${planet.planetName || planet.planetId}</div>
                                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">${planet.last24h} interactions</div>
                                    </div>
                                    <div style="font-size: 1.5rem;">${this.getTrendIcon(planet.last24h)}</div>
                                </div>
                            `).join('')
                            : '<p style="color: rgba(255,255,255,0.7);">No trending planets yet</p>'
                        }
                    </div>
                </div>
                
                <div>
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">⭐ Most Popular (All Time)</h3>
                    <div class="popular-list">
                        ${this.popularPlanets.length > 0
                            ? this.popularPlanets.map((planet, index) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(186, 148, 79, 0.1); border-radius: 5px; margin-bottom: 0.5rem;">
                                    <div>
                                        <div style="font-weight: bold; color: #ba944f;">#${index + 1} ${planet.planetName || planet.planetId}</div>
                                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">
                                            ${planet.totalInteractions} total • ${planet.views} views • ${planet.favorites} favorites
                                        </div>
                                    </div>
                                </div>
                            `).join('')
                            : '<p style="color: rgba(255,255,255,0.7);">No popular planets yet</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    getTrendIcon(interactions) {
        if (interactions > 50) return '🔥';
        if (interactions > 20) return '📈';
        if (interactions > 10) return '⭐';
        return '✨';
    }
    
    startTrendTracking() {
        // Track planet views
        document.addEventListener('click', (e) => {
            const planetCard = e.target.closest('.planet-card, [data-kepid], [data-planet-id]');
            if (planetCard) {
                const planetId = planetCard.dataset.kepid || planetCard.dataset.planetId;
                const planetName = planetCard.dataset.name || planetCard.querySelector('.planet-name')?.textContent || 'Unknown';
                this.trackPlanetInteraction(planetId, planetName, 'view');
            }
        });
        
        // Track favorites
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn, [data-favorite]')) {
                const planetCard = e.target.closest('.planet-card, [data-kepid]');
                if (planetCard) {
                    const planetId = planetCard.dataset.kepid;
                    const planetName = planetCard.dataset.name || 'Unknown';
                    this.trackPlanetInteraction(planetId, planetName, 'favorite');
                }
            }
        });
        
        // Update trends display periodically
        setInterval(() => {
            this.calculatePopularPlanets();
            const container = document.getElementById('popular-planet-trends');
            if (container) {
                this.renderTrends(container);
            }
        }, 60000); // Update every minute
    }
    
    getTrendingPlanets() {
        return [...this.trendingPlanets];
    }
    
    getPopularPlanets() {
        return [...this.popularPlanets];
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.popularPlanetTrends = new PopularPlanetTrends();
    });
} else {
    window.popularPlanetTrends = new PopularPlanetTrends();
}
