/**
 * Planet Comparison Matrix
 * Compare multiple planets side-by-side
 */

class PlanetComparisonMatrix {
    constructor() {
        this.selectedPlanets = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('📊 Planet Comparison Matrix initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tc_om_pa_ri_so_nm_at_ri_x_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addPlanet(planet) {
        if (this.selectedPlanets.length >= 5) return false;
        if (!this.selectedPlanets.find(p => p.kepid === planet.kepid)) {
            this.selectedPlanets.push(planet);
            return true;
        }
        return false;
    }

    removePlanet(planetId) {
        this.selectedPlanets = this.selectedPlanets.filter(p => p.kepid !== planetId);
    }

    renderMatrix(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (this.selectedPlanets.length === 0) {
            container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5);">Select planets to compare</p>';
            return;
        }
        const properties = ['kepler_name', 'radius', 'mass', 'koi_teq', 'koi_period'];
        container.innerHTML = `
            <div class="comparison-matrix" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0; overflow-x: auto;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📊 Comparison Matrix</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.3); color: #ba944f;">Property</th>
                            ${this.selectedPlanets.map(p => `
                                <th style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.3); color: #ba944f;">${p.kepler_name || p.kepoi_name}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${properties.map(prop => `
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.3); color: rgba(255, 255, 255, 0.7);">${prop}</td>
                                ${this.selectedPlanets.map(p => `
                                    <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.3); color: #e0e0e0;">${p[prop] || 'N/A'}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetComparisonMatrix = PlanetComparisonMatrix;
    window.planetComparisonMatrix = new PlanetComparisonMatrix();
}

