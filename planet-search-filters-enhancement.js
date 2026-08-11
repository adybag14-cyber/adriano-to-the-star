/**
 * Planet Search Filters Enhancement
 * Advanced filtering options
 */

class PlanetSearchFiltersEnhancement {
    constructor() {
        this.filters = {
            radius: { min: 0, max: 10 },
            mass: { min: 0, max: 100 },
            temperature: { min: 0, max: 1000 },
            period: { min: 0, max: 1000 },
            distance: { min: 0, max: 10000 },
            discoveryYear: { min: 2000, max: new Date().getFullYear() }
        };
        this.activeFilters = {};
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('🔍 Planet Search Filters Enhancement initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_ts_ea_rc_hf_il_te_rs_en_ha_nc_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    applyFilters(planets) {
        return planets.filter(planet => {
            // Radius filter
            if (this.activeFilters.radiusMin !== undefined) {
                const radius = parseFloat(planet.radius) || 0;
                if (radius < this.activeFilters.radiusMin) return false;
            }
            if (this.activeFilters.radiusMax !== undefined) {
                const radius = parseFloat(planet.radius) || 0;
                if (radius > this.activeFilters.radiusMax) return false;
            }

            // Temperature filter
            if (this.activeFilters.tempMin !== undefined) {
                const temp = parseFloat(planet.koi_teq) || 0;
                if (temp < this.activeFilters.tempMin) return false;
            }
            if (this.activeFilters.tempMax !== undefined) {
                const temp = parseFloat(planet.koi_teq) || 0;
                if (temp > this.activeFilters.tempMax) return false;
            }

            // Period filter
            if (this.activeFilters.periodMin !== undefined) {
                const period = parseFloat(planet.koi_period) || 0;
                if (period < this.activeFilters.periodMin) return false;
            }
            if (this.activeFilters.periodMax !== undefined) {
                const period = parseFloat(planet.koi_period) || 0;
                if (period > this.activeFilters.periodMax) return false;
            }

            // Discovery year filter
            if (this.activeFilters.yearMin !== undefined) {
                const year = parseInt(planet.koi_disposition) || 0;
                if (year < this.activeFilters.yearMin) return false;
            }

            return true;
        });
    }

    setFilter(filterName, value) {
        this.activeFilters[filterName] = value;
    }

    clearFilters() {
        this.activeFilters = {};
    }

    renderFilters(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="search-filters-enhancement" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🔍 Advanced Filters</h3>
                <div class="filters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem;">Radius (Min)</label>
                        <input type="number" id="radius-min" placeholder="0" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                    </div>
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem;">Radius (Max)</label>
                        <input type="number" id="radius-max" placeholder="10" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                    </div>
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem;">Temperature (Min)</label>
                        <input type="number" id="temp-min" placeholder="0" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                    </div>
                    <div>
                        <label style="display: block; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem;">Temperature (Max)</label>
                        <input type="number" id="temp-max" placeholder="1000" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button id="apply-filters-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        Apply Filters
                    </button>
                    <button id="clear-filters-btn" style="padding: 0.75rem 1.5rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        Clear All
                    </button>
                </div>
            </div>
        `;

        document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
            const radiusMin = document.getElementById('radius-min')?.value;
            const radiusMax = document.getElementById('radius-max')?.value;
            const tempMin = document.getElementById('temp-min')?.value;
            const tempMax = document.getElementById('temp-max')?.value;

            if (radiusMin) this.setFilter('radiusMin', parseFloat(radiusMin));
            if (radiusMax) this.setFilter('radiusMax', parseFloat(radiusMax));
            if (tempMin) this.setFilter('tempMin', parseFloat(tempMin));
            if (tempMax) this.setFilter('tempMax', parseFloat(tempMax));
        });

        document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
            this.clearFilters();
            document.getElementById('radius-min').value = '';
            document.getElementById('radius-max').value = '';
            document.getElementById('temp-min').value = '';
            document.getElementById('temp-max').value = '';
        });
    }
}

if (typeof window !== 'undefined') {
    window.PlanetSearchFiltersEnhancement = PlanetSearchFiltersEnhancement;
    window.planetSearchFiltersEnhancement = new PlanetSearchFiltersEnhancement();
}

