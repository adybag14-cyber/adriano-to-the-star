/**
 * Advanced Planet Search Filters
 * Additional search criteria and filters for planet discovery
 * 
 * Features:
 * - Advanced filter combinations
 * - Saved filter presets
 * - Filter suggestions
 * - Range filters
 * - Multi-select filters
 */

class AdvancedPlanetSearchFilters {
    constructor() {
        this.filters = {
            distance: { min: null, max: null },
            radius: { min: null, max: null },
            mass: { min: null, max: null },
            orbitalPeriod: { min: null, max: null },
            discoveryYear: { min: null, max: null },
            temperature: { min: null, max: null },
            stellarType: [],
            detectionMethod: [],
            habitability: null,
            atmosphere: []
        };
        this.presets = [];
        this.init();
    }

    init() {
        // Load saved presets
        this.loadPresets();

        // Create advanced filter UI
        this.createFilterUI();

        // Enhance existing search
        this.enhanceExistingSearch();

        this.trackEvent('planet_search_filters_initialized');
    }

    createFilterUI() {
        const existing = document.getElementById('advanced-search-filters');
        if (existing) return existing;

        const container = document.createElement('div');
        container.id = 'advanced-search-filters';
        container.className = 'advanced-search-filters';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
        `;

        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0; display: flex; justify-content: space-between; align-items: center;">
                <span>🔍 Advanced Search Filters</span>
                <button id="toggle-filters" style="background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                    Show Filters
                </button>
            </h2>
            <div id="filters-content" style="display: none;">
                ${this.renderFilters()}
            </div>
        `;

        // Insert into page
        const searchSection = document.querySelector('.search-container, #search-section') || document.body;
        searchSection.appendChild(container);

        // Toggle button
        document.getElementById('toggle-filters').addEventListener('click', () => {
            const content = document.getElementById('filters-content');
            const btn = document.getElementById('toggle-filters');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                btn.textContent = 'Hide Filters';
            } else {
                content.style.display = 'none';
                btn.textContent = 'Show Filters';
            }
        });

        // Setup filter listeners
        this.setupFilterListeners();
    }

    renderFilters() {
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <!-- Distance Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Distance (light-years)</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="filter-distance-min" placeholder="Min" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <input type="number" id="filter-distance-max" placeholder="Max" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    </div>
                </div>
                
                <!-- Radius Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Radius (Earth radii)</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="filter-radius-min" placeholder="Min" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <input type="number" id="filter-radius-max" placeholder="Max" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    </div>
                </div>
                
                <!-- Mass Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Mass (Earth masses)</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="filter-mass-min" placeholder="Min" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <input type="number" id="filter-mass-max" placeholder="Max" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    </div>
                </div>
                
                <!-- Orbital Period Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Orbital Period (days)</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="filter-period-min" placeholder="Min" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <input type="number" id="filter-period-max" placeholder="Max" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    </div>
                </div>
                
                <!-- Temperature Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Temperature (K)</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="filter-temp-min" placeholder="Min" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <input type="number" id="filter-temp-max" placeholder="Max" 
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    </div>
                </div>
                
                <!-- Discovery Year Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Discovery Year</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="filter-year-min" placeholder="Min" min="1990" max="2025"
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <input type="number" id="filter-year-max" placeholder="Max" min="1990" max="2025"
                               style="flex: 1; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    </div>
                </div>
                
                <!-- Detection Method Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Detection Method</label>
                    <select id="filter-method" multiple 
                            style="width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white; min-height: 100px;">
                        <option value="transit">Transit</option>
                        <option value="radial-velocity">Radial Velocity</option>
                        <option value="microlensing">Microlensing</option>
                        <option value="direct-imaging">Direct Imaging</option>
                        <option value="astrometry">Astrometry</option>
                    </select>
                </div>
                
                <!-- Habitability Filter -->
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Habitability</label>
                    <select id="filter-habitability" 
                            style="width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                        <option value="">All</option>
                        <option value="habitable">Potentially Habitable</option>
                        <option value="non-habitable">Non-Habitable</option>
                        <option value="unknown">Unknown</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                <button id="clear-filters" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer;">
                    Clear All
                </button>
                <button id="apply-filters" style="padding: 0.75rem 1.5rem; background: #ba944f; border: none; border-radius: 5px; color: white; cursor: pointer;">
                    Apply Filters
                </button>
                <button id="save-filter-preset" style="padding: 0.75rem 1.5rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: #ba944f; cursor: pointer;">
                    Save Preset
                </button>
            </div>
            
            <div id="filter-presets" style="margin-top: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: #ba944f;">Saved Presets:</label>
                <div id="presets-list" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${this.renderPresets()}
                </div>
            </div>
        `;


    }

    setupFilterListeners() {
        // Apply filters
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Clear filters
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Save preset
        document.getElementById('save-filter-preset').addEventListener('click', () => {
            this.savePreset();
        });
    }

    applyFilters() {
        // Get filter values
        this.filters.distance.min = document.getElementById('filter-distance-min').value || null;
        this.filters.distance.max = document.getElementById('filter-distance-max').value || null;
        this.filters.radius.min = document.getElementById('filter-radius-min').value || null;
        this.filters.radius.max = document.getElementById('filter-radius-max').value || null;
        this.filters.mass.min = document.getElementById('filter-mass-min').value || null;
        this.filters.mass.max = document.getElementById('filter-mass-max').value || null;
        this.filters.orbitalPeriod.min = document.getElementById('filter-period-min').value || null;
        this.filters.orbitalPeriod.max = document.getElementById('filter-period-max').value || null;
        this.filters.temperature.min = document.getElementById('filter-temp-min').value || null;
        this.filters.temperature.max = document.getElementById('filter-temp-max').value || null;
        this.filters.discoveryYear.min = document.getElementById('filter-year-min').value || null;
        this.filters.discoveryYear.max = document.getElementById('filter-year-max').value || null;

        const methodSelect = document.getElementById('filter-method');
        this.filters.detectionMethod = Array.from(methodSelect.selectedOptions).map(opt => opt.value);

        this.filters.habitability = document.getElementById('filter-habitability').value || null;

        // Filter planets
        this.filterPlanets();

        this.trackEvent('filters_applied', { filterCount: Object.keys(this.filters).filter(k => this.filters[k] !== null).length });
        window.dispatchEvent(new CustomEvent('advanced-filters-applied', {
            detail: { filters: this.filters }
        }));
    }

    filterPlanets() {
        // Get all planet cards
        const planetCards = document.querySelectorAll('.planet-card, [data-kepid]');

        planetCards.forEach(card => {
            const planet = this.getPlanetData(card);
            const matches = this.matchesFilters(planet);

            if (matches) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        // Show results count
        const visibleCount = document.querySelectorAll('.planet-card:not([style*="display: none"]), [data-kepid]:not([style*="display: none"])').length;
        this.showResultsCount(visibleCount);
    }

    matchesFilters(planet) {
        // Check distance
        if (this.filters.distance.min && planet.distance && planet.distance < parseFloat(this.filters.distance.min)) return false;
        if (this.filters.distance.max && planet.distance && planet.distance > parseFloat(this.filters.distance.max)) return false;

        // Check radius
        if (this.filters.radius.min && planet.radius && planet.radius < parseFloat(this.filters.radius.min)) return false;
        if (this.filters.radius.max && planet.radius && planet.radius > parseFloat(this.filters.radius.max)) return false;

        // Check mass
        if (this.filters.mass.min && planet.mass && planet.mass < parseFloat(this.filters.mass.min)) return false;
        if (this.filters.mass.max && planet.mass && planet.mass > parseFloat(this.filters.mass.max)) return false;

        // Check discovery year
        if (this.filters.discoveryYear.min && planet.disc_year && planet.disc_year < parseInt(this.filters.discoveryYear.min)) return false;
        if (this.filters.discoveryYear.max && planet.disc_year && planet.disc_year > parseInt(this.filters.discoveryYear.max)) return false;

        // Check detection method
        if (this.filters.detectionMethod.length > 0) {
            const planetMethod = planet.detection_method || planet.method || '';
            if (!this.filters.detectionMethod.some(m => planetMethod.toLowerCase().includes(m.toLowerCase()))) {
                return false;
            }
        }

        // Check habitability
        if (this.filters.habitability) {
            const isHabitable = planet.habitability || planet.habitable_zone || false;
            if (this.filters.habitability === 'habitable' && !isHabitable) return false;
            if (this.filters.habitability === 'non-habitable' && isHabitable) return false;
        }

        return true;
    }

    getPlanetData(card) {
        // Extract planet data from card
        return {
            distance: parseFloat(card.dataset.distance) || null,
            radius: parseFloat(card.dataset.radius) || null,
            mass: parseFloat(card.dataset.mass) || null,
            disc_year: parseInt(card.dataset.discoveryYear || card.dataset.year) || null,
            detection_method: card.dataset.method || null,
            habitability: card.dataset.habitability === 'true' || false
        };
    }

    showResultsCount(count) {
        let countEl = document.getElementById('filter-results-count');
        if (!countEl) {
            countEl = document.createElement('div');
            countEl.id = 'filter-results-count';
            countEl.style.cssText = `
                padding: 1rem;
                background: rgba(186, 148, 79, 0.2);
                border: 1px solid rgba(186, 148, 79, 0.5);
                border-radius: 5px;
                margin: 1rem 0;
                color: #ba944f;
                text-align: center;
                font-weight: bold;
            `;
            const container = document.getElementById('advanced-search-filters');
            container.appendChild(countEl);
        }

        countEl.textContent = `Found ${count} planets matching filters`;
    }

    clearFilters() {
        // Reset all filter inputs
        document.getElementById('filter-distance-min').value = '';
        document.getElementById('filter-distance-max').value = '';
        document.getElementById('filter-radius-min').value = '';
        document.getElementById('filter-radius-max').value = '';
        document.getElementById('filter-mass-min').value = '';
        document.getElementById('filter-mass-max').value = '';
        document.getElementById('filter-period-min').value = '';
        document.getElementById('filter-period-max').value = '';
        document.getElementById('filter-temp-min').value = '';
        document.getElementById('filter-temp-max').value = '';
        document.getElementById('filter-year-min').value = '';
        document.getElementById('filter-year-max').value = '';
        document.getElementById('filter-method').selectedIndex = -1;
        document.getElementById('filter-habitability').value = '';

        // Reset filters object
        this.filters = {
            distance: { min: null, max: null },
            radius: { min: null, max: null },
            mass: { min: null, max: null },
            orbitalPeriod: { min: null, max: null },
            discoveryYear: { min: null, max: null },
            temperature: { min: null, max: null },
            stellarType: [],
            detectionMethod: [],
            habitability: null,
            atmosphere: []
        };

        // Show all planets
        document.querySelectorAll('.planet-card, [data-kepid]').forEach(card => {
            card.style.display = '';
        });

        // Remove results count
        const countEl = document.getElementById('filter-results-count');
        if (countEl) countEl.remove();
    }

    savePreset() {
        const name = prompt('Enter preset name:');
        if (!name) return;

        const preset = {
            id: `preset-${Date.now()}`,
            name: name,
            filters: { ...this.filters },
            createdAt: Date.now()
        };

        this.presets.push(preset);
        this.savePresets();
        this.renderPresets();
    }

    loadPresets() {
        try {
            const saved = localStorage.getItem('filter-presets');
            if (saved) {
                this.presets = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load presets:', e);
        }
    }

    savePresets() {
        try {
            localStorage.setItem('filter-presets', JSON.stringify(this.presets));
        } catch (e) {
            console.warn('Failed to save presets:', e);
        }
    }

    renderPresets() {
        if (this.presets.length === 0) {
            return '<span style="color: rgba(255,255,255,0.5);">No saved presets</span>';
        }

        return this.presets.map(preset => `
            <button class="preset-btn" data-preset-id="${preset.id}" 
                    style="padding: 0.5rem 1rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: #ba944f; cursor: pointer;">
                ${preset.name}
            </button>
        `).join('');
    }

    enhanceExistingSearch() {
        const searchInput = document.querySelector('input[type="search"], #search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`planet_search_filters_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_planet_search_filters', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize once even if a loader evaluates this bundle more than once.
function initAdvancedPlanetSearchFilters() {
    if (window.advancedPlanetSearchFilters || document.getElementById('advanced-search-filters')) return;
    window.advancedPlanetSearchFilters = new AdvancedPlanetSearchFilters();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedPlanetSearchFilters, { once: true });
} else {
    initAdvancedPlanetSearchFilters();
}

