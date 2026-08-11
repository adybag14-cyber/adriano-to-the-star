/**
 * Planet Discovery Map Visualization
 * Interactive discovery map
 */

class PlanetDiscoveryMapVisualization {
    constructor() {
        this.discoveries = [];
        this.map = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadDiscoveries();
        this.isInitialized = true;
        console.log('🗺️ Planet Discovery Map Visualization initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ma_pv_is_ua_li_za_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadDiscoveries() {
        try {
            const stored = localStorage.getItem('discovery-map-data');
            if (stored) this.discoveries = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading discoveries:', error);
        }
    }

    saveDiscoveries() {
        try {
            localStorage.setItem('discovery-map-data', JSON.stringify(this.discoveries));
        } catch (error) {
            console.error('Error saving discoveries:', error);
        }
    }

    addDiscovery(planetData, coordinates = null) {
        const discovery = {
            kepid: planetData.kepid,
            name: planetData.kepler_name || planetData.kepoi_name,
            coordinates: coordinates || this.generateCoordinates(),
            discoveredAt: new Date().toISOString()
        };

        this.discoveries.push(discovery);
        this.saveDiscoveries();
        return discovery;
    }

    generateCoordinates() {
        return {
            x: Math.random() * 100,
            y: Math.random() * 100,
            z: Math.random() * 100
        };
    }

    renderMap(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="discovery-map" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🗺️ Discovery Map</h3>
                <div id="map-canvas" style="width: 100%; height: 500px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; position: relative; overflow: hidden;">
                    ${this.renderMapPoints()}
                </div>
                <div style="margin-top: 1rem; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                    ${this.discoveries.length} discoveries mapped
                </div>
            </div>
        `;
    }

    renderMapPoints() {
        if (this.discoveries.length === 0) {
            return '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255, 255, 255, 0.5);">No discoveries to display</div>';
        }

        return this.discoveries.map(discovery => `
            <div 
                class="map-point" 
                data-planet-id="${discovery.kepid}"
                style="
                    position: absolute;
                    left: ${discovery.coordinates.x}%;
                    top: ${discovery.coordinates.y}%;
                    width: 12px;
                    height: 12px;
                    background: #ba944f;
                    border: 2px solid #4ade80;
                    border-radius: 50%;
                    cursor: pointer;
                    transform: translate(-50%, -50%);
                "
                title="${discovery.name}"
                onmouseover="this.style.transform='translate(-50%, -50%) scale(1.5)'"
                onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'"
            ></div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryMapVisualization = PlanetDiscoveryMapVisualization;
    window.planetDiscoveryMapVisualization = new PlanetDiscoveryMapVisualization();
}

