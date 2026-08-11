/**
 * Planet Claim Statistics
 * Detailed statistics on planet claims
 * 
 * Features:
 * - Claim tracking
 * - Statistics dashboard
 * - Claim history
 * - Claim analytics
 */

class PlanetClaimStatistics {
    constructor() {
        this.claims = [];
        this.statistics = {
            totalClaims: 0,
            activeClaims: 0,
            claimedPlanets: [],
            claimHistory: [],
            claimTrends: []
        };
        this.init();
    }
    
    init() {
        // Load claims data
        this.loadClaims();
        
        // Calculate statistics
        this.calculateStatistics();
        
        // Create statistics dashboard
        this.createDashboard();
        
        console.log('📊 Planet Claim Statistics initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tc_la_im_st_at_is_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadClaims() {
        try {
            const saved = localStorage.getItem('planet-claims');
            if (saved) {
                this.claims = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load claims:', e);
        }
    }
    
    saveClaims() {
        try {
            localStorage.setItem('planet-claims', JSON.stringify(this.claims));
        } catch (e) {
            console.warn('Failed to save claims:', e);
        }
    }
    
    calculateStatistics() {
        this.statistics.totalClaims = this.claims.length;
        this.statistics.activeClaims = this.claims.filter(c => c.status === 'active').length;
        this.statistics.claimedPlanets = this.claims.map(c => c.planetId || c.planetName);
        
        // Calculate trends
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        const last7d = now - (7 * 24 * 60 * 60 * 1000);
        const last30d = now - (30 * 24 * 60 * 60 * 1000);
        
        this.statistics.claimTrends = {
            last24h: this.claims.filter(c => c.timestamp > last24h).length,
            last7d: this.claims.filter(c => c.timestamp > last7d).length,
            last30d: this.claims.filter(c => c.timestamp > last30d).length
        };
    }
    
    createDashboard() {
        // Find or create dashboard container
        let container = document.getElementById('claim-statistics-dashboard');
        if (!container) {
            container = document.createElement('div');
            container.id = 'claim-statistics-dashboard';
            container.className = 'claim-statistics-dashboard';
            container.style.cssText = `
                padding: 2rem;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 10px;
                margin: 2rem 0;
                color: white;
            `;
            
            // Insert into page (find a good location)
            const main = document.querySelector('main') || document.body;
            const firstSection = main.querySelector('section');
            if (firstSection) {
                firstSection.insertAdjacentElement('afterend', container);
            } else {
                main.appendChild(container);
            }
        }
        
        this.renderDashboard(container);
    }
    
    renderDashboard(container) {
        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">📊 Planet Claim Statistics</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                    <div style="font-size: 2.5rem; color: #ba944f; font-weight: bold;">${this.statistics.totalClaims}</div>
                    <div style="color: rgba(255,255,255,0.7); margin-top: 0.5rem;">Total Claims</div>
                </div>
                <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                    <div style="font-size: 2.5rem; color: #ba944f; font-weight: bold;">${this.statistics.activeClaims}</div>
                    <div style="color: rgba(255,255,255,0.7); margin-top: 0.5rem;">Active Claims</div>
                </div>
                <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                    <div style="font-size: 2.5rem; color: #ba944f; font-weight: bold;">${this.statistics.claimTrends.last24h}</div>
                    <div style="color: rgba(255,255,255,0.7); margin-top: 0.5rem;">Claims (24h)</div>
                </div>
                <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                    <div style="font-size: 2.5rem; color: #ba944f; font-weight: bold;">${this.statistics.claimTrends.last7d}</div>
                    <div style="color: rgba(255,255,255,0.7); margin-top: 0.5rem;">Claims (7d)</div>
                </div>
            </div>
            <div style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1rem;">Claim Trends</h3>
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Last 24 hours:</span>
                        <span style="color: #ba944f; font-weight: bold;">${this.statistics.claimTrends.last24h}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Last 7 days:</span>
                        <span style="color: #ba944f; font-weight: bold;">${this.statistics.claimTrends.last7d}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Last 30 days:</span>
                        <span style="color: #ba944f; font-weight: bold;">${this.statistics.claimTrends.last30d}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    addClaim(planetId, planetName) {
        const claim = {
            id: `claim-${Date.now()}`,
            planetId: planetId,
            planetName: planetName,
            status: 'active',
            timestamp: Date.now(),
            userId: this.getUserId()
        };
        
        this.claims.push(claim);
        this.saveClaims();
        this.calculateStatistics();
        this.renderDashboard(document.getElementById('claim-statistics-dashboard'));
    }
    
    getUserId() {
        // Get user ID from auth or generate temporary
        return localStorage.getItem('userId') || `user-${Date.now()}`;
    }
    
    getStatistics() {
        return { ...this.statistics };
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetClaimStatistics = new PlanetClaimStatistics();
    });
} else {
    window.planetClaimStatistics = new PlanetClaimStatistics();
}
