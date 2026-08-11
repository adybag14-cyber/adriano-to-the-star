/* global Planet3DViewer */

// Advanced Database Features
// Includes: Advanced filters, favorites, export, comparison, notifications

class DatabaseAdvancedFeatures {
    constructor(databaseInstance) {
        this.db = databaseInstance;
        this.favorites = this.loadFavorites();
        this.comparisonList = [];
        this.notifications = [];
        this.init();
    }

    init() {
        this.createAdvancedFilters();
        this.createFavoritesButton();
        this.createExportButton();
        this.createComparisonButton();
        this.createNotificationSystem();
        this.setupEventListeners();
        this.trackEvent('db_adv_features_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_adv_features_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    // Load favorites from localStorage and Supabase
    loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('planet_favorites') || '[]');

        // Try to load from Supabase if authenticated
        if (typeof authManager !== 'undefined' && authManager && authManager.isAuthenticated()) {
            this.loadFavoritesFromSupabase().then(supabaseFavorites => {
                if (supabaseFavorites && supabaseFavorites.length > 0) {
                    // Merge and deduplicate
                    const merged = [...new Set([...favorites, ...supabaseFavorites])];
                    localStorage.setItem('planet_favorites', JSON.stringify(merged));
                    return merged;
                }
            }).catch(err => {
                console.error('Error loading favorites from Supabase:', err);
            });
        }

        return favorites;
    }

    async loadFavoritesFromSupabase() {
        if (!authManager || !authManager.isAuthenticated() || !authManager.supabase) {
            return [];
        }

        try {
            const user = authManager.getCurrentUser();
            if (!user || !user.id) return [];

            const { data, error } = await authManager.supabase
                .from('planet_favorites')
                .select('kepid')
                .eq('user_id', user.id);

            if (error) throw error;
            return data ? data.map(f => f.kepid) : [];
        } catch (err) {
            console.error('Supabase favorites error:', err);
            return [];
        }
    }

    // Save favorite to localStorage and Supabase
    async toggleFavorite(kepid) {
        const index = this.favorites.indexOf(kepid);

        if (index > -1) {
            // Remove favorite
            this.favorites.splice(index, 1);
            this.showNotification('Planet removed from favorites', 'info');
        } else {
            // Add favorite
            this.favorites.push(kepid);
            this.showNotification('Planet added to favorites', 'success');
        }

        // Save to localStorage
        localStorage.setItem('planet_favorites', JSON.stringify(this.favorites));

        // Save to Supabase if authenticated
        if (typeof authManager !== 'undefined' && authManager && authManager.isAuthenticated()) {
            await this.saveFavoriteToSupabase(kepid, index === -1);
        }

        // Update UI
        this.updateFavoriteButtons();
    }

    async saveFavoriteToSupabase(kepid, isFavorite) {
        if (!authManager || !authManager.isAuthenticated() || !authManager.supabase) {
            return;
        }

        try {
            const user = authManager.getCurrentUser();
            if (!user || !user.id) return;

            if (isFavorite) {
                // Add favorite
                const { error } = await authManager.supabase
                    .from('planet_favorites')
                    .insert({
                        user_id: user.id,
                        kepid: kepid,
                        created_at: new Date().toISOString()
                    });

                if (error && error.code !== '23505') { // Ignore duplicate key errors
                    throw error;
                }
            } else {
                // Remove favorite
                const { error } = await authManager.supabase
                    .from('planet_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('kepid', kepid);

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error saving favorite to Supabase:', err);
        }
    }

    // Create advanced filter controls
    createAdvancedFilters() {
        const filterContainer = document.getElementById('filter-buttons');
        if (!filterContainer) return;
        if (document.getElementById('advanced-filters')) return;

        const advancedFiltersHTML = `
            <div id="advanced-filters" style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border-radius: 15px; border: 2px solid rgba(186, 148, 79, 0.2);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <h3 style="color: #ba944f; margin: 0;">🔍 Advanced Filters</h3>
                    <button id="toggle-advanced-filters" style="background: transparent; border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                        <span id="advanced-filters-toggle-text">Show</span>
                    </button>
                </div>
                
                <div id="advanced-filters-content" style="display: none; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="filter-section">
                        <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Distance (ly):</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" id="filter-distance-min" placeholder="Min" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                            <input type="number" id="filter-distance-max" placeholder="Max" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Radius (Earth):</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" id="filter-radius-min" placeholder="Min" step="0.1" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                            <input type="number" id="filter-radius-max" placeholder="Max" step="0.1" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Mass (Earth):</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" id="filter-mass-min" placeholder="Min" step="0.1" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                            <input type="number" id="filter-mass-max" placeholder="Max" step="0.1" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Orbital Period (days):</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" id="filter-period-min" placeholder="Min" step="0.1" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                            <input type="number" id="filter-period-max" placeholder="Max" step="0.1" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Discovery Year:</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" id="filter-year-min" placeholder="Min" min="1990" max="2025" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                            <input type="number" id="filter-year-max" placeholder="Max" min="1990" max="2025" style="flex: 1; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        </div>
                    </div>
                </div>
            </div>
        `;

        filterContainer.insertAdjacentHTML('afterend', advancedFiltersHTML);

        // Toggle advanced filters
        const toggleBtn = document.getElementById('toggle-advanced-filters');
        const filtersContent = document.getElementById('advanced-filters-content');
        const toggleText = document.getElementById('advanced-filters-toggle-text');

        if (toggleBtn && filtersContent && toggleText) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = filtersContent.style.display !== 'none';
                filtersContent.style.display = isVisible ? 'none' : 'grid';
                toggleText.textContent = isVisible ? 'Show' : 'Hide';
            });
        }

        // Add filter event listeners
        this.setupAdvancedFilterListeners();
    }

    setupAdvancedFilterListeners() {
        const filterInputs = [
            'filter-distance-min', 'filter-distance-max',
            'filter-radius-min', 'filter-radius-max',
            'filter-mass-min', 'filter-mass-max',
            'filter-period-min', 'filter-period-max',
            'filter-year-min', 'filter-year-max'
        ];

        filterInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.applyAdvancedFilters();
                    }, 500);
                });
            }
        });
    }

    applyAdvancedFilters() {
        if (!this.db || !this.db.allData) return;

        const distanceMinInput = document.getElementById('filter-distance-min');
        const distanceMaxInput = document.getElementById('filter-distance-max');
        const radiusMinInput = document.getElementById('filter-radius-min');
        const radiusMaxInput = document.getElementById('filter-radius-max');
        const massMinInput = document.getElementById('filter-mass-min');
        const massMaxInput = document.getElementById('filter-mass-max');
        const periodMinInput = document.getElementById('filter-period-min');
        const periodMaxInput = document.getElementById('filter-period-max');
        const yearMinInput = document.getElementById('filter-year-min');
        const yearMaxInput = document.getElementById('filter-year-max');

        const filters = {
            distanceMin: parseFloat(distanceMinInput && distanceMinInput.value) || null,
            distanceMax: parseFloat(distanceMaxInput && distanceMaxInput.value) || null,
            radiusMin: parseFloat(radiusMinInput && radiusMinInput.value) || null,
            radiusMax: parseFloat(radiusMaxInput && radiusMaxInput.value) || null,
            massMin: parseFloat(massMinInput && massMinInput.value) || null,
            massMax: parseFloat(massMaxInput && massMaxInput.value) || null,
            periodMin: parseFloat(periodMinInput && periodMinInput.value) || null,
            periodMax: parseFloat(periodMaxInput && periodMaxInput.value) || null,
            yearMin: parseInt(yearMinInput && yearMinInput.value, 10) || null,
            yearMax: parseInt(yearMaxInput && yearMaxInput.value, 10) || null
        };

        // Apply filters to db.filteredData
        this.db.filteredData = this.db.filteredData.filter(planet => {
            if (filters.distanceMin !== null && (planet.distance || 0) < filters.distanceMin) return false;
            if (filters.distanceMax !== null && (planet.distance || 0) > filters.distanceMax) return false;
            if (filters.radiusMin !== null && (planet.radius || 0) < filters.radiusMin) return false;
            if (filters.radiusMax !== null && (planet.radius || 0) > filters.radiusMax) return false;
            if (filters.massMin !== null && (planet.mass || 0) < filters.massMin) return false;
            if (filters.massMax !== null && (planet.mass || 0) > filters.massMax) return false;
            if (filters.periodMin !== null && (planet.orbital_period || 0) < filters.periodMin) return false;
            if (filters.periodMax !== null && (planet.orbital_period || 0) > filters.periodMax) return false;
            if (filters.yearMin !== null && (planet.disc_year || 0) < filters.yearMin) return false;
            if (filters.yearMax !== null && (planet.disc_year || 0) > filters.yearMax) return false;
            return true;
        });

        // Re-render page
        this.db.currentPage = 1;
        this.db.renderPage();
    }

    // Create favorites button
    createFavoritesButton() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        const favoritesHTML = `
            <div style="margin-bottom: 1rem; text-align: right;">
                <button id="view-favorites-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                    ⭐ Favorites (${this.favorites.length})
                </button>
            </div>
        `;

        const searchContainer = container.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.insertAdjacentHTML('afterend', favoritesHTML);
        }

        const viewFavoritesBtn = document.getElementById('view-favorites-btn');
        if (viewFavoritesBtn) {
            viewFavoritesBtn.addEventListener('click', () => {
                this.showFavorites();
            });
        }
    }

    showFavorites() {
        if (this.favorites.length === 0) {
            this.showNotification('No favorites yet. Click the ⭐ button on any planet to add it!', 'info');
            return;
        }

        // Filter to show only favorites
        this.db.filteredData = this.db.allData.filter(p => this.favorites.includes(p.kepid));
        this.db.currentPage = 1;
        this.db.renderPage();
        this.showNotification(`Showing ${this.favorites.length} favorite planet(s)`, 'success');
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const kepid = parseInt(btn.dataset.kepid);
            if (this.favorites.includes(kepid)) {
                btn.textContent = '⭐';
                btn.title = 'Remove from favorites';
            } else {
                btn.textContent = '☆';
                btn.title = 'Add to favorites';
            }
        });
    }

    // Create export button
    createExportButton() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        const exportHTML = `
            <div style="margin-bottom: 1rem; text-align: right;">
                <button id="export-data-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; margin-left: 0.5rem;">
                    📥 Export Data
                </button>
            </div>
        `;

        const viewFavoritesBtn = document.getElementById('view-favorites-btn');
        if (viewFavoritesBtn) {
            viewFavoritesBtn.insertAdjacentHTML('afterend', exportHTML);
        }

        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportMenu();
            });
        }
    }

    showExportMenu() {
        const menu = document.createElement('div');
        menu.id = 'export-menu';
        menu.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.95); border: 2px solid #ba944f; border-radius: 15px; padding: 2rem; z-index: 10000; min-width: 300px;';
        menu.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="color: #ba944f; margin: 0;">📥 Export Data</h3>
                <button onclick="this.closest('#export-menu').remove()" style="background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button onclick="window.databaseAdvancedFeatures.exportData('csv', 'all')" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                    📄 Export All (CSV)
                </button>
                <button onclick="window.databaseAdvancedFeatures.exportData('csv', 'filtered')" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                    📄 Export Filtered (CSV)
                </button>
                <button onclick="window.databaseAdvancedFeatures.exportData('json', 'all')" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                    📋 Export All (JSON)
                </button>
                <button onclick="window.databaseAdvancedFeatures.exportData('json', 'filtered')" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                    📋 Export Filtered (JSON)
                </button>
            </div>
        `;
        document.body.appendChild(menu);
    }

    exportData(format, scope) {
        const data = scope === 'all' ? this.db.allData : this.db.filteredData;

        if (format === 'csv') {
            this.exportToCSV(data);
        } else {
            this.exportToJSON(data);
        }

        const exportMenu = document.getElementById('export-menu');
        if (exportMenu) {
            exportMenu.remove();
        }
    }

    exportToCSV(data) {
        if (data.length === 0) {
            this.showNotification('No data to export', 'error');
            return;
        }

        const headers = ['KEPID', 'Name', 'Kepler Name', 'Status', 'Type', 'Radius (Earth)', 'Mass (Earth)', 'Distance (ly)', 'Discovery Year', 'Availability'];
        const rows = data.map(planet => [
            planet.kepid || '',
            planet.kepoi_name || '',
            planet.kepler_name || '',
            planet.status || '',
            planet.type || '',
            planet.radius || '',
            planet.mass || '',
            planet.distance || '',
            planet.disc_year || '',
            planet.availability || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `exoplanets_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showNotification(`Exported ${data.length} planets to CSV`, 'success');
    }

    exportToJSON(data) {
        if (data.length === 0) {
            this.showNotification('No data to export', 'error');
            return;
        }

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `exoplanets_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification(`Exported ${data.length} planets to JSON`, 'success');
    }

    // Create comparison button
    createComparisonButton() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        const comparisonHTML = `
            <div style="margin-bottom: 1rem; text-align: right;">
                <button id="compare-planets-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; margin-left: 0.5rem;">
                    ⚖️ Compare (${this.comparisonList.length})
                </button>
            </div>
        `;

        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.insertAdjacentHTML('afterend', comparisonHTML);
        }

        const compareBtn = document.getElementById('compare-planets-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.showComparison();
            });
        }
    }

    toggleComparison(kepid) {
        const index = this.comparisonList.indexOf(kepid);
        if (index > -1) {
            this.comparisonList.splice(index, 1);
            this.showNotification('Planet removed from comparison', 'info');
        } else {
            if (this.comparisonList.length >= 5) {
                this.showNotification('Maximum 5 planets can be compared', 'error');
                return;
            }
            this.comparisonList.push(kepid);
            this.showNotification('Planet added to comparison', 'success');
        }
        this.updateComparisonButton();
    }

    updateComparisonButton() {
        const btn = document.getElementById('compare-planets-btn');
        if (btn) {
            btn.textContent = `⚖️ Compare (${this.comparisonList.length})`;
        }
    }

    showComparison() {
        if (this.comparisonList.length === 0) {
            this.showNotification('No planets selected for comparison. Click the ⚖️ button on planets to add them!', 'info');
            return;
        }

        const planets = this.comparisonList.map(kepid =>
            this.db.allData.find(p => p.kepid === kepid)
        ).filter(p => p);

        const modal = document.createElement('div');
        modal.id = 'comparison-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 10000; overflow-y: auto; padding: 2rem;';
        modal.innerHTML = `
            <div style="max-width: 1400px; margin: 0 auto; background: rgba(0, 0, 0, 0.8); border: 2px solid #ba944f; border-radius: 15px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f; margin: 0;">⚖️ Planet Comparison</h2>
                    <button onclick="document.getElementById('comparison-modal').remove()" style="background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; color: white;">
                        <thead>
                            <tr style="background: rgba(186, 148, 79, 0.2);">
                                <th style="padding: 1rem; border: 1px solid rgba(186, 148, 79, 0.3); text-align: left;">Property</th>
                                ${planets.map(p => `<th style="padding: 1rem; border: 1px solid rgba(186, 148, 79, 0.3); text-align: center;">${p.kepler_name || p.kepoi_name || `KOI-${p.kepid}`}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>KEPID</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.kepid}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Status</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.status || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Type</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.type || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Radius (Earth)</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.radius ? p.radius.toFixed(2) : 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Mass (Earth)</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.mass ? p.mass.toFixed(2) : 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Distance (ly)</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.distance ? p.distance.toFixed(0) : 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Discovery Year</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.disc_year || 'N/A'}</td>`).join('')}
                            </tr>
                            <tr>
                                <td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2);"><strong>Availability</strong></td>
                                ${planets.map(p => `<td style="padding: 0.75rem; border: 1px solid rgba(186, 148, 79, 0.2); text-align: center;">${p.availability || 'available'}</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                    <button id="export-comparison-btn" style="padding: 0.75rem 2rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); color: #4ade80; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        📥 Export CSV
                    </button>
                    <button id="share-comparison-btn" style="padding: 0.75rem 2rem; background: rgba(96, 165, 250, 0.2); border: 2px solid rgba(96, 165, 250, 0.5); color: #60a5fa; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        🔗 Share
                    </button>
                    <button onclick="document.getElementById('comparison-modal').remove()" style="padding: 0.75rem 2rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add export functionality
        const exportBtn = document.getElementById('export-comparison-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportComparison(planets));
        }

        // Add share functionality
        const shareBtn = document.getElementById('share-comparison-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareComparison(planets));
        }

        // Add visual charts/graphs
        this.addComparisonCharts(modal, planets);
    }

    /**
     * Export comparison data to CSV
     */
    exportComparison(planets) {
        const headers = ['Property', ...planets.map(p => p.kepler_name || p.kepoi_name || `KOI-${p.kepid}`)];
        const rows = [
            ['KEPID', ...planets.map(p => p.kepid)],
            ['Status', ...planets.map(p => p.status || 'N/A')],
            ['Type', ...planets.map(p => p.type || 'N/A')],
            ['Radius (Earth)', ...planets.map(p => p.radius ? p.radius.toFixed(2) : 'N/A')],
            ['Mass (Earth)', ...planets.map(p => p.mass ? p.mass.toFixed(2) : 'N/A')],
            ['Distance (ly)', ...planets.map(p => p.distance ? p.distance.toFixed(0) : 'N/A')],
            ['Discovery Year', ...planets.map(p => p.disc_year || 'N/A')],
            ['Availability', ...planets.map(p => p.availability || 'available')]
        ];

        const csv = [headers, ...rows].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planet-comparison-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Comparison exported to CSV!', 'success');
    }

    /**
     * Share comparison via Web Share API or clipboard
     */
    shareComparison(planets) {
        const planetNames = planets.map(p => p.kepler_name || p.kepoi_name || `KOI-${p.kepid}`).join(', ');
        const shareText = `Planet Comparison: ${planetNames}`;
        const shareUrl = `${window.location.origin}${window.location.pathname}?comparison=${planets.map(p => p.kepid).join(',')}`;

        if (navigator.share) {
            navigator.share({
                title: 'Planet Comparison',
                text: shareText,
                url: shareUrl
            }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareUrl);
                this.showNotification('Comparison link copied to clipboard!', 'success');
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            this.showNotification('Comparison link copied to clipboard!', 'success');
        }
    }

    /**
     * Add visual charts/graphs to comparison modal
     */
    addComparisonCharts(modal, planets) {
        const chartsContainer = document.createElement('div');
        chartsContainer.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(0, 0, 0, 0.5); border-radius: 10px;';
        chartsContainer.innerHTML = `
            <h3 style="color: #ba944f; margin-bottom: 1rem;">📊 Visual Comparison</h3>
            <div id="comparison-charts" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                <!-- Charts will be added here -->
            </div>
        `;

        const modalContent = modal.querySelector('div[style*="max-width"]');
        if (modalContent) {
            modalContent.appendChild(chartsContainer);
        }

        const chartsDiv = document.getElementById('comparison-charts');
        if (!chartsDiv) return;

        // Radius comparison chart
        const radiusChart = this.createBarChart('Radius (Earth Radii)', planets, 'radius', '#4ade80');
        chartsDiv.appendChild(radiusChart);

        // Mass comparison chart
        const massChart = this.createBarChart('Mass (Earth Masses)', planets, 'mass', '#60a5fa');
        chartsDiv.appendChild(massChart);

        // Distance comparison chart
        const distanceChart = this.createBarChart('Distance (Light Years)', planets, 'distance', '#f59e0b');
        chartsDiv.appendChild(distanceChart);
    }

    /**
     * Create a simple bar chart for comparison
     */
    createBarChart(title, planets, property, color) {
        const chartDiv = document.createElement('div');
        chartDiv.style.cssText = 'background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(186, 148, 79, 0.3);';

        const maxValue = Math.max(...planets.map(p => p[property] || 0), 1);
        const chartHeight = 200;

        let chartHTML = `<h4 style="color: ${color}; margin: 0 0 1rem 0; font-size: 1rem;">${title}</h4>`;
        chartHTML += `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;

        planets.forEach(planet => {
            if (!planet) return;
            const value = planet[property] || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const planetName = String(planet.kepler_name || planet.kepoi_name || `KOI-${planet.kepid || 'Unknown'}`);

            chartHTML += `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="min-width: 120px; font-size: 0.85rem; color: rgba(255,255,255,0.8);">${planetName.substring(0, 15)}</div>
                    <div style="flex: 1; height: 24px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; position: relative;">
                        <div style="height: 100%; width: ${percentage}%; background: ${color}; transition: width 0.5s ease;"></div>
                        <div style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); font-size: 0.75rem; color: white; font-weight: 600;">
                            ${value ? value.toFixed(2) : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        });

        chartHTML += `</div>`;
        chartDiv.innerHTML = chartHTML;
        return chartDiv;
    }

    // Create notification system
    createNotificationSystem() {
        // Pre-reserve the notification container to avoid layout shifts on first insertion
        if (document.getElementById('notification-container')) return;
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            width: 0;
            height: 0;
            overflow: visible;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        const colors = {
            success: '#4ade80',
            error: '#f87171',
            info: '#60a5fa',
            warning: '#fbbf24'
        };

        notification.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid ${colors[type] || colors.info};
            border-radius: 10px;
            padding: 1rem 1.5rem;
            color: white;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Add favorite and comparison buttons to planet cards when they're rendered
        const originalRender = this.db.renderPage.bind(this.db);
        this.db.renderPage = () => {
            originalRender();
            // Wait a bit for DOM to update, then add buttons
            setTimeout(() => {
                this.addActionButtonsToCards();
                this.updateFavoriteButtons();
            }, 100);
        };

        // Also listen for mutations in case cards are added dynamically
        const observer = new MutationObserver(() => {
            const cards = document.querySelectorAll('.planet-card');
            if (cards.length > 0) {
                this.addActionButtonsToCards();
                this.updateFavoriteButtons();
            }
        });

        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            observer.observe(resultsContainer, { childList: true, subtree: true });
        }
    }

    addActionButtonsToCards() {
        document.querySelectorAll('.planet-card').forEach(card => {
            if (card.classList.contains('ita-planet-card')) return;
            const kepid = parseInt(card.dataset.kepid);
            if (!kepid || isNaN(kepid)) return;

            // Check if buttons already exist
            const existingActions = card.querySelector('.planet-actions');
            if (existingActions) return;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'planet-actions';
            actionsDiv.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 0.5rem;';

            // View 3D button
            const view3DBtn = document.createElement('button');
            view3DBtn.className = 'view-3d-btn';
            view3DBtn.dataset.kepid = kepid;
            view3DBtn.textContent = '🪐';
            view3DBtn.title = 'View in 3D';
            view3DBtn.style.cssText = 'flex: 1; background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem; border-radius: 5px; cursor: pointer; font-size: 1rem; font-weight: 600;';
            view3DBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const planet = this.db.allData.find(p => p.kepid === kepid);
                if (planet) {
                    if (!window.Planet3DViewer) {
                        this.showNotification('3D Viewer not available', 'error');
                        return;
                    }
                    const viewer = new Planet3DViewer();
                    viewer.visualizePlanet(planet);
                }
            });

            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.dataset.kepid = kepid;
            favoriteBtn.textContent = this.favorites.includes(kepid) ? '⭐' : '☆';
            favoriteBtn.title = this.favorites.includes(kepid) ? 'Remove from favorites' : 'Add to favorites';
            favoriteBtn.style.cssText = 'background: transparent; border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem; border-radius: 5px; cursor: pointer; font-size: 1.2rem;';
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(kepid);
            });

            const compareBtn = document.createElement('button');
            compareBtn.className = 'compare-btn';
            compareBtn.dataset.kepid = kepid;
            compareBtn.textContent = '⚖️';
            compareBtn.title = 'Add to comparison';
            compareBtn.style.cssText = 'background: transparent; border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem; border-radius: 5px; cursor: pointer; font-size: 1.2rem;';
            compareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleComparison(kepid);
            });

            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn';
            shareBtn.dataset.kepid = kepid;
            shareBtn.textContent = '🔗';
            shareBtn.title = 'Share planet';
            shareBtn.style.cssText = 'background: transparent; border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem; border-radius: 5px; cursor: pointer; font-size: 1.2rem;';
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.sharePlanet(kepid);
            });

            actionsDiv.appendChild(view3DBtn);
            actionsDiv.appendChild(favoriteBtn);
            actionsDiv.appendChild(compareBtn);
            actionsDiv.appendChild(shareBtn);

            const claimBtn = card.querySelector('.claim-button');
            if (claimBtn) {
                claimBtn.parentNode.insertBefore(actionsDiv, claimBtn);
            } else {
                card.appendChild(actionsDiv);
            }
        });
    }

    sharePlanet(kepid) {
        const planet = this.db.allData.find(p => p.kepid === kepid);
        if (!planet) return;

        const planetName = planet.kepler_name || planet.kepoi_name || `KOI-${kepid}`;
        const shareText = `Check out this exoplanet: ${planetName} (KEPID: ${kepid}) - ${planet.type || 'Unknown type'} planet`;
        const shareUrl = `${window.location.origin}${window.location.pathname}?planet=${kepid}`;

        if (navigator.share) {
            navigator.share({
                title: `Exoplanet: ${planetName}`,
                text: shareText,
                url: shareUrl
            }).catch(err => {
                console.log('Share cancelled:', err);
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
                this.showNotification('Planet link copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotification('Unable to copy link', 'error');
            });
        }
    }
}

// Initialize when database is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.databaseInstance) {
                window.databaseAdvancedFeatures = new DatabaseAdvancedFeatures(window.databaseInstance);
            }
        }, 2000);
    });
}

