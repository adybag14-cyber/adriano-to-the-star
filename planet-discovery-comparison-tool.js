/**
 * Planet Discovery Comparison Tool
 * Compare discovery methods
 */

class PlanetDiscoveryComparisonTool {
    constructor() {
        this.comparisons = [];
        this.methods = ['transit', 'radial velocity', 'microlensing', 'direct imaging', 'astrometry'];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('⚖️ Planet Discovery Comparison Tool initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_co_mp_ar_is_on_to_ol_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    compareMethods(planets) {
        const methodStats = {};
        const list = Array.isArray(planets) ? planets : [];

        this.methods.forEach(method => {
            methodStats[method] = {
                count: 0,
                averageRadius: 0,
                averageTemp: 0,
                total: 0
            };
        });

        list.forEach(planet => {
            const method = (planet.discovery_method || 'unknown').toLowerCase();
            if (methodStats[method]) {
                methodStats[method].count++;
                const radius = parseFloat(planet.radius) || 0;
                const temp = parseFloat(planet.koi_teq) || 0;
                if (radius > 0) {
                    methodStats[method].averageRadius = (methodStats[method].averageRadius * (methodStats[method].count - 1) + radius) / methodStats[method].count;
                }
                if (temp > 0) {
                    methodStats[method].averageTemp = (methodStats[method].averageTemp * (methodStats[method].count - 1) + temp) / methodStats[method].count;
                }
            }
        });

        return methodStats;
    }

    renderComparison(containerId, planets) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const stats = this.compareMethods(planets);

        const hasData = Object.values(stats).some(s => s.count > 0);
        if (!hasData) {
            container.innerHTML = `
                <div class="discovery-comparison" style="background: rgba(0, 0, 0, 0.5); border: 1px dashed rgba(186, 148, 79, 0.4); border-radius: 12px; padding: 1.5rem; margin: 1rem 0; text-align: center; font-size: 0.9rem; color: rgba(226, 232, 240, 0.9);">
                    Discovery method comparison will appear here once planet data is loaded.
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="discovery-comparison" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">⚖️ Discovery Method Comparison</h3>
                <div class="comparison-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${Object.entries(stats).map(([method, data]) => `
                        <div style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem; text-transform: capitalize;">${method}</div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">Count: ${data.count}</div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">Avg Radius: ${data.averageRadius.toFixed(2)}</div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Avg Temp: ${data.averageTemp.toFixed(0)}K</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryComparisonTool = PlanetDiscoveryComparisonTool;
    window.planetDiscoveryComparisonTool = new PlanetDiscoveryComparisonTool();
}

