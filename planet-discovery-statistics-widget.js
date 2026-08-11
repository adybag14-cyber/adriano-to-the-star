/**
 * Planet Discovery Statistics Widget
 * Display discovery metrics
 */

class PlanetDiscoveryStatisticsWidget {
    constructor() {
        this.stats = {
            totalDiscoveries: 0,
            confirmedPlanets: 0,
            candidates: 0,
            earthLike: 0,
            averageRadius: 0,
            averageTemperature: 0
        };
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadStats();
        this.isInitialized = true;
        console.log('📈 Planet Discovery Statistics Widget initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_st_at_is_ti_cs_wi_dg_et_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadStats() {
        try {
            const stored = localStorage.getItem('discovery-statistics');
            if (stored) this.stats = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    saveStats() {
        try {
            localStorage.setItem('discovery-statistics', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    updateStats(planetData) {
        this.stats.totalDiscoveries++;

        if (planetData.status === 'CONFIRMED' || planetData.status === 'Confirmed Planet') {
            this.stats.confirmedPlanets++;
        } else {
            this.stats.candidates++;
        }

        const radius = parseFloat(planetData.radius) || 0;
        if (radius >= 0.8 && radius <= 1.2) {
            this.stats.earthLike++;
        }

        const temp = parseFloat(planetData.koi_teq) || 0;
        if (temp > 0) {
            this.stats.averageTemperature = (this.stats.averageTemperature * (this.stats.totalDiscoveries - 1) + temp) / this.stats.totalDiscoveries;
        }

        if (radius > 0) {
            this.stats.averageRadius = (this.stats.averageRadius * (this.stats.totalDiscoveries - 1) + radius) / this.stats.totalDiscoveries;
        }

        this.saveStats();
    }

    renderWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="discovery-statistics-widget" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📈 Discovery Statistics</h3>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Total</div>
                        <div style="color: #ba944f; font-size: 1.5rem; font-weight: bold;">${this.stats.totalDiscoveries}</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Confirmed</div>
                        <div style="color: #4ade80; font-size: 1.5rem; font-weight: bold;">${this.stats.confirmedPlanets}</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Earth-like</div>
                        <div style="color: #4a90e2; font-size: 1.5rem; font-weight: bold;">${this.stats.earthLike}</div>
                    </div>
                    <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Avg Temp</div>
                        <div style="color: #fbbf24; font-size: 1.5rem; font-weight: bold;">${this.stats.averageTemperature.toFixed(0)}K</div>
                    </div>
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryStatisticsWidget = PlanetDiscoveryStatisticsWidget;
    window.planetDiscoveryStatisticsWidget = new PlanetDiscoveryStatisticsWidget();
}

