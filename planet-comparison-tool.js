/**
 * Planet Comparison Tool
 * Side-by-side analysis of multiple planets
 */

class PlanetComparisonTool {
    constructor() {
        this.selectedPlanets = [];
        this.comparisonData = [];
        this.init();
    }

    init() {
        this.trackEvent('p_la_ne_tc_om_pa_ri_so_nt_oo_l_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tc_om_pa_ri_so_nt_oo_l_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add planet to comparison
     */
    addPlanet(planet) {
        if (this.selectedPlanets.length >= 4) {
            return { success: false, message: 'Maximum 4 planets can be compared at once' };
        }

        if (this.selectedPlanets.find(p => p.kepid === planet.kepid)) {
            return { success: false, message: 'Planet already in comparison' };
        }

        this.selectedPlanets.push(planet);
        return { success: true, message: 'Planet added to comparison' };
    }

    /**
     * Remove planet from comparison
     */
    removePlanet(kepid) {
        this.selectedPlanets = this.selectedPlanets.filter(p => p.kepid !== kepid);
    }

    /**
     * Clear comparison
     */
    clearComparison() {
        this.selectedPlanets = [];
    }

    /**
     * Generate comparison data
     */
    generateComparisonData() {
        return this.selectedPlanets.map(planet => ({
            name: planet.kepler_name || planet.kepoi_name || 'Unknown',
            kepid: planet.kepid,
            radius: parseFloat(planet.radius) || 'Unknown',
            mass: parseFloat(planet.mass) || 'Unknown',
            period: parseFloat(planet.koi_period) || 'Unknown',
            temperature: parseFloat(planet.koi_teq) || 'Unknown',
            distance: parseFloat(planet.distance) || 'Unknown',
            disposition: planet.koi_disposition || 'Unknown',
            score: parseFloat(planet.koi_score) || 'Unknown'
        }));
    }

    /**
     * Display comparison
     */
    displayComparison(container) {
        if (!container) return;

        const comparisonData = this.generateComparisonData();

        if (comparisonData.length === 0) {
            container.innerHTML = `
                <div class="comparison-empty" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 3rem; text-align: center;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">🔍 Planet Comparison Tool</h3>
                    <p style="color: rgba(255, 255, 255, 0.7);">Select planets from the database to compare them side-by-side.</p>
                    <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-top: 0.5rem;">You can compare up to 4 planets at once.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="planet-comparison-container" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="comparison-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🔍 Planet Comparison</h3>
                    <button class="clear-comparison-btn" onclick="planetComparisonTool.clearComparison(); planetComparisonTool.displayComparison(document.getElementById('comparison-container'))" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #ef4444; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Clear All</button>
                </div>

                <div class="comparison-table" style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(186, 148, 79, 0.2);">
                                <th style="padding: 1rem; text-align: left; color: #ba944f; border-bottom: 2px solid rgba(186, 148, 79, 0.3);">Property</th>
                                ${comparisonData.map(planet => `
                                    <th style="padding: 1rem; text-align: center; color: #ba944f; border-bottom: 2px solid rgba(186, 148, 79, 0.3); position: relative;">
                                        ${planet.name}
                                        <button onclick="planetComparisonTool.removePlanet('${planet.kepid}'); planetComparisonTool.displayComparison(document.getElementById('comparison-container'))" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #ef4444; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">×</button>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">KEPID</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.kepid}</td>`).join('')}
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Radius (Earth radii)</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.radius}</td>`).join('')}
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Mass (Earth masses)</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.mass}</td>`).join('')}
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Orbital Period (days)</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.period}</td>`).join('')}
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Temperature (K)</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.temperature}</td>`).join('')}
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Distance (AU)</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.distance}</td>`).join('')}
                            </tr>
                            <tr style="border-bottom: 1px solid rgba(186, 148, 79, 0.2);">
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Disposition</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.disposition}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; color: rgba(255, 255, 255, 0.9); font-weight: 600;">Confidence Score</td>
                                ${comparisonData.map(planet => `<td style="padding: 0.75rem; text-align: center; color: #e0e0e0;">${planet.score}</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

// Initialize planet comparison tool
if (typeof window !== 'undefined') {
    window.PlanetComparisonTool = PlanetComparisonTool;
    window.planetComparisonTool = new PlanetComparisonTool();
}

