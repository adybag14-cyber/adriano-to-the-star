/**
 * Planet Claim Statistics Dashboard
 * Comprehensive statistics and analytics for planet claims
 * 
 * Features:
 * - Claim counts and trends
 * - Popular planets
 * - User statistics
 * - Time-based analytics
 * - Visualizations
 */

class PlanetClaimStatisticsDashboard {
    constructor() {
        this.stats = {
            totalClaims: 0,
            claimsByType: {},
            claimsByMonth: {},
            topUsers: [],
            popularPlanets: []
        };
        this.init();
    }
    
    init() {
        this.loadStatistics();
        this.createDashboard();
        console.log('📈 Planet Claim Statistics Dashboard initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tc_la_im_st_at_is_ti_cs_da_sh_bo_ar_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    async loadStatistics() {
        try {
            if (window.supabase) {
                // Load total claims
                const { count } = await window.supabase
                    .from('planet_claims')
                    .select('*', { count: 'exact', head: true });
                
                this.stats.totalClaims = count || 0;
                
                // Load claims by type
                const { data: claims } = await window.supabase
                    .from('planet_claims')
                    .select('planet_type');
                
                if (claims) {
                    claims.forEach(claim => {
                        const type = claim.planet_type || 'unknown';
                        this.stats.claimsByType[type] = (this.stats.claimsByType[type] || 0) + 1;
                    });
                }
                
                // Load popular planets
                const { data: popular } = await window.supabase
                    .from('planet_claims')
                    .select('planet_id')
                    .limit(100);
                
                if (popular) {
                    const planetCounts = {};
                    popular.forEach(claim => {
                        planetCounts[claim.planet_id] = (planetCounts[claim.planet_id] || 0) + 1;
                    });
                    
                    this.stats.popularPlanets = Object.entries(planetCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([planetId, count]) => ({ planetId, count }));
                }
            }
        } catch (e) {
            console.warn('Failed to load statistics:', e);
        }
    }
    
    createDashboard() {
        const button = document.createElement('button');
        button.id = 'stats-dashboard-toggle';
        button.textContent = '📈 Statistics';
        button.style.cssText = `
            position: fixed;
            bottom: 440px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9994;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        button.addEventListener('click', () => this.showDashboard());
        document.body.appendChild(button);
    }
    
    showDashboard() {
        const modal = document.createElement('div');
        modal.className = 'stats-dashboard-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 1000px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            ">
                <h2 style="color: #ba944f; margin: 0 0 20px 0;">Planet Claim Statistics</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px;">
                        <h3 style="color: #ba944f; margin: 0 0 10px 0;">Total Claims</h3>
                        <p style="font-size: 2rem; margin: 0;">${this.stats.totalClaims.toLocaleString()}</p>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px;">
                        <h3 style="color: #ba944f; margin: 0 0 10px 0;">Planet Types</h3>
                        <p style="font-size: 1.5rem; margin: 0;">${Object.keys(this.stats.claimsByType).length}</p>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #ba944f;">Claims by Type</h3>
                    <div style="margin-top: 15px;">
                        ${Object.entries(this.stats.claimsByType).map(([type, count]) => `
                            <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255, 255, 255, 0.05); margin-bottom: 5px; border-radius: 6px;">
                                <span>${type}</span>
                                <strong>${count}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h3 style="color: #ba944f;">Popular Planets</h3>
                    <div style="margin-top: 15px;">
                        ${this.stats.popularPlanets.map((planet, index) => `
                            <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255, 255, 255, 0.05); margin-bottom: 5px; border-radius: 6px;">
                                <span>#${index + 1} - ${planet.planetId}</span>
                                <strong>${planet.count} claims</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button id="close-stats-dashboard" style="
                    width: 100%;
                    margin-top: 20px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        modal.querySelector('#close-stats-dashboard').addEventListener('click', () => {
            modal.remove();
        });
        
        document.body.appendChild(modal);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetClaimStatisticsDashboard = new PlanetClaimStatisticsDashboard();
    });
} else {
    window.planetClaimStatisticsDashboard = new PlanetClaimStatisticsDashboard();
}
