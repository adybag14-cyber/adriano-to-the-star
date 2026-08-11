/* global Planet3DViewer */

/**
 * Optimized Database System with Pagination & Statistics
 * 
 * Handles loading, filtering, searching, and displaying exoplanet data from:
 * - Kepler database (kepler_data_parsed.js)
 * - Large exoplanet dataset (optional, loaded asynchronously)
 * 
 * Features:
 * - Real-time search with debouncing
 * - Advanced filtering (status, type, availability)
 * - Pagination for performance
 * - Statistics calculation
 * - Planet claiming system
 * - User claims integration (Supabase + localStorage)
 * 
 * @class OptimizedDatabase
 * @example
 * const database = new OptimizedDatabase();
 * // Database auto-initializes and loads data
 */
class OptimizedDatabase {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.currentPage = 1;
        const isNarrowScreen = typeof window !== 'undefined' && window && typeof window.innerWidth === 'number' && window.innerWidth < 768;
        this.itemsPerPage = isNarrowScreen ? 24 : 50;
        this.searchTerm = '';
        this.activeFilters = {
            status: 'all',
            type: 'all',
            availability: 'all'
        };
        this.rangeFilters = {
            radiusMin: null,
            radiusMax: null,
            distanceMin: null,
            distanceMax: null,
            yearMin: null,
            yearMax: null
        };
        this.selectedPlanetKepid = null;
        this.stats = {
            total: 0,
            confirmed: 0,
            candidates: 0,
            earthLike: 0,
            superEarths: 0,
            gasGiants: 0,
            miniNeptunes: 0,
            available: 0,
            claimed: 0,
            avgRadius: '0.00',
            avgDistance: '0'
        };
        this.largeDatasetLoader = null;
        this.largeDatasetLoaded = false;
        this.isClaiming = false; // Prevent race conditions
        this.searchIndex = new Map(); // Search index for fast lookups
        this.indexBuilt = false; // Track if index is built
        this.lastSearchLogQuery = '';
        this.lastSearchLogTime = 0;
        this.renderGeneration = 0; // Track batched render cycles
        this.scrollResultsAfterInteraction = false;
        if (typeof document !== 'undefined') {
            const markResultNavigation = (event) => {
                const target = event.target && event.target.closest
                    ? event.target.closest('#nasa-data-container input, #nasa-data-container select, #nasa-data-container [data-quick-filter], #nasa-data-container .pagination-button, #nasa-data-container .page-button')
                    : null;
                if (target) this.scrollResultsAfterInteraction = true;
            };
            document.addEventListener('pointerdown', markResultNavigation, true);
            document.addEventListener('keydown', markResultNavigation, true);
            document.addEventListener('change', markResultNavigation, true);
        }
        this.init();
    }

    /**
     * Normalize kepid to number for consistent comparison
     * Handles string, number, and edge cases
     * @param {string|number} kepid - The kepid to normalize
     * @returns {number} Normalized kepid as number
     */
    normalizeKepid(kepid) {
        if (kepid === null || kepid === undefined) return null;
        const num = typeof kepid === 'string' ? parseInt(kepid, 10) : Number(kepid);
        return isNaN(num) ? null : num;
    }

    /**
     * Compare two kepids for equality (handles type mismatches)
     * @param {string|number} kepid1 - First kepid
     * @param {string|number} kepid2 - Second kepid
     * @returns {boolean} True if kepids match
     */
    compareKepid(kepid1, kepid2) {
        const n1 = this.normalizeKepid(kepid1);
        const n2 = this.normalizeKepid(kepid2);
        if (n1 === null || n2 === null) return false;
        return n1 === n2;
    }

    /**
     * Show enhanced empty state with helpful suggestions
     * Provides contextual help based on current filters/search
     */
    /**
     * Show enhanced empty state with helpful suggestions
     * Provides contextual help based on current filters/search
     */
    showEmptyState(container) {
        const hasSearch = this.searchTerm && this.searchTerm.length >= 2;
        const hasFilters = this.activeFilters.status !== 'all' ||
            this.activeFilters.type !== 'all' ||
            this.activeFilters.availability !== 'all';

        const suggestions = [];
        let actionButtonConfig = null;

        if (hasSearch) {
            suggestions.push('Try a different search term');
            suggestions.push('Check for typos in your search');
            suggestions.push('Search by planet name, type, or KEPID');
            actionButtonConfig = {
                text: 'Clear Search',
                handler: () => {
                    const input = document.getElementById('planet-search');
                    if (input) {
                        input.value = '';
                        input.dispatchEvent(new Event('input'));
                    }
                }
            };
        } else if (hasFilters) {
            suggestions.push('Try removing some filters');
            suggestions.push('Check if filters are too restrictive');
            suggestions.push('Try different filter combinations');
            actionButtonConfig = {
                text: 'Reset Filters',
                handler: () => {
                    const btn = document.getElementById('reset-filters');
                    if (btn) btn.click();
                }
            };
        } else {
            suggestions.push('Browse all planets in the database');
            suggestions.push('Try searching by planet name or KEPID');
            suggestions.push('Explore confirmed planets');
            suggestions.push('Filter by planet type or status');
        }

        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, rgba(186, 148, 79, 0.1), rgba(186, 148, 79, 0.05)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 20px; margin: 2rem 0;">
                <div style="font-size: 5rem; margin-bottom: 1.5rem; animation: float 3s ease-in-out infinite;">🔭</div>
                <h3 style="color: #ba944f; margin-bottom: 0.5rem; font-size: 1.8rem; font-weight: 600;">No planets found</h3>
                <p style="opacity: 0.8; margin-bottom: 2rem; font-size: 1.1rem;">We couldn't find any planets matching your criteria</p>
                
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 1.5rem; margin: 2rem auto; max-width: 500px; text-align: left;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.1rem; text-align: center;">💡 Suggestions:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${suggestions.map(s => `<li style="padding: 0.5rem 0; opacity: 0.9; display: flex; align-items: start;"><span style="margin-right: 0.5rem; color: #ba944f;">•</span><span>${s}</span></li>`).join('')}
                    </ul>
                </div>
                
                <div id="empty-state-action-container"></div>
            </div>
            <style>
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            </style>
        `;

        if (actionButtonConfig) {
            const actionContainer = container.querySelector('#empty-state-action-container');
            if (actionContainer) {
                const btn = document.createElement('button');
                btn.textContent = actionButtonConfig.text;
                btn.style.cssText = 'padding: 0.75rem 2rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; border-radius: 10px; cursor: pointer; font-weight: 600; margin-top: 1rem; transition: all 0.3s ease;';
                btn.addEventListener('click', actionButtonConfig.handler);
                actionContainer.appendChild(btn);
            }
        }
    }

    /**
     * Initialize the database system
     * 
     * Shows skeleton loader immediately for better UX, then loads exoplanet data.
     * This is the entry point for the database system.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        // Show skeleton loader immediately for better UX
        try {
            this.createStatsSection();
            this.createSearchBar();
            this.createFilterButtons();

            const resultsContainer = document.getElementById('nasa-data-container') || document.getElementById('results-container');
            if (resultsContainer) {
                this.showSkeletonLoader(resultsContainer);
            }
        } catch (e) { }

        try {
            if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                window.databaseDebug('Initializing optimized database – loading data...');
            }
        } catch (e) { }

        try {
            // Initialize Galactic Events
            if (window.galacticEventsManager && !window.galacticEventsManager.isInitialized) {
                window.galacticEventsManager.init();
                window.galacticEventsManager.notifyUI(); // Initial render
            } else if (window.galacticEventsManager) {
                window.galacticEventsManager.notifyUI();
            }

            // Load data first (async)
            await this.loadData();
            this.setupDelegatedEvents();
            this.trackEvent('db_optimized_initialized');

            try {
                if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                    const total = this.allData && typeof this.allData.length === 'number' ? this.allData.length : 0;
                    window.databaseDebug('Optimized database initialized with ' + String(total) + ' planets');
                }
            } catch (e) { }
        } catch (error) {
            console.error('❌ OptimizedDatabase.init loadData() failed:', error);
            try {
                if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                    window.databaseDebug('Error initializing database: ' + (error && error.message ? String(error.message) : 'Unknown error'));
                }
            } catch (e) { }
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_optimized_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Show skeleton loader matching planet card layout
     * 
     * Provides better perceived performance and professional appearance.
     * Displays animated placeholder cards while data loads.
     * 
     * @private
     * @param {HTMLElement} container - Container element to display skeleton loader in
     * @returns {void}
     */
    /**
     * Setup delegated event listeners for planet cards
     * Handles clicks on Wishlist, Share, 3D View, etc. without inline handlers
     */
    setupDelegatedEvents() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const kepid = btn.dataset.kepid;
            if (!kepid) return;

            // Find planet data
            const planet = this.allData.find(p => this.compareKepid(p.kepid, kepid));
            if (!planet) return;

            if (btn.classList.contains('wishlist-btn')) {
                if (typeof window.toggleWishlist === 'function') window.toggleWishlist(kepid, planet);
            } else if (btn.classList.contains('share-btn')) {
                if (typeof window.sharePlanet === 'function') window.sharePlanet(planet);
            } else if (btn.classList.contains('claim-button')) {
                if (typeof window.claimPlanet === 'function') window.claimPlanet(kepid);
            } else if (btn.classList.contains('view-3d-btn')) {
                if (typeof window.viewPlanet3D === 'function') window.viewPlanet3D(kepid);
            } else if (btn.classList.contains('habitability-btn')) {
                if (typeof window.analyzeHabitability === 'function') window.analyzeHabitability(kepid);
            } else if (btn.classList.contains('details-btn')) {
                if (typeof window.showPlanetDetails === 'function') window.showPlanetDetails(kepid);
            } else if (btn.classList.contains('rarity-btn')) {
                if (typeof window.showPlanetRarity === 'function') window.showPlanetRarity(planet);
            } else if (btn.classList.contains('bookmark-btn')) {
                if (typeof window.toggleBookmark === 'function') window.toggleBookmark(kepid, planet);
            } else if (btn.classList.contains('compare-btn')) {
                if (typeof window.addToComparison === 'function') window.addToComparison(kepid, planet);
            }
        });
    }

    /**
     * Show skeleton loader matching planet card layout
     * @returns {void}
     */
    showSkeletonLoader(container) {
        const skeletonCount = 6; // Show 6 skeleton cards
        const skeletonHTML = Array(skeletonCount).fill(0).map(() => `
            <div class="planet-card-skeleton" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div class="skeleton-planet-icon" style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite;"></div>
                    <div style="text-align: right;">
                        <div class="skeleton-badge" style="width: 80px; height: 24px; border-radius: 20px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; margin-bottom: 0.5rem;"></div>
                        <div class="skeleton-icon" style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; margin-left: auto;"></div>
                    </div>
                </div>
                
                <div class="skeleton-title" style="width: 70%; height: 24px; border-radius: 4px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; margin: 0.5rem 0;"></div>
                
                <div class="skeleton-subtitle" style="width: 50%; height: 16px; border-radius: 4px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; margin-bottom: 1rem;"></div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1rem 0;">
                    ${Array(4).fill(0).map(() => `
                        <div>
                            <div class="skeleton-label" style="width: 60%; height: 12px; border-radius: 4px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.15), rgba(186, 148, 79, 0.3), rgba(186, 148, 79, 0.15)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton-value" style="width: 80%; height: 16px; border-radius: 4px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite;"></div>
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <div class="skeleton-score" style="flex: 1; height: 60px; border-radius: 8px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.15), rgba(186, 148, 79, 0.3), rgba(186, 148, 79, 0.15)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite;"></div>
                    <div class="skeleton-year" style="flex: 1; height: 60px; border-radius: 8px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.15), rgba(186, 148, 79, 0.3), rgba(186, 148, 79, 0.15)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite;"></div>
                </div>
                
                <div class="skeleton-button" style="width: 100%; height: 44px; border-radius: 10px; background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2)); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite; margin-top: 1rem;"></div>
            </div>
        `).join('');

        container.innerHTML = `
            <style>
                @keyframes skeleton-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            </style>
            <div class="planets-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                ${skeletonHTML}
            </div>
        `;
    }

    /**
     * Load exoplanet data from multiple sources
     * 
     * Loads data from:
     * 1. Kepler database (kepler_data_parsed.js) - primary source
     * 2. Large exoplanet dataset (optional, loaded asynchronously)
     * 
     * Merges datasets avoiding duplicates and calculates statistics.
     * 
     * @async
     * @method loadData
     * @returns {Promise<void>}
     */
    async loadData() {
        console.log('🚀 Loading Kepler database...');

        // Keep skeleton loader while data loads (better UX)
        // Skeleton loader already shown in init()

        // Re-acquire the main container here so we can safely clear the skeleton
        // once data is ready, without depending on variables from init().
        const container = document.getElementById('nasa-data-container');

        let keplerData = [];
        // Check both global variable and window property
        const db = (typeof KEPLER_DATABASE !== 'undefined') ? KEPLER_DATABASE : window.KEPLER_DATABASE;

        if (db) {
            const allKeplerPlanets = db.allPlanets || db.highQuality || [];
            keplerData = allKeplerPlanets.map(planet => ({
                kepid: planet.kepid,
                kepoi_name: planet.kepoi_name || `KOI-${planet.kepid}`,
                kepler_name: planet.kepler_name || null,
                status: planet.status,
                score: planet.score || 0,
                radius: this.estimateRadius(planet),
                mass: this.estimateMass(planet),
                distance: this.estimateDistance(planet.kepid),
                disc_year: this.estimateDiscoveryYear(planet),
                type: this.classifyPlanet(this.estimateRadius(planet)),
                availability: 'available',
                source: 'kepler'
            }));
            console.log(`✅ Loaded ${keplerData.length} exoplanets from Kepler database`);
        } else {
            // Fallback sample data
            keplerData = this.generateSampleData(100);
            console.log('⚠️ Using sample data (100 planets)');
        }

        // Start with Kepler data
        this.allData = [...keplerData];

        // Build search index for initial data
        this.buildSearchIndex();

        // Try to load large dataset asynchronously (non-blocking)
        // Don't wait for it - load it in background and merge when ready
        this.loadLargeDataset().then(() => {
            // Merge datasets when large dataset is loaded
            this.mergeDatasets();
            // Rebuild search index after merging
            this.indexBuilt = false;
            this.buildSearchIndex();
            this.calculateStatistics();
            this.createStatsSection();
            // Update filters with new stats
            this.createFilterButtons();
            // Re-render with updated data
            if (this.filteredData.length > 0) {
                this.renderPage();
            }
        }).catch(error => {
            console.log('⚠️ Large dataset loading failed or not available:', error.message);
            // Continue with just Kepler data - no action needed
        });

        // Continue with just Kepler data for now (don't wait for large dataset)
        // mergeDatasets() will be called when large dataset loads, or skipped if it doesn't

        this.filteredData = [...this.allData];
        this.calculateStatistics();

        // Update statistics display after data is loaded
        this.createStatsSection();
        this.renderPlanetOfDayCard();

        // Update UI
        if (!document.getElementById('results-container')) {
            this.createSearchBar();
        }
        this.createFilterButtons();

        // Apply any state encoded in the URL (search, filters, page) and then render
        this.applyStateFromURL();
        this.applyLastSearchFromHistoryIfNeeded();

        // Load user claims asynchronously (non-blocking)
        this.loadUserClaims().catch(error => {
            console.log('⚠️ Could not load user claims:', error.message);
        });
    }

    /**
     * Load large exoplanet dataset from external sources
     * 
     * Attempts to load additional exoplanet data from JSON/JSONL files.
     * Tries multiple possible file paths and handles timeouts gracefully.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If loading times out after 10 seconds
     */
    async loadLargeDataset() {
        // Primary locations for large dataset
        const possiblePaths = [
            'data/exoplanets.jsonl',
            'data/exoplanets.json'
        ];

        // Initialize loader if available
        if (typeof LargeExoplanetLoader !== 'undefined') {
            this.largeDatasetLoader = new LargeExoplanetLoader();
        } else {
            console.warn('⚠️ LargeExoplanetLoader not available');
            return;
        }

        // Add timeout to prevent hanging (10 seconds max)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Large dataset loading timeout')), 10000);
        });

        // Try to load from paths with timeout
        for (const filePath of possiblePaths) {
            try {
                console.log(`🔍 Trying to load large dataset from: ${filePath}`);
                const loadPromise = this.largeDatasetLoader.loadLargeDataset(filePath);
                const largeData = await Promise.race([loadPromise, timeoutPromise]);

                if (largeData && largeData.length > 0) {
                    console.log(`✅ Successfully loaded ${largeData.length.toLocaleString()} exoplanets from large dataset`);
                    this.largeDatasetLoaded = true;
                    return;
                }
            } catch (error) {
                // File not found or timeout, try next path
                if (error.message.includes('timeout')) {
                    console.log(`⏱️ Timeout loading ${filePath} - skipping large dataset`);
                    break; // Don't try other paths if we timed out
                } else {
                    console.log(`   File not found: ${filePath} - ${error.message}`);
                    continue;
                }
            }
        }

        console.log('⚠️ Large dataset file not found or timed out. Using Kepler data only.');
    }

    // Merge datasets, avoiding duplicates
    /**
     * Merge large dataset with existing Kepler data
     * 
     * Combines datasets while avoiding duplicates based on kepid.
     * Prioritizes confirmed planets and updates statistics.
     * 
     * @private
     * @returns {void}
     */
    mergeDatasets() {
        if (!this.largeDatasetLoader || !this.largeDatasetLoaded) {
            console.log('📊 Using Kepler database only');
            return;
        }

        const largeData = this.largeDatasetLoader.largeDataset;
        if (!largeData || largeData.length === 0) {
            console.log('⚠️ Large dataset is empty');
            return;
        }

        // Create a set of unique identifiers: kepid + kepoi_name combination
        // This ensures we don't count the same planet twice, but allows multiple planets per star
        const existingPlanets = new Set(
            this.allData.map(p => {
                // Use both kepid and kepoi_name to create unique identifier
                return `${p.kepid || 'unknown'}_${p.kepoi_name || 'unknown'}`;
            })
        );

        // Add large dataset records that aren't duplicates
        let added = 0;
        let skipped = 0;

        largeData.forEach((planet, idx) => {
            // Create unique identifier for this planet
            const planetId = `${planet.kepid || 'unknown'}_${planet.kepoi_name || 'unknown'}`;

            // Check if this exact planet (kepid + kepoi_name combination) already exists
            const isDuplicate = existingPlanets.has(planetId);

            if (!isDuplicate) {
                const planetIndex = this.allData.length; // Get index before push
                this.allData.push(planet);
                existingPlanets.add(planetId);
                added++;
                // Index the new planet immediately (use index before push)
                this.indexPlanet(planet, planetIndex);
            } else {
                skipped++;
            }
        });

        // Count status breakdown after merge (optimized single-pass)
        let confirmedCount = 0;
        let candidateCount = 0;
        this.allData.forEach(p => {
            const s = (p.status || '').toUpperCase();
            if (s.includes('CONFIRMED') || p.status === 'Confirmed Planet') {
                confirmedCount++;
            } else if ((s.includes('CANDIDATE') || p.status === 'CANDIDATE') &&
                !s.includes('CONFIRMED') && !s.includes('FALSE')) {
                candidateCount++;
            }
        });

        console.log(`📊 Merged datasets: ${this.allData.length.toLocaleString()} total exoplanets`);
        console.log(`   - Kepler: ${this.allData.length - added} exoplanets`);
        console.log(`   - Large dataset: ${added.toLocaleString()} additional exoplanets`);
        console.log(`   - Confirmed: ${confirmedCount.toLocaleString()}`);
        console.log(`   - Candidates: ${candidateCount.toLocaleString()}`);
        if (skipped > 0) {
            console.log(`   - Skipped duplicates: ${skipped.toLocaleString()}`);
        }
    }

    buildSearchIndex() {
        try {
            this.searchIndex = new Map();

            if (!Array.isArray(this.allData) || this.allData.length === 0) {
                this.indexBuilt = true;
                return;
            }

            for (let i = 0; i < this.allData.length; i++) {
                this.indexPlanet(this.allData[i], i);
            }

            this.indexBuilt = true;
        } catch (error) {
            console.warn('Search index build failed:', error);
            this.indexBuilt = false;
        }
    }

    indexPlanet(planet, index) {
        if (!planet || index === null || index === undefined) {
            return;
        }

        if (!this.searchIndex || typeof this.searchIndex.set !== 'function') {
            this.searchIndex = new Map();
        }

        const terms = [];

        const addTermsFromValue = (value) => {
            if (!value) {
                return;
            }
            const str = String(value).toLowerCase();
            str.split(/[^a-z0-9]+/).forEach((part) => {
                if (part) {
                    terms.push(part);
                }
            });
        };

        addTermsFromValue(planet.kepler_name);
        addTermsFromValue(planet.kepoi_name);

        if (planet.kepid !== undefined && planet.kepid !== null) {
            terms.push(String(planet.kepid).toLowerCase());
        }

        for (let i = 0; i < terms.length; i++) {
            const term = terms[i];
            let bucket = this.searchIndex.get(term);
            if (!bucket) {
                bucket = new Set();
                this.searchIndex.set(term, bucket);
            }
            bucket.add(index);
        }
    }

    searchUsingIndex(query) {
        if (query === null || query === undefined) {
            return this.allData;
        }

        const q = String(query).trim().toLowerCase();
        if (!q) {
            return this.allData;
        }

        if (!this.indexBuilt || !this.searchIndex || this.searchIndex.size === 0) {
            this.buildSearchIndex();
        }

        if (!this.searchIndex || this.searchIndex.size === 0) {
            return this.allData;
        }

        const tokens = q.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) {
            return this.allData;
        }

        const resultIndexes = new Set();

        for (let i = 0; i < tokens.length; i++) {
            const term = tokens[i];
            const bucket = this.searchIndex.get(term);
            if (bucket && bucket.size > 0) {
                bucket.forEach((idx) => {
                    if (idx >= 0 && idx < this.allData.length) {
                        resultIndexes.add(idx);
                    }
                });
            }
        }

        if (resultIndexes.size === 0) {
            return [];
        }

        return Array.from(resultIndexes).map((idx) => this.allData[idx]);
    }

    showAutocompleteSuggestions() {
    }

    /**
     * Calculate comprehensive statistics from all planet data
     * 
     * Uses optimized single-pass algorithm for better performance.
     * Calculates: total, confirmed, candidates, types, availability, averages.
     * 
     * @method calculateStatistics
     * @returns {void}
     */
    calculateStatistics() {
        this.stats = {
            total: this.allData.length,
            confirmed: 0,
            candidates: 0,
            earthLike: 0,
            superEarths: 0,
            gasGiants: 0,
            miniNeptunes: 0,
            available: 0,
            claimed: 0,
            avgRadius: 0,
            avgDistance: 0
        };

        let totalRadius = 0;
        let totalDistance = 0;
        let validRadiusCount = 0;
        let validDistanceCount = 0;

        // Single-pass loop for better performance
        this.allData.forEach(planet => {
            // Status counts - handle 'CONFIRMED', 'Confirmed Planet', 'CANDIDATE', and variations
            const status = planet.status || '';
            const statusUpper = status.toUpperCase();

            // Check for confirmed status (handles "CONFIRMED", "Confirmed Planet", "CONFIRMED PLANET", etc.)
            if (statusUpper.includes('CONFIRMED') || statusUpper === 'CONFIRMED PLANET' || status === 'Confirmed Planet') {
                this.stats.confirmed++;
            }
            // Check for candidate status (but not if it's already confirmed or false positive)
            else if ((statusUpper.includes('CANDIDATE') || status === 'CANDIDATE') &&
                !statusUpper.includes('CONFIRMED') &&
                !statusUpper.includes('FALSE')) {
                this.stats.candidates++;
            }

            // Type counts
            if (planet.type === 'Earth-like') {
                this.stats.earthLike++;
            } else if (planet.type === 'Super-Earth') {
                this.stats.superEarths++;
            } else if (planet.type === 'Gas Giant') {
                this.stats.gasGiants++;
            } else if (planet.type === 'Mini-Neptune') {
                this.stats.miniNeptunes++;
            }

            // Availability
            if (planet.availability === 'available') {
                this.stats.available++;
            } else {
                this.stats.claimed++;
            }

            // Averages (count and sum in same pass)
            if (planet.radius && !isNaN(planet.radius)) {
                totalRadius += planet.radius;
                validRadiusCount++;
            }
            if (planet.distance && !isNaN(planet.distance)) {
                totalDistance += planet.distance;
                validDistanceCount++;
            }
        });

        // Calculate averages (handle division by zero)
        this.stats.avgRadius = validRadiusCount > 0 ? (totalRadius / validRadiusCount).toFixed(2) : '0.00';
        this.stats.avgDistance = validDistanceCount > 0 ? (totalDistance / validDistanceCount).toFixed(0) : '0';

        console.log(`📊 Statistics calculated: ${this.stats.total.toLocaleString()} total exoplanets`);
        console.log(`   - Confirmed: ${this.stats.confirmed.toLocaleString()}`);
        console.log(`   - Candidates: ${this.stats.candidates.toLocaleString()}`);
    }

    renderPlanetOfDayCard() {
        try {
            const container = document.getElementById('planet-of-day-container');
            if (!container || !Array.isArray(this.allData) || this.allData.length === 0) {
                return;
            }

            const today = new Date();
            const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
            const index = daySeed % this.allData.length;
            const planet = this.allData[index];
            if (!planet) {
                return;
            }

            const name = planet.kepler_name || planet.kepoi_name || `KOI-${planet.kepid}`;
            const type = planet.type || 'Unknown';
            const radius = typeof planet.radius === 'number' && !isNaN(planet.radius) ? planet.radius.toFixed(2) : 'N/A';
            const distance = typeof planet.distance === 'number' && !isNaN(planet.distance) ? planet.distance.toFixed(0) : 'N/A';
            const year = planet.disc_year || 'Unknown';

            container.innerHTML = `
                <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.85)); border-radius: 18px; border: 2px solid rgba(186, 148, 79, 0.7); padding: 1.75rem; margin: 1.5rem 0; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.8);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                        <div style="flex: 2; min-width: 220px;">
                            <div style="font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248, 250, 252, 0.7); margin-bottom: 0.35rem;">Planet of the Day</div>
                            <h2 style="margin: 0 0 0.35rem 0; color: #f9fafb; font-size: 1.6rem;">${name}</h2>
                            <div style="font-size: 0.9rem; color: rgba(226, 232, 240, 0.85);">Type: <span style="color: #bae6fd; font-weight: 600;">${type}</span></div>
                            <div style="margin-top: 0.4rem; font-size: 0.85rem; color: rgba(148, 163, 184, 0.95);">
                                Radius: <span style="color: #e5e7eb; font-weight: 500;">${radius}× Earth</span>
                                · Distance: <span style="color: #e5e7eb; font-weight: 500;">${distance} ly</span>
                                · Discovery year: <span style="color: #e5e7eb; font-weight: 500;">${year}</span>
                            </div>
                        </div>
                        <div style="flex: 1; min-width: 200px; text-align: right; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                            <button type="button" onclick="showPlanetDetails('${planet.kepid}')" style="padding: 0.6rem 1.1rem; border-radius: 999px; border: 1px solid rgba(186, 148, 79, 0.8); background: rgba(15, 23, 42, 0.8); color: #f9fafb; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-bottom: 0.1rem;">
                                🔍 View details
                            </button>
                            <button type="button" onclick="viewPlanet3D('${planet.kepid}')" style="padding: 0.55rem 1.05rem; border-radius: 999px; border: 1px solid rgba(129, 140, 248, 0.7); background: rgba(30, 64, 175, 0.85); color: #e0e7ff; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                                🪐 View in 3D
                            </button>
                        </div>
                    </div>
                    <div id="planet-of-day-description" style="margin-top: 1rem; font-size: 0.9rem; line-height: 1.6; color: rgba(248, 250, 252, 0.9); background: rgba(15, 23, 42, 0.9); border-radius: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.45); padding: 0.9rem; min-height: 2.6rem;"></div>
                </div>
            `;

            try {
                if (window.aiPlanetDescriptions && typeof window.aiPlanetDescriptions === 'function') {
                    const helper = window.aiPlanetDescriptions();
                    if (helper && typeof helper.renderDescription === 'function') {
                        const descContainer = document.getElementById('planet-of-day-description');
                        if (descContainer) {
                            helper.renderDescription(descContainer, planet);
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to render AI description for Planet of the Day:', e);
            }
        } catch (error) {
            console.warn('Failed to render Planet of the Day card:', error);
        }
    }

    /**
     * Load user's claimed planets from backend or localStorage
     * 
     * Attempts to load from backend API first (localhost only),
     * falls back to localStorage/Supabase on GitLab Pages.
     * Updates planet availability status accordingly.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async loadUserClaims() {
        if (typeof authManager === 'undefined' || !authManager || !authManager.isAuthenticated()) {
            await this.loadLocalClaims();
            return;
        }

        const apiBase = window.EXOPLANET_API_BASE || 'https://api.adrianotothestar.com';

        try {
            console.log(`🔌 Loading claims from backend: ${apiBase}...`);
            const response = await fetch(`${apiBase}/api/planets/my-claims`, {
                headers: {
                    'Authorization': authManager.getHeaders ? authManager.getHeaders()['Authorization'] : `Bearer ${authManager.token || ''}`
                },
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.success && data.claims) {
                    console.log('✅ Loaded claims from backend:', data.claims.length);
                    const claimedKepids = new Set(data.claims.map(c => c.kepid));
                    this.allData.forEach(planet => {
                        if (claimedKepids.has(planet.kepid)) {
                            planet.availability = 'claimed';
                        }
                    });

                    const user = authManager.getCurrentUser();
                    if (user) {
                        localStorage.setItem('user_claims', JSON.stringify(data.claims.map(c => ({
                            ...c,
                            userId: user.id
                        }))));
                    }

                    if (this.filteredData.length > 0) {
                        this.calculateStatistics();
                        this.createStatsSection();
                        this.renderPage();
                    }
                }
            } else {
                console.warn('⚠️ Backend returned error, loading from localStorage');
                await this.loadLocalClaims();
            }
        } catch (error) {
            console.log('⚠️ Could not load claims from backend, using localStorage:', error.message);
            await this.loadLocalClaims();
        }
    }

    /**
     * Load claims from Supabase and localStorage
     * 
     * Loads user's planet claims from Supabase first, then localStorage.
     * Syncs data between both sources and updates planet availability.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async loadLocalClaims() {
        try {
            const user = (typeof authManager !== 'undefined' && authManager && typeof authManager.getCurrentUser === 'function')
                ? authManager.getCurrentUser()
                : null;
            if (!user) {
                console.log('💾 No user logged in, skipping local claims load');
                return;
            }

            let userClaims = [];

            // Try to load from Supabase first
            if (authManager.useSupabase && authManager.supabase) {
                try {
                    console.log('☁️ Loading claims from Supabase...');
                    const { data, error } = await authManager.supabase
                        .from('planet_claims')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('status', 'active');

                    if (error) {
                        console.error('✗ Supabase query error:', error);
                    } else if (data && data.length > 0) {
                        console.log('✅ Loaded claims from Supabase:', data.length);
                        // Convert Supabase format to our format
                        userClaims = data.map(claim => ({
                            id: claim.id,
                            userId: claim.user_id,
                            username: claim.username,
                            email: claim.email,
                            kepid: claim.kepid,
                            planet: claim.planet_data,
                            status: claim.status,
                            claimedAt: claim.claimed_at,
                            certificate: {
                                number: claim.certificate_number,
                                issued: claim.claimed_at
                            }
                        }));

                        // Sync to localStorage as backup
                        const existingClaims = JSON.parse(localStorage.getItem('user_claims') || '[]');
                        const mergedClaims = [...existingClaims];

                        // Add Supabase claims that aren't in localStorage
                        userClaims.forEach(supabaseClaim => {
                            const exists = mergedClaims.find(lc =>
                                this.compareKepid(lc.kepid, supabaseClaim.kepid) &&
                                (lc.userId === supabaseClaim.userId || lc.email === supabaseClaim.email)
                            );
                            if (!exists) {
                                mergedClaims.push(supabaseClaim);
                            }
                        });

                        localStorage.setItem('user_claims', JSON.stringify(mergedClaims));
                        console.log('💾 Synced Supabase claims to localStorage');
                    } else {
                        console.log('💾 No claims found in Supabase');
                    }
                } catch (supabaseError) {
                    console.error('✗ Supabase error:', supabaseError);
                }
            }

            // If no Supabase claims, load from localStorage
            if (userClaims.length === 0) {
                const claims = JSON.parse(localStorage.getItem('user_claims') || '[]');
                userClaims = claims.filter(c => {
                    // Match by userId, username, or email
                    const matchesUserId = c.userId && user.id && c.userId === user.id;
                    const matchesUsername = c.username && user.username && c.username.toLowerCase() === user.username.toLowerCase();
                    const matchesEmail = c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase();
                    return matchesUserId || matchesUsername || matchesEmail;
                });
                console.log('💾 Loaded claims from localStorage:', userClaims.length);
            }

            if (userClaims.length > 0) {
                // Update availability for claimed planets
                const claimedKepids = new Set(userClaims.map(c => c.kepid));
                let updatedCount = 0;
                this.allData.forEach(planet => {
                    if (claimedKepids.has(planet.kepid)) {
                        planet.availability = 'claimed';
                        updatedCount++;
                    }
                });
                console.log(`✓ Updated ${updatedCount} planets as claimed`);

                // Recalculate stats and re-render if page is already rendered
                if (this.filteredData.length > 0) {
                    this.calculateStatistics();
                    this.createStatsSection();
                    this.renderPage();
                }
            } else {
                console.log('💾 No claims found for this user');
            }
        } catch (error) {
            console.error('Error loading local claims:', error);
        }
    }

    /**
     * Create statistics overview section
     * 
     * Displays comprehensive statistics cards showing total planets,
     * confirmed planets, candidates, types, and averages.
     * 
     * @private
     * @returns {void}
     */
    createStatsSection() {
        const container = document.getElementById('data-visualization');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌍</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #ba944f;">${this.stats.total.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Total Exoplanets</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #4ade80;">${this.stats.confirmed.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Confirmed Planets</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #60a5fa;">${this.stats.candidates.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Candidate Planets</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌎</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #22d3ee;">${this.stats.earthLike.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Earth-like Planets</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🪐</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #f59e0b;">${this.stats.gasGiants.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Gas Giants</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">💫</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #a78bfa;">${this.stats.superEarths.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Super-Earths</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🟢</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #4ade80;">${this.stats.available.toLocaleString()}</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Available to Claim</div>
                </div>
                
                <div class="stat-card" data-entrance="fadeIn" data-hover="lift" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 20, 30, 0.8)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <div class="stat-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">📏</div>
                    <div class="stat-value" style="font-size: 2rem; font-weight: bold; color: #ba944f;">${this.stats.avgRadius}x</div>
                    <div class="stat-label" style="color: rgba(255, 255, 255, 0.7); margin-top: 0.5rem;">Avg Radius (Earth = 1)</div>
                </div>
            </div>
            
            <div class="stats-description" style="text-align: center; margin: 2rem 0; padding: 1.5rem; background: rgba(186, 148, 79, 0.1); border-radius: 12px; border: 1px solid rgba(186, 148, 79, 0.2);">
                <p style="margin: 0; opacity: 0.9;">
                    <strong>Data Source:</strong> NASA Exoplanet Archive (Kepler Mission) | 
                    Average Distance: ${this.stats.avgDistance} light-years | 
                    Discovery Period: 2009-2018
                </p>
            </div>
        `;
    }

    /**
     * Create search bar with autocomplete
     * 
     * Creates search input with debounced search functionality.
     * Shows autocomplete suggestions and handles search events.
     * 
     * @private
     * @returns {void}
     */
    createSearchBar() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        const searchHTML = `
            <div class="search-filter-container" style="margin-bottom: 2rem;">
                <div class="db-intro" style="margin-bottom: 1.5rem; text-align: center;">
                    <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #ba944f;">Explore the Kepler Exoplanet Catalog</h2>
                    <p style="margin: 0; font-size: 0.95rem; color: rgba(255, 255, 255, 0.8);">
                        Search thousands of worlds, filter by type and status, or let AI help you find interesting planets.
                    </p>
                    <div class="quick-filter-buttons" style="margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">
                        <button type="button" class="quick-filter-btn" data-quick-filter="habitable" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; border-radius: 999px; border: 1px solid rgba(186, 148, 79, 0.6); background: rgba(186, 148, 79, 0.12); color: #fbbf24; cursor: pointer;">
                            🌍 Habitable-style (Earth-like & confirmed)
                        </button>
                        <button type="button" class="quick-filter-btn" data-quick-filter="super-earths" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; border-radius: 999px; border: 1px solid rgba(186, 148, 79, 0.6); background: rgba(186, 148, 79, 0.08); color: #bae6fd; cursor: pointer;">
                            🪐 Super-Earths
                        </button>
                        <button type="button" class="quick-filter-btn" data-quick-filter="gas-giants" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; border-radius: 999px; border: 1px solid rgba(186, 148, 79, 0.6); background: rgba(186, 148, 79, 0.08); color: #a5b4fc; cursor: pointer;">
                            ☄️ Gas giants
                        </button>
                        <button type="button" class="quick-filter-btn" data-quick-filter="available" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; border-radius: 999px; border: 1px solid rgba(34, 197, 94, 0.7); background: rgba(34, 197, 94, 0.15); color: #bbf7d0; cursor: pointer;">
                            🟢 Available to claim
                        </button>
                        <button type="button" class="quick-filter-btn" data-quick-filter="random" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; border-radius: 999px; border: 1px solid rgba(94, 234, 212, 0.8); background: rgba(45, 212, 191, 0.16); color: #a5f3fc; cursor: pointer;">
                            ✨ Surprise me
                        </button>
                        <button type="button" class="quick-filter-btn" data-quick-filter="reset" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.7); background: rgba(15, 23, 42, 0.9); color: #e5e7eb; cursor: pointer;">
                            ↺ Clear filters
                        </button>
                    </div>
                </div>
                <div class="search-box-wrapper" style="position: relative; margin-bottom: 1.5rem;">
                    <input 
                        type="text" 
                        id="planet-search" 
                        class="search-input" 
                        placeholder="🔍 Search by name, KOI, or Kepler ID..." 
                        style="width: 100%; padding: 1rem 3rem 1rem 1.5rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; color: white; font-size: 1rem; transition: all 0.3s ease;"
                    />
                    <div class="search-icon" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #ba944f; font-size: 1.2rem;">
                        🔎
                    </div>
                    <div id="search-count" style="position: absolute; top: -1.5rem; right: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);"></div>
                </div>
                <div id="search-performance-status" style="min-height: 1.1rem; font-size: 0.8rem; color: rgba(252, 211, 77, 0.9); opacity: 0; visibility: hidden; margin-bottom: 0.5rem;"></div>
                <div id="nl-query-context" style="min-height: 1.1rem; font-size: 0.85rem; color: rgba(186, 148, 79, 0.9); opacity: 0; visibility: hidden; margin-bottom: 0.5rem;"></div>
                
                <div id="filter-buttons"></div>
                <div id="results-container"></div>
                <div id="pagination-container" style="margin-top: 2rem;"></div>
                <div id="results-export-container" style="margin-top: 1rem;"></div>
            </div>
        `;

        container.innerHTML = searchHTML;

        const performanceStatus = document.getElementById('search-performance-status');
        if (performanceStatus && typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
            try {
                if (!window.SLOW_QUERY_CLIENT_HOOK_INITIALIZED) {
                    window.SLOW_QUERY_CLIENT_HOOK_INITIALIZED = true;
                    window.addEventListener('slow-api-response', (event) => {
                        try {
                            if (!performanceStatus) {
                                return;
                            }
                            const detail = event && event.detail ? event.detail : {};
                            const duration = typeof detail.duration === 'number' ? detail.duration : null;
                            const threshold = typeof detail.threshold === 'number' ? detail.threshold : null;
                            let message = 'Some data requests are slower than expected.';
                            if (duration !== null && threshold !== null) {
                                message = `Some data requests are slower than expected (${duration}ms > ${threshold}ms).`;
                            }
                            performanceStatus.textContent = message;
                            performanceStatus.style.visibility = 'visible';
                            performanceStatus.style.opacity = '0.9';
                            if (performanceStatus._hideTimer) {
                                clearTimeout(performanceStatus._hideTimer);
                            }
                            performanceStatus._hideTimer = setTimeout(() => {
                                performanceStatus.textContent = '';
                                performanceStatus.style.opacity = '0';
                                performanceStatus.style.visibility = 'hidden';
                            }, 5000);
                        } catch (error) {
                            console.warn('Slow query client hook failed:', error);
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to initialize slow query client hook:', e);
            }
        }

        // Add event listener for search with debouncing
        const searchInput = document.getElementById('planet-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();

                // Show autocomplete suggestions
                this.showAutocompleteSuggestions(e.target.value);

                // Debounce search to avoid excessive filtering
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300); // Wait 300ms after user stops typing
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-box-wrapper')) {
                    const suggestions = document.getElementById('search-suggestions');
                    if (suggestions) {
                        suggestions.style.display = 'none';
                    }
                }
            });
        }

        this.initializeQuickFilters();
    }

    initializeQuickFilters() {
        try {
            const buttons = document.querySelectorAll('.quick-filter-btn[data-quick-filter]');
            if (!buttons || buttons.length === 0) {
                return;
            }

            const filterStatus = document.getElementById('filter-status');
            const filterType = document.getElementById('filter-type');
            const filterAvailability = document.getElementById('filter-availability');
            const radiusMinInput = document.getElementById('filter-radius-min');
            const radiusMaxInput = document.getElementById('filter-radius-max');
            const distanceMinInput = document.getElementById('filter-distance-min');
            const distanceMaxInput = document.getElementById('filter-distance-max');
            const yearMinInput = document.getElementById('filter-year-min');
            const yearMaxInput = document.getElementById('filter-year-max');

            const ensureRangeFilters = () => {
                if (!this.rangeFilters) {
                    this.rangeFilters = {
                        radiusMin: null,
                        radiusMax: null,
                        distanceMin: null,
                        distanceMax: null,
                        yearMin: null,
                        yearMax: null
                    };
                }
            };

            const clearRanges = () => {
                ensureRangeFilters();
                this.rangeFilters.radiusMin = null;
                this.rangeFilters.radiusMax = null;
                this.rangeFilters.distanceMin = null;
                this.rangeFilters.distanceMax = null;
                this.rangeFilters.yearMin = null;
                this.rangeFilters.yearMax = null;

                if (radiusMinInput) radiusMinInput.value = '';
                if (radiusMaxInput) radiusMaxInput.value = '';
                if (distanceMinInput) distanceMinInput.value = '';
                if (distanceMaxInput) distanceMaxInput.value = '';
                if (yearMinInput) yearMinInput.value = '';
                if (yearMaxInput) yearMaxInput.value = '';
            };

            const applyPresetAndFilters = () => {
                this.searchTerm = '';
                const searchInputEl = document.getElementById('planet-search');
                if (searchInputEl) searchInputEl.value = '';

                if (filterStatus) filterStatus.value = this.activeFilters.status;
                if (filterType) filterType.value = this.activeFilters.type;
                if (filterAvailability) filterAvailability.value = this.activeFilters.availability;

                this.currentPage = 1;
                this.applyFilters();
            };

            buttons.forEach((btn) => {
                const preset = btn.getAttribute('data-quick-filter');
                btn.addEventListener('click', () => {
                    if (!preset) {
                        return;
                    }

                    if (preset === 'reset') {
                        const resetBtn = document.getElementById('reset-filters');
                        if (resetBtn) {
                            resetBtn.click();
                        }
                        return;
                    }

                    if (preset === 'random') {
                        try {
                            const source = Array.isArray(this.filteredData) && this.filteredData.length > 0
                                ? this.filteredData
                                : (Array.isArray(this.allData) ? this.allData : []);
                            if (!source || source.length === 0) {
                                alert('Planet data is still loading. Please try again in a moment.');
                                return;
                            }
                            const index = Math.floor(Math.random() * source.length);
                            const planet = source[index];
                            if (planet && typeof window.showPlanetDetails === 'function') {
                                window.showPlanetDetails(planet.kepid || planet.kepoi_name);
                            }
                        } catch (error) {
                            console.warn('Failed to open random planet details from quick filter:', error);
                        }
                        return;
                    }

                    clearRanges();

                    if (preset === 'habitable') {
                        this.activeFilters.status = 'CONFIRMED';
                        this.activeFilters.type = 'Earth-like';
                        this.activeFilters.availability = 'all';
                    } else if (preset === 'super-earths') {
                        this.activeFilters.status = 'all';
                        this.activeFilters.type = 'Super-Earth';
                        this.activeFilters.availability = 'all';
                    } else if (preset === 'gas-giants') {
                        this.activeFilters.status = 'all';
                        this.activeFilters.type = 'Gas Giant';
                        this.activeFilters.availability = 'all';
                    } else if (preset === 'available') {
                        this.activeFilters.status = 'all';
                        this.activeFilters.type = 'all';
                        this.activeFilters.availability = 'available';
                    }

                    applyPresetAndFilters();
                });
            });
        } catch (error) {
            console.warn('Failed to initialize quick filters:', error);
        }
    }

    /**
     * Create filter buttons for status, type, and availability
     * 
     * Creates dropdown filters with current statistics counts.
     * Sets up event listeners for filter changes.
     * 
     * @private
     * @returns {void}
     */
    createFilterButtons() {
        const container = document.getElementById('filter-buttons');
        if (!container) return;

        const needsRender = !container.querySelector('#filter-status') ||
            !container.querySelector('#filter-type') ||
            !container.querySelector('#filter-availability');

        if (needsRender) {
            container.innerHTML = `
            <div class="filter-group" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="filter-section" style="flex: 1; min-width: 200px;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Status:</label>
                    <select id="filter-status" class="filter-select" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        <option value="all">All (${this.stats.total})</option>
                        <option value="CONFIRMED">Confirmed (${this.stats.confirmed})</option>
                        <option value="CANDIDATE">Candidates (${this.stats.candidates})</option>
                    </select>
                </div>
                
                <div class="filter-section" style="flex: 1; min-width: 200px;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Type:</label>
                    <select id="filter-type" class="filter-select" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        <option value="all">All Types</option>
                        <option value="Earth-like">Earth-like (${this.stats.earthLike})</option>
                        <option value="Super-Earth">Super-Earths (${this.stats.superEarths})</option>
                        <option value="Gas Giant">Gas Giants (${this.stats.gasGiants})</option>
                        <option value="Mini-Neptune">Mini-Neptunes (${this.stats.miniNeptunes})</option>
                    </select>
                </div>
                
                <div class="filter-section" style="flex: 1; min-width: 200px;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Availability:</label>
                    <select id="filter-availability" class="filter-select" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white;">
                        <option value="all">All</option>
                        <option value="available">Available (${this.stats.available})</option>
                        <option value="claimed">Claimed (${this.stats.claimed})</option>
                    </select>
                </div>
                
                <div class="filter-section" style="flex: 0; min-width: 120px; display: flex; align-items: flex-end;">
                    <button id="reset-filters" class="cta-button" data-hover="lift" style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        Reset
                    </button>
                </div>
            </div>
            <div class="filter-group" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="filter-section" style="flex: 1; min-width: 220px;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Radius (Earth = 1):</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input id="filter-radius-min" type="number" step="0.1" placeholder="Min" value="${this.rangeFilters && this.rangeFilters.radiusMin !== null && this.rangeFilters.radiusMin !== undefined ? this.rangeFilters.radiusMin : ''}" style="flex: 1; padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-size: 0.85rem;" />
                        <input id="filter-radius-max" type="number" step="0.1" placeholder="Max" value="${this.rangeFilters && this.rangeFilters.radiusMax !== null && this.rangeFilters.radiusMax !== undefined ? this.rangeFilters.radiusMax : ''}" style="flex: 1; padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-size: 0.85rem;" />
                    </div>
                </div>
                <div class="filter-section" style="flex: 1; min-width: 220px;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Distance (light-years):</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input id="filter-distance-min" type="number" step="1" placeholder="Min" value="${this.rangeFilters && this.rangeFilters.distanceMin !== null && this.rangeFilters.distanceMin !== undefined ? this.rangeFilters.distanceMin : ''}" style="flex: 1; padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-size: 0.85rem;" />
                        <input id="filter-distance-max" type="number" step="1" placeholder="Max" value="${this.rangeFilters && this.rangeFilters.distanceMax !== null && this.rangeFilters.distanceMax !== undefined ? this.rangeFilters.distanceMax : ''}" style="flex: 1; padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-size: 0.85rem;" />
                    </div>
                </div>
                <div class="filter-section" style="flex: 1; min-width: 220px;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #ba944f; font-weight: 600;">Discovery year:</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input id="filter-year-min" type="number" step="1" placeholder="Min" value="${this.rangeFilters && this.rangeFilters.yearMin !== null && this.rangeFilters.yearMin !== undefined ? this.rangeFilters.yearMin : ''}" style="flex: 1; padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-size: 0.85rem;" />
                        <input id="filter-year-max" type="number" step="1" placeholder="Max" value="${this.rangeFilters && this.rangeFilters.yearMax !== null && this.rangeFilters.yearMax !== undefined ? this.rangeFilters.yearMax : ''}" style="flex: 1; padding: 0.5rem 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-size: 0.85rem;" />
                    </div>
                </div>
            </div>
        `;

        }

        const filterStatus = document.getElementById('filter-status');
        const filterType = document.getElementById('filter-type');
        const filterAvailability = document.getElementById('filter-availability');

        const safeStat = (value) => (typeof value === 'number' && !isNaN(value) ? value : 0);
        const totalCount = safeStat(this.stats && this.stats.total);
        const confirmedCount = safeStat(this.stats && this.stats.confirmed);
        const candidateCount = safeStat(this.stats && this.stats.candidates);
        const earthLikeCount = safeStat(this.stats && this.stats.earthLike);
        const superEarthCount = safeStat(this.stats && this.stats.superEarths);
        const gasGiantCount = safeStat(this.stats && this.stats.gasGiants);
        const miniNeptuneCount = safeStat(this.stats && this.stats.miniNeptunes);
        const availableCount = safeStat(this.stats && this.stats.available);
        const claimedCount = safeStat(this.stats && this.stats.claimed);

        if (filterStatus) {
            const allOption = filterStatus.querySelector('option[value="all"]');
            const confirmedOption = filterStatus.querySelector('option[value="CONFIRMED"]');
            const candidateOption = filterStatus.querySelector('option[value="CANDIDATE"]');
            if (allOption) allOption.textContent = `All (${totalCount})`;
            if (confirmedOption) confirmedOption.textContent = `Confirmed (${confirmedCount})`;
            if (candidateOption) candidateOption.textContent = `Candidates (${candidateCount})`;
        }

        if (filterType) {
            const earthLikeOption = filterType.querySelector('option[value="Earth-like"]');
            const superEarthOption = filterType.querySelector('option[value="Super-Earth"]');
            const gasGiantOption = filterType.querySelector('option[value="Gas Giant"]');
            const miniNeptuneOption = filterType.querySelector('option[value="Mini-Neptune"]');
            if (earthLikeOption) earthLikeOption.textContent = `Earth-like (${earthLikeCount})`;
            if (superEarthOption) superEarthOption.textContent = `Super-Earths (${superEarthCount})`;
            if (gasGiantOption) gasGiantOption.textContent = `Gas Giants (${gasGiantCount})`;
            if (miniNeptuneOption) miniNeptuneOption.textContent = `Mini-Neptunes (${miniNeptuneCount})`;
        }

        if (filterAvailability) {
            const availableOption = filterAvailability.querySelector('option[value="available"]');
            const claimedOption = filterAvailability.querySelector('option[value="claimed"]');
            if (availableOption) availableOption.textContent = `Available (${availableCount})`;
            if (claimedOption) claimedOption.textContent = `Claimed (${claimedCount})`;
        }

        if (filterStatus && filterStatus.dataset.filtersBound === 'true') {
            return;
        }

        // Add event listeners with null checks
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.activeFilters.status = e.target.value;
                this.applyFilters();
            });
        }
        if (filterType) {
            filterType.addEventListener('change', (e) => {
                this.activeFilters.type = e.target.value;
                this.applyFilters();
            });
        }
        if (filterAvailability) {
            filterAvailability.addEventListener('change', (e) => {
                this.activeFilters.availability = e.target.value;
                this.applyFilters();
            });
        }

        const resetFiltersBtn = document.getElementById('reset-filters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.activeFilters = { status: 'all', type: 'all', availability: 'all' };
                const searchInput = document.getElementById('planet-search');
                if (searchInput) searchInput.value = '';
                if (filterStatus) filterStatus.value = 'all';
                if (filterType) filterType.value = 'all';
                if (filterAvailability) filterAvailability.value = 'all';
                if (!this.rangeFilters) {
                    this.rangeFilters = {
                        radiusMin: null,
                        radiusMax: null,
                        distanceMin: null,
                        distanceMax: null,
                        yearMin: null,
                        yearMax: null
                    };
                } else {
                    this.rangeFilters.radiusMin = null;
                    this.rangeFilters.radiusMax = null;
                    this.rangeFilters.distanceMin = null;
                    this.rangeFilters.distanceMax = null;
                    this.rangeFilters.yearMin = null;
                    this.rangeFilters.yearMax = null;
                }
                const radiusMinInput = document.getElementById('filter-radius-min');
                const radiusMaxInput = document.getElementById('filter-radius-max');
                const distanceMinInput = document.getElementById('filter-distance-min');
                const distanceMaxInput = document.getElementById('filter-distance-max');
                const yearMinInput = document.getElementById('filter-year-min');
                const yearMaxInput = document.getElementById('filter-year-max');
                if (radiusMinInput) radiusMinInput.value = '';
                if (radiusMaxInput) radiusMaxInput.value = '';
                if (distanceMinInput) distanceMinInput.value = '';
                if (distanceMaxInput) distanceMaxInput.value = '';
                if (yearMinInput) yearMinInput.value = '';
                if (yearMaxInput) yearMaxInput.value = '';
                this.applyFilters();
            });
        }

        const radiusMinInput = document.getElementById('filter-radius-min');
        const radiusMaxInput = document.getElementById('filter-radius-max');
        const distanceMinInput = document.getElementById('filter-distance-min');
        const distanceMaxInput = document.getElementById('filter-distance-max');
        const yearMinInput = document.getElementById('filter-year-min');
        const yearMaxInput = document.getElementById('filter-year-max');

        const ensureRangeFilters = () => {
            if (!this.rangeFilters) {
                this.rangeFilters = {
                    radiusMin: null,
                    radiusMax: null,
                    distanceMin: null,
                    distanceMax: null,
                    yearMin: null,
                    yearMax: null
                };
            }
        };

        if (radiusMinInput) {
            radiusMinInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                const num = value === '' ? null : Number(value);
                ensureRangeFilters();
                this.rangeFilters.radiusMin = num !== null && !isNaN(num) ? num : null;
                this.applyFilters();
            });
        }

        if (radiusMaxInput) {
            radiusMaxInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                const num = value === '' ? null : Number(value);
                ensureRangeFilters();
                this.rangeFilters.radiusMax = num !== null && !isNaN(num) ? num : null;
                this.applyFilters();
            });
        }

        if (distanceMinInput) {
            distanceMinInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                const num = value === '' ? null : Number(value);
                ensureRangeFilters();
                this.rangeFilters.distanceMin = num !== null && !isNaN(num) ? num : null;
                this.applyFilters();
            });
        }

        if (distanceMaxInput) {
            distanceMaxInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                const num = value === '' ? null : Number(value);
                ensureRangeFilters();
                this.rangeFilters.distanceMax = num !== null && !isNaN(num) ? num : null;
                this.applyFilters();
            });
        }

        if (yearMinInput) {
            yearMinInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                const num = value === '' ? null : Number(value);
                ensureRangeFilters();
                this.rangeFilters.yearMin = num !== null && !isNaN(num) ? num : null;
                this.applyFilters();
            });
        }

        if (yearMaxInput) {
            yearMaxInput.addEventListener('change', (e) => {
                const value = e.target.value.trim();
                const num = value === '' ? null : Number(value);
                ensureRangeFilters();
                this.rangeFilters.yearMax = num !== null && !isNaN(num) ? num : null;
                this.applyFilters();
            });
        }

        if (filterStatus) filterStatus.dataset.filtersBound = 'true';
        if (filterType) filterType.dataset.filtersBound = 'true';
        if (filterAvailability) filterAvailability.dataset.filtersBound = 'true';
    }

    /**
     * Apply all filters (optimized: single-pass filtering with search index)
     * 
     * Filters planets based on search term, status, type, and availability.
     * Uses search index for fast text search, then applies other filters.
     * Updates pagination and renders results.
     * 
     * @private
     * @returns {void}
     */
    applyFilters(preservePage = false) {
        // Use search index for fast search results
        let dataToFilter = this.allData;

        const hasSearch = this.searchTerm && this.searchTerm.length >= 2;
        if (hasSearch) {
            this.logSearchAnalytics(this.searchTerm);
            // Use indexed search for instant results
            dataToFilter = this.searchUsingIndex(this.searchTerm);
        }

        const ranges = this.rangeFilters || {};
        const radiusMin = typeof ranges.radiusMin === 'number' && !isNaN(ranges.radiusMin) ? ranges.radiusMin : null;
        const radiusMax = typeof ranges.radiusMax === 'number' && !isNaN(ranges.radiusMax) ? ranges.radiusMax : null;
        const distanceMin = typeof ranges.distanceMin === 'number' && !isNaN(ranges.distanceMin) ? ranges.distanceMin : null;
        const distanceMax = typeof ranges.distanceMax === 'number' && !isNaN(ranges.distanceMax) ? ranges.distanceMax : null;
        const yearMin = typeof ranges.yearMin === 'number' && !isNaN(ranges.yearMin) ? ranges.yearMin : null;
        const yearMax = typeof ranges.yearMax === 'number' && !isNaN(ranges.yearMax) ? ranges.yearMax : null;

        this.filteredData = dataToFilter.filter(planet => {

            // Status filter - handle 'CONFIRMED', 'Confirmed Planet', 'CANDIDATE', etc.
            if (this.activeFilters.status !== 'all') {
                const planetStatus = planet.status || '';
                const planetStatusUpper = planetStatus.toUpperCase();
                const filterStatusUpper = this.activeFilters.status.toUpperCase();

                let matchesStatus = false;
                if (filterStatusUpper === 'CONFIRMED') {
                    // Match "CONFIRMED", "Confirmed Planet", "CONFIRMED PLANET", etc.
                    matchesStatus = planetStatusUpper.includes('CONFIRMED') ||
                        planetStatusUpper === 'CONFIRMED PLANET' ||
                        planetStatus === 'Confirmed Planet';
                } else if (filterStatusUpper === 'CANDIDATE') {
                    // Match "CANDIDATE" - but exclude confirmed and false positives
                    matchesStatus = (planetStatusUpper.includes('CANDIDATE') || planetStatus === 'CANDIDATE') &&
                        !planetStatusUpper.includes('CONFIRMED') &&
                        !planetStatusUpper.includes('FALSE');
                } else {
                    matchesStatus = planetStatusUpper.includes(filterStatusUpper);
                }

                if (!matchesStatus) {
                    return false; // Doesn't match status filter
                }
            }

            if (this.activeFilters.type !== 'all' && planet.type !== this.activeFilters.type) {
                return false; // Doesn't match type filter
            }

            if (this.activeFilters.availability !== 'all' && planet.availability !== this.activeFilters.availability) {
                return false; // Doesn't match availability filter
            }

            const radius = planet.radius;
            if (radiusMin !== null && (radius === null || radius === undefined || isNaN(radius) || radius < radiusMin)) {
                return false;
            }
            if (radiusMax !== null && (radius === null || radius === undefined || isNaN(radius) || radius > radiusMax)) {
                return false;
            }

            const distance = planet.distance;
            if (distanceMin !== null && (distance === null || distance === undefined || isNaN(distance) || distance < distanceMin)) {
                return false;
            }
            if (distanceMax !== null && (distance === null || distance === undefined || isNaN(distance) || distance > distanceMax)) {
                return false;
            }

            const year = planet.disc_year;
            if (yearMin !== null && (year === null || year === undefined || isNaN(year) || year < yearMin)) {
                return false;
            }
            if (yearMax !== null && (year === null || year === undefined || isNaN(year) || year > yearMax)) {
                return false;
            }

            return true; // Passes all filters
        });

        // Update search count
        const searchCount = document.getElementById('search-count');
        if (searchCount) {
            searchCount.textContent = `${this.filteredData.length} result${this.filteredData.length !== 1 ? 's' : ''}`;
        }

        if (!preservePage || !this.currentPage || this.currentPage < 1) {
            this.currentPage = 1;
        }

        this.updateURLFromState();
        this.renderPage();
    }

    applyStateFromURL() {
        try {
            if (typeof window === 'undefined' || !window.location) {
                this.applyFilters();
                return;
            }

            const params = new URLSearchParams(window.location.search || '');
            const search = params.get('q') || '';
            const status = params.get('status') || 'all';
            const type = params.get('type') || 'all';
            const availability = params.get('availability') || 'all';
            const radiusMinParam = parseFloat(params.get('rmin'));
            const radiusMaxParam = parseFloat(params.get('rmax'));
            const distanceMinParam = parseFloat(params.get('dmin'));
            const distanceMaxParam = parseFloat(params.get('dmax'));
            const yearMinParam = parseInt(params.get('ymin') || '', 10);
            const yearMaxParam = parseInt(params.get('ymax') || '', 10);
            const planetParamRaw = params.get('planet');
            const pageParam = parseInt(params.get('page') || '', 10);
            const pageFromUrl = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

            const radiusMinFromUrl = !isNaN(radiusMinParam) ? radiusMinParam : null;
            const radiusMaxFromUrl = !isNaN(radiusMaxParam) ? radiusMaxParam : null;
            const distanceMinFromUrl = !isNaN(distanceMinParam) ? distanceMinParam : null;
            const distanceMaxFromUrl = !isNaN(distanceMaxParam) ? distanceMaxParam : null;
            const yearMinFromUrl = !isNaN(yearMinParam) ? yearMinParam : null;
            const yearMaxFromUrl = !isNaN(yearMaxParam) ? yearMaxParam : null;
            const planetFromUrl = planetParamRaw && planetParamRaw.trim() ? planetParamRaw.trim() : null;

            this.searchTerm = search ? search.toLowerCase() : '';
            this.activeFilters = {
                status,
                type,
                availability
            };

            this.rangeFilters = {
                radiusMin: radiusMinFromUrl,
                radiusMax: radiusMaxFromUrl,
                distanceMin: distanceMinFromUrl,
                distanceMax: distanceMaxFromUrl,
                yearMin: yearMinFromUrl,
                yearMax: yearMaxFromUrl
            };

            this.selectedPlanetKepid = planetFromUrl;

            const searchInput = document.getElementById('planet-search');
            if (searchInput && search) {
                searchInput.value = search;
            }

            const filterStatus = document.getElementById('filter-status');
            const filterType = document.getElementById('filter-type');
            const filterAvailability = document.getElementById('filter-availability');

            if (filterStatus) filterStatus.value = status;
            if (filterType) filterType.value = type;
            if (filterAvailability) filterAvailability.value = availability;

            const radiusMinInputFromDom = document.getElementById('filter-radius-min');
            const radiusMaxInputFromDom = document.getElementById('filter-radius-max');
            const distanceMinInputFromDom = document.getElementById('filter-distance-min');
            const distanceMaxInputFromDom = document.getElementById('filter-distance-max');
            const yearMinInputFromDom = document.getElementById('filter-year-min');
            const yearMaxInputFromDom = document.getElementById('filter-year-max');

            if (radiusMinInputFromDom && radiusMinFromUrl !== null) radiusMinInputFromDom.value = radiusMinFromUrl;
            if (radiusMaxInputFromDom && radiusMaxFromUrl !== null) radiusMaxInputFromDom.value = radiusMaxFromUrl;
            if (distanceMinInputFromDom && distanceMinFromUrl !== null) distanceMinInputFromDom.value = distanceMinFromUrl;
            if (distanceMaxInputFromDom && distanceMaxFromUrl !== null) distanceMaxInputFromDom.value = distanceMaxFromUrl;
            if (yearMinInputFromDom && yearMinFromUrl !== null) yearMinInputFromDom.value = yearMinFromUrl;
            if (yearMaxInputFromDom && yearMaxFromUrl !== null) yearMaxInputFromDom.value = yearMaxFromUrl;

            this.currentPage = pageFromUrl;
            this.applyFilters(true);

            if (planetFromUrl) {
                // Defer opening details slightly until cards are rendered
                setTimeout(() => {
                    if (typeof this.openPlanetDetailFromState === 'function') {
                        this.openPlanetDetailFromState(planetFromUrl);
                    } else if (typeof showPlanetDetails === 'function') {
                        showPlanetDetails(planetFromUrl);
                    }
                }, 100);
            }
        } catch (error) {
            console.warn('Failed to apply state from URL:', error);
            this.applyFilters();
        }
    }

    updateURLFromState() {
        try {
            if (typeof window === 'undefined' || !window.history || !window.location) {
                return;
            }

            const params = new URLSearchParams(window.location.search || '');
            const rawQuery = this.searchTerm || '';
            const status = this.activeFilters && this.activeFilters.status ? this.activeFilters.status : 'all';
            const type = this.activeFilters && this.activeFilters.type ? this.activeFilters.type : 'all';
            const availability = this.activeFilters && this.activeFilters.availability ? this.activeFilters.availability : 'all';
            const ranges = this.rangeFilters || {};

            if (rawQuery) {
                params.set('q', rawQuery);
            } else {
                params.delete('q');
            }

            if (status && status !== 'all') {
                params.set('status', status);
            } else {
                params.delete('status');
            }

            if (type && type !== 'all') {
                params.set('type', type);
            } else {
                params.delete('type');
            }

            if (availability && availability !== 'all') {
                params.set('availability', availability);
            } else {
                params.delete('availability');
            }

            const hasRadiusMin = typeof ranges.radiusMin === 'number' && !isNaN(ranges.radiusMin);
            const hasRadiusMax = typeof ranges.radiusMax === 'number' && !isNaN(ranges.radiusMax);
            const hasDistanceMin = typeof ranges.distanceMin === 'number' && !isNaN(ranges.distanceMin);
            const hasDistanceMax = typeof ranges.distanceMax === 'number' && !isNaN(ranges.distanceMax);
            const hasYearMin = typeof ranges.yearMin === 'number' && !isNaN(ranges.yearMin);
            const hasYearMax = typeof ranges.yearMax === 'number' && !isNaN(ranges.yearMax);

            if (hasRadiusMin) {
                params.set('rmin', String(ranges.radiusMin));
            } else {
                params.delete('rmin');
            }

            if (hasRadiusMax) {
                params.set('rmax', String(ranges.radiusMax));
            } else {
                params.delete('rmax');
            }

            if (hasDistanceMin) {
                params.set('dmin', String(ranges.distanceMin));
            } else {
                params.delete('dmin');
            }

            if (hasDistanceMax) {
                params.set('dmax', String(ranges.distanceMax));
            } else {
                params.delete('dmax');
            }

            if (hasYearMin) {
                params.set('ymin', String(ranges.yearMin));
            } else {
                params.delete('ymin');
            }

            if (hasYearMax) {
                params.set('ymax', String(ranges.yearMax));
            } else {
                params.delete('ymax');
            }

            if (this.selectedPlanetKepid) {
                params.set('planet', String(this.selectedPlanetKepid));
            } else {
                params.delete('planet');
            }

            if (this.currentPage && this.currentPage > 1) {
                params.set('page', String(this.currentPage));
            } else {
                params.delete('page');
            }

            const queryString = params.toString();
            const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '') + window.location.hash;
            window.history.replaceState({}, '', newUrl);
        } catch (error) {
            console.warn('Failed to update URL state for database filters:', error);
        }
    }

    applyLastSearchFromHistoryIfNeeded() {
        try {
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                return;
            }

            const hasQueryInUrl = !!(window.location && window.location.search && window.location.search.indexOf('q=') !== -1);
            if (hasQueryInUrl) {
                return;
            }

            if (this.searchTerm && this.searchTerm.length >= 2) {
                return;
            }

            const raw = localStorage.getItem('search-history');
            if (!raw) {
                return;
            }

            let history;
            try {
                history = JSON.parse(raw);
            } catch (e) {
                return;
            }

            if (!Array.isArray(history) || history.length === 0) {
                return;
            }

            const last = history[0];
            if (!last || !last.query || typeof last.query !== 'string') {
                return;
            }

            const searchInput = document.getElementById('planet-search');
            if (!searchInput || searchInput.value) {
                return;
            }

            const query = last.query.trim();
            if (!query) {
                return;
            }

            this.searchTerm = query.toLowerCase();
            searchInput.value = query;
            this.applyFilters();
        } catch (error) {
            console.warn('Failed to apply last search from history:', error);
        }
    }

    openPlanetDetailFromState(kepid) {
        try {
            if (!kepid) {
                return;
            }

            if (typeof showPlanetDetails === 'function') {
                showPlanetDetails(kepid);
                return;
            }

            const match = this.allData && this.allData.find(p => this.compareKepid(p.kepid, kepid));
            if (!match) {
                return;
            }

            // Fallback: simple alert with key stats if global helper is not available
            alert(`Planet ${match.kepler_name || match.kepoi_name || match.kepid}\nType: ${match.type || 'Unknown'}\nRadius: ${match.radius || 'N/A'}x Earth\nDistance: ${match.distance || 'N/A'} ly`);
        } catch (error) {
            console.warn('Failed to open planet detail from URL state:', error);
        }
    }

    applyNaturalLanguageFilters(filters, originalQuery) {
        try {
            if (!this.rangeFilters) {
                this.rangeFilters = {
                    radiusMin: null,
                    radiusMax: null,
                    distanceMin: null,
                    distanceMax: null,
                    yearMin: null,
                    yearMax: null
                };
            }

            this.searchTerm = '';

            if (filters && typeof filters === 'object') {
                if (filters.disposition === 'CONFIRMED' || filters.disposition === 'CANDIDATE') {
                    this.activeFilters.status = filters.disposition;
                } else {
                    this.activeFilters.status = 'all';
                }

                if (filters.planet_type === 'Gas Giant') {
                    this.activeFilters.type = 'Gas Giant';
                } else if (filters.planet_type === 'Terrestrial') {
                    this.activeFilters.type = 'Earth-like';
                } else {
                    this.activeFilters.type = 'all';
                }

                const toNumberOrNull = (value) => {
                    if (typeof value === 'number' && !isNaN(value)) {
                        return value;
                    }
                    return null;
                };

                const ranges = this.rangeFilters;
                ranges.radiusMin = toNumberOrNull(filters.radius_min);
                ranges.radiusMax = toNumberOrNull(filters.radius_max);
                ranges.distanceMin = null;
                ranges.distanceMax = toNumberOrNull(filters.distance_max);
                ranges.yearMin = null;
                ranges.yearMax = null;
            }

            const filterStatus = document.getElementById('filter-status');
            const filterType = document.getElementById('filter-type');
            const filterAvailability = document.getElementById('filter-availability');
            if (filterStatus) filterStatus.value = this.activeFilters.status;
            if (filterType) filterType.value = this.activeFilters.type;
            if (filterAvailability) filterAvailability.value = this.activeFilters.availability;

            const radiusMinInput = document.getElementById('filter-radius-min');
            const radiusMaxInput = document.getElementById('filter-radius-max');
            const distanceMinInput = document.getElementById('filter-distance-min');
            const distanceMaxInput = document.getElementById('filter-distance-max');
            const yearMinInput = document.getElementById('filter-year-min');
            const yearMaxInput = document.getElementById('filter-year-max');

            if (radiusMinInput) radiusMinInput.value = this.rangeFilters.radiusMin != null ? this.rangeFilters.radiusMin : '';
            if (radiusMaxInput) radiusMaxInput.value = this.rangeFilters.radiusMax != null ? this.rangeFilters.radiusMax : '';
            if (distanceMinInput) distanceMinInput.value = this.rangeFilters.distanceMin != null ? this.rangeFilters.distanceMin : '';
            if (distanceMaxInput) distanceMaxInput.value = this.rangeFilters.distanceMax != null ? this.rangeFilters.distanceMax : '';
            if (yearMinInput) yearMinInput.value = this.rangeFilters.yearMin != null ? this.rangeFilters.yearMin : '';
            if (yearMaxInput) yearMaxInput.value = this.rangeFilters.yearMax != null ? this.rangeFilters.yearMax : '';

            this.currentPage = 1;
            this.applyFilters();
            this.showNaturalLanguageContext(originalQuery, filters);
        } catch (error) {
            console.warn('Failed to apply natural language filters to database page:', error);
        }
    }

    showNaturalLanguageContext(originalQuery, filters) {
        try {
            const el = document.getElementById('nl-query-context');
            if (!el) {
                return;
            }

            if (!originalQuery) {
                el.textContent = '';
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
                return;
            }

            const parts = [];
            if (this.activeFilters && this.activeFilters.status && this.activeFilters.status !== 'all') {
                parts.push(`Status: ${this.activeFilters.status}`);
            }
            if (this.activeFilters && this.activeFilters.type && this.activeFilters.type !== 'all') {
                parts.push(`Type: ${this.activeFilters.type}`);
            }

            const ranges = this.rangeFilters || {};
            if (typeof ranges.radiusMin === 'number' && !isNaN(ranges.radiusMin)) {
                parts.push(`Radius ≥ ${ranges.radiusMin}`);
            }
            if (typeof ranges.radiusMax === 'number' && !isNaN(ranges.radiusMax)) {
                parts.push(`Radius ≤ ${ranges.radiusMax}`);
            }
            if (typeof ranges.distanceMin === 'number' && !isNaN(ranges.distanceMin)) {
                parts.push(`Distance ≥ ${Math.round(ranges.distanceMin)}`);
            }
            if (typeof ranges.distanceMax === 'number' && !isNaN(ranges.distanceMax)) {
                parts.push(`Distance ≤ ${Math.round(ranges.distanceMax)}`);
            }

            if (typeof ranges.yearMin === 'number' && !isNaN(ranges.yearMin)) {
                parts.push(`Year ≥ ${ranges.yearMin}`);
            }
            if (typeof ranges.yearMax === 'number' && !isNaN(ranges.yearMax)) {
                parts.push(`Year ≤ ${ranges.yearMax}`);
            }

            if (parts.length === 0) {
                el.textContent = `AI understood: ${originalQuery}`;
            } else {
                el.textContent = `AI understood: ${originalQuery} → ${parts.join(' · ')}`;
            }
            el.style.visibility = 'visible';
            el.style.opacity = '0.95';
        } catch (error) {
            console.warn('Failed to show natural language query context:', error);
        }
    }

    logSearchAnalytics(rawQuery) {
        try {
            if (!rawQuery || rawQuery.length < 2) {
                return;
            }

            const now = Date.now();
            if (rawQuery === this.lastSearchLogQuery && typeof this.lastSearchLogTime === 'number') {
                const elapsed = now - this.lastSearchLogTime;
                if (elapsed >= 0 && elapsed < 5000) {
                    return;
                }
            }

            this.lastSearchLogQuery = rawQuery;
            this.lastSearchLogTime = now;

            const computeFairnessSummary = () => {
                if (!window.aiModelBiasDetection || typeof window.aiModelBiasDetection.detectBias !== 'function') {
                    return null;
                }
                try {
                    const modelId = 'planet-search:ui';
                    const testData = [
                        { group: 'A', prediction: 1 },
                        { group: 'A', prediction: 0 },
                        { group: 'B', prediction: 1 },
                        { group: 'B', prediction: 1 }
                    ];
                    const detection = window.aiModelBiasDetection.detectBias(modelId, testData);
                    return {
                        overallBias: detection && detection.overallBias ? detection.overallBias : null,
                        metric: 'demographic-parity',
                        disparity: detection && detection.biases && detection.biases[0] ? detection.biases[0].disparity : null
                    };
                } catch (e) {
                    console.warn('AI fairness detection failed for planet search:', e);
                    return null;
                }
            };

            const baseContext = {
                queryLength: rawQuery.length,
                fairness: computeFairnessSummary()
            };

            const safeLog = (extraContext) => {
                if (!window.aiUsageLogger || typeof window.aiUsageLogger.log !== 'function') {
                    return;
                }
                try {
                    window.aiUsageLogger.log({
                        feature: 'planet-search',
                        model: 'ui',
                        context: Object.assign({}, baseContext, extraContext || {}, {
                            fairness: computeFairnessSummary()
                        })
                    });
                } catch (e) {
                    console.warn('AI usage logging failed for planet search:', e);
                }
            };

            if (window.textClassification && typeof window.textClassification.classify === 'function') {
                Promise.resolve(window.textClassification.classify(rawQuery, { source: 'planet-search' }))
                    .then((result) => {
                        const classificationContext = {
                            textCategory: result && result.category ? result.category : null,
                            textCategoryConfidence: result && typeof result.confidence === 'number' ? result.confidence : null
                        };
                        safeLog(classificationContext);
                    })
                    .catch((error) => {
                        console.warn('Search text classification failed:', error);
                        safeLog({});
                    });
            } else {
                safeLog({});
            }
        } catch (error) {
            console.warn('Search analytics logging failed:', error);
        }
    }

    /**
     * Render the current page of filtered planet results
     * 
     * Creates planet cards with all information and action buttons.
     * Handles pagination and updates UI accordingly.
     * 
     * @method renderPage
     * @returns {void}
     */
    renderPage() {
        const container = document.getElementById('results-container');
        if (!container) return;

        // Calculate page data
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredData.slice(start, end);

        // Update render token
        this.renderGeneration = (this.renderGeneration || 0) + 1;
        const renderToken = this.renderGeneration;

        container.innerHTML = `
            <div class="planets-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;"></div>
        `;

        const grid = container.querySelector('.planets-grid');
        if (!grid) {
            this.renderExportTools(pageData);
            this.updatePaginationControls();
            return;
        }

        const batchSize = 10;
        const total = pageData.length;
        const useRaf = typeof window !== 'undefined' && window && typeof window.requestAnimationFrame === 'function'
            && (typeof document === 'undefined' || !document || document.visibilityState === 'visible');
        let index = 0;

        const renderBatch = () => {
            if (renderToken !== this.renderGeneration) {
                return;
            }

            const sliceEnd = Math.min(index + batchSize, total);
            let htmlChunk = '';

            for (let i = index; i < sliceEnd; i++) {
                const planet = pageData[i];

                const planetStatus = planet.status || '';
                const statusUpper = planetStatus.toUpperCase();
                let displayStatus = planetStatus;

                if (statusUpper.includes('CONFIRMED') || planetStatus === 'Confirmed Planet') {
                    displayStatus = 'CONFIRMED';
                } else if (statusUpper.includes('CANDIDATE') || planetStatus === 'CANDIDATE') {
                    displayStatus = 'CANDIDATE';
                } else if (statusUpper.includes('FALSE')) {
                    displayStatus = 'FALSE POSITIVE';
                }

                const statusClass = displayStatus === 'CONFIRMED'
                    ? 'confirmed'
                    : displayStatus === 'FALSE POSITIVE' ? 'false-positive' : 'candidate';
                const typeClass = String(planet.type || 'unknown')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                const isClaiming = window.databaseInstance && window.databaseInstance.isClaiming === true;
                const isAvailable = planet.availability === 'available';
                const cardIndex = i;
                const visualKey = `${planet.kepoi_name || ''}|${planet.kepler_name || ''}|${planet.kepid || cardIndex}`;
                let visualSeed = 2166136261;
                for (let seedIndex = 0; seedIndex < visualKey.length; seedIndex++) {
                    visualSeed ^= visualKey.charCodeAt(seedIndex);
                    visualSeed = Math.imul(visualSeed, 16777619) >>> 0;
                }
                const hueShift = (visualSeed % 61) - 30;
                const orbitTilt = (visualSeed % 25) - 12;
                const visualVariant = visualSeed % 6;
                const radiusValue = Math.max(Number(planet.radius) || 1, 0.25);
                const planetScale = Math.min(1.08, Math.max(0.88, 0.88 + Math.log2(radiusValue + 1) * 0.075)).toFixed(3);
                const planetName = planet.kepler_name || planet.kepoi_name;

                htmlChunk += `
                    <article class="planet-card ita-planet-card" data-entrance="slideUp" data-kepid="${planet.kepid}" data-name="${planetName}" data-radius="${planet.radius}" data-mass="${planet.mass}" data-distance="${planet.distance}" data-planet-type="${typeClass}" data-status="${statusClass}" style="--card-index:${cardIndex};--planet-shift:${hueShift}deg;--planet-tilt:${orbitTilt}deg;--planet-scale:${planetScale}">
                        <div class="ita-card-visual">
                            <div class="ita-planet-visual ita-planet--${typeClass} ita-planet-v${visualVariant}" role="img" aria-label="${planetName}, ${planet.type} visual representation">
                                <span class="ita-planet-orbit" aria-hidden="true"></span>
                                <span class="ita-planet-sphere" aria-hidden="true"></span>
                            </div>
                            <div class="ita-card-state">
                                <span class="ita-status ita-status--${statusClass}">${displayStatus}</span>
                                <span class="ita-availability ${isAvailable ? 'is-online' : 'is-claimed'}"><i></i>${isAvailable ? 'Open record' : 'Claimed'}</span>
                            </div>
                        </div>

                        <div class="ita-card-heading">
                            <p class="ita-card-eyebrow">KEPLER // ${planet.kepler_name ? planet.kepoi_name : `ID ${planet.kepid}`}</p>
                            <h3 class="planet-name">${planetName}</h3>
                        </div>

                        <div class="ita-card-metrics" aria-label="Planet telemetry">
                            <div class="ita-metric"><span>Class</span><strong>${planet.type}</strong></div>
                            <div class="ita-metric"><span>Radius</span><strong>${planet.radius.toFixed(2)} R&#8853;</strong></div>
                            <div class="ita-metric"><span>Mass</span><strong>${planet.mass.toFixed(2)} M&#8853;</strong></div>
                            <div class="ita-metric"><span>Range</span><strong>${planet.distance.toFixed(0)} ly</strong></div>
                        </div>

                        <div class="ita-card-telemetry">
                            <div><span>Confidence</span><strong>${(planet.score * 100).toFixed(0)}%</strong></div>
                            <div><span>Discovered</span><strong>${planet.disc_year}</strong></div>
                        </div>

                        <div class="ita-card-actions">
                            <a href="education.html?target=${encodeURIComponent(planetName)}" class="ita-card-primary">Open world <span aria-hidden="true">&nearr;</span></a>
                            <button class="details-btn ita-card-action" data-kepid="${planet.kepid}" type="button">Details</button>
                            <button class="habitability-btn ita-card-action" data-kepid="${planet.kepid}" type="button">Habitability</button>
                        </div>
                        <div class="ita-card-utility-actions">
                            <button class="compare-btn ita-card-utility" data-kepid="${planet.kepid}" type="button">Compare</button>
                            <button class="bookmark-btn ita-card-utility" data-kepid="${planet.kepid}" type="button">Save</button>
                            <button class="claim-button ita-card-utility ita-card-claim" data-kepid="${planet.kepid}" type="button" ${!isAvailable || isClaiming ? 'disabled' : ''}>${isClaiming ? 'Claiming&hellip;' : isAvailable ? 'Claim world' : 'Claimed'}</button>
                        </div>
                        <div class="ai-description-container" data-kepid="${planet.kepid}"></div>
                    </article>
                `;
            }

            if (htmlChunk) {
                grid.insertAdjacentHTML('beforeend', htmlChunk);
            }

            index = sliceEnd;

            if (index < total) {
                if (useRaf) {
                    window.requestAnimationFrame(renderBatch);
                } else {
                    setTimeout(renderBatch, 0);
                }
            } else {
                this.renderExportTools(pageData);

                this.setupLazyLoading();

                document.querySelectorAll('.view-3d-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const kepid = e.target.dataset.kepid;
                        const planet = this.allData.find(p => this.compareKepid(p.kepid, kepid));
                        if (planet) {
                            if (typeof Planet3DViewer !== 'undefined') {
                                const viewer = new Planet3DViewer();
                                viewer.visualizePlanet(planet);
                            } else {
                                console.error('Planet3DViewer not loaded');
                                alert('3D Viewer component is missing. Please reload the page.');
                            }
                        }
                    });
                });

                this.initializeAIDescriptions(pageData);
                this.updatePaginationControls();
                this.scrollResultsIntoView();
            }
        };

        if (useRaf) {
            window.requestAnimationFrame(renderBatch);
        } else {
            renderBatch();
        }
    }

    setupLazyLoading() {
        try {
            const hasWindow = typeof window !== 'undefined';
            const supportsObserver = hasWindow && 'IntersectionObserver' in window;
            if (!supportsObserver) {
                return;
            }

            const cards = document.querySelectorAll('.planet-card[data-lazy-load="true"]');
            if (!cards || cards.length === 0) {
                return;
            }

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const card = entry.target;
                        // Avoid layout-affecting transforms/opacity shifts for CLS safety
                        card.style.opacity = '1';
                        card.style.transform = 'none';
                        card.style.transition = 'none';
                        obs.unobserve(card);
                    }
                });
            }, {
                root: null,
                rootMargin: '0px',
                threshold: 0.05
            });

            cards.forEach((card, index) => {
                card.style.willChange = 'transform, opacity';
                if (index > 8) {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(8px)';
                }
                observer.observe(card);
            });
        } catch (error) {
            console.warn('Failed to setup lazy loading for planet cards:', error);
        }
    }

    renderExportTools(pageData) {
        try {
            const exportContainer = document.getElementById('results-export-container');
            if (!exportContainer) {
                return;
            }

            if (!Array.isArray(pageData) || pageData.length === 0) {
                exportContainer.innerHTML = '';
                return;
            }

            if (window.planetDiscoveryExport && typeof window.planetDiscoveryExport.renderExport === 'function') {
                const discoveries = pageData.map((planet) => ({
                    name: planet.kepler_name || planet.kepoi_name || '',
                    planetName: planet.kepler_name || planet.kepoi_name || '',
                    kepid: planet.kepid,
                    planetId: planet.kepid,
                    discoveryDate: planet.disc_year || '',
                    timestamp: planet.disc_year || '',
                    status: planet.status || 'Unknown',
                    radius: planet.radius,
                    temperature: null
                }));
                window.planetDiscoveryExport.renderExport('results-export-container', discoveries);
            } else {
                exportContainer.innerHTML = `
                    <div style="margin-top: 1rem; font-size: 0.85rem; opacity: 0.8; text-align: center;">
                        Export tools are temporarily unavailable.
                    </div>
                `;
            }
        } catch (error) {
            console.warn('Failed to render export tools for database results:', error);
        }
    }

    initializeAIDescriptions(pageData) {
        try {
            if (!window.aiPlanetDescriptions) {
                return;
            }

            // Handle both factory function and singleton instance
            let helper = window.aiPlanetDescriptions;
            if (typeof window.aiPlanetDescriptions === 'function') {
                helper = window.aiPlanetDescriptions();
            }

            if (!helper || typeof helper.renderDescription !== 'function') {
                return;
            }

            if (!Array.isArray(pageData) || pageData.length === 0) {
                return;
            }

            pageData.forEach((planet) => {
                if (!planet || (!planet.kepid && !planet.kepoi_name)) {
                    return;
                }
                const id = planet.kepid || planet.kepoi_name;
                const descContainer = document.querySelector(`.planet-card[data-kepid="${id}"] .ai-description-container`);
                if (descContainer) {
                    helper.renderDescription(descContainer, planet);
                }
            });
        } catch (error) {
            console.warn('Failed to initialize AI planet descriptions on database page:', error);
        }
    }

    scrollResultsIntoView() {
        if (!this.scrollResultsAfterInteraction) {
            return;
        }
        this.scrollResultsAfterInteraction = false;
        try {
            const container = document.getElementById('results-container');
            if (!container) {
                return;
            }

            const supportsMatchMedia = typeof window !== 'undefined' && window && typeof window.matchMedia === 'function';
            const prefersReducedMotion = supportsMatchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isEdge = typeof navigator !== 'undefined' && navigator && /Edg\//.test(navigator.userAgent || '');
            const useSmooth = !prefersReducedMotion && !isEdge;

            if (typeof container.scrollIntoView === 'function') {
                if (useSmooth) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    container.scrollIntoView({ block: 'start' });
                }
            } else if (typeof window !== 'undefined') {
                const rect = container.getBoundingClientRect();
                const offset = window.pageYOffset || document.documentElement.scrollTop || 0;
                window.scrollTo(0, rect.top + offset - 80);
            }
        } catch (error) {
            console.warn('Failed to scroll results into view:', error);
        }
    }

    /**
     * Create pagination controls
     * 
     * Note: Container is created in renderPage().
     * This method is a placeholder for consistency.
     * 
     * @private
     * @returns {void}
     */
    createPaginationControls() {
        // Container is created in renderPage
    }

    /**
     * Update pagination controls
     * 
     * Creates pagination buttons with smart ellipsis handling.
     * Shows page numbers around current page and handles navigation.
     * 
     * @private
     * @returns {void}
     */
    updatePaginationControls() {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);

        let pagesHTML = '';
        const maxButtons = 7;

        if (totalPages <= maxButtons) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pagesHTML += this.createPageButton(i);
            }
        } else {
            // Show first page
            pagesHTML += this.createPageButton(1);

            // Show ellipsis or pages around current
            if (this.currentPage > 3) {
                pagesHTML += '<span style="padding: 0.5rem 1rem; color: rgba(255, 255, 255, 0.5);">...</span>';
            }

            // Show pages around current
            const startPage = Math.max(2, this.currentPage - 1);
            const endPage = Math.min(totalPages - 1, this.currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pagesHTML += this.createPageButton(i);
            }

            // Show ellipsis or last page
            if (this.currentPage < totalPages - 2) {
                pagesHTML += '<span style="padding: 0.5rem 1rem; color: rgba(255, 255, 255, 0.5);">...</span>';
            }

            // Show last page
            pagesHTML += this.createPageButton(totalPages);
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 2rem; background: rgba(0, 0, 0, 0.5); border-radius: 15px; border: 2px solid rgba(186, 148, 79, 0.3);">
                <button id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''} class="pagination-button" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" ${this.currentPage === 1 ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    ← Previous
                </button>
                
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                    ${pagesHTML}
                </div>
                
                <button id="next-page" ${this.currentPage === totalPages ? 'disabled' : ''} class="pagination-button" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" ${this.currentPage === totalPages ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    Next →
                </button>
                
                <div style="width: 100%; text-align: center; margin-top: 1rem; opacity: 0.7; font-size: 0.9rem;">
                    Showing ${start}-${end} of ${this.filteredData.length} planets
                </div>
            </div>
        `;

        // Add event listeners
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');

        if (prevButton && this.currentPage > 1) {
            prevButton.addEventListener('click', () => {
                this.currentPage--;
                this.updateURLFromState();
                this.renderPage();
            });
        }

        if (nextButton && this.currentPage < totalPages) {
            nextButton.addEventListener('click', () => {
                this.currentPage++;
                this.updateURLFromState();
                this.renderPage();
            });
        }

        // Add event listeners for page number buttons
        document.querySelectorAll('.page-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page, 10);
                this.currentPage = page;
                this.updateURLFromState();
                this.renderPage();
            });
        });
    }

    /**
     * Create a single pagination page button
     * 
     * @private
     * @param {number} pageNum - Page number to create button for
     * @returns {string} HTML string for the page button
     */
    createPageButton(pageNum) {
        const isActive = pageNum === this.currentPage;
        return `
            <button class="page-button" data-page="${pageNum}" style="padding: 0.5rem 1rem; background: ${isActive ? 'rgba(186, 148, 79, 0.5)' : 'rgba(186, 148, 79, 0.1)'}; border: 2px solid ${isActive ? '#ba944f' : 'rgba(186, 148, 79, 0.3)'}; border-radius: 8px; color: ${isActive ? '#ba944f' : 'white'}; cursor: pointer; font-weight: ${isActive ? 'bold' : 'normal'}; transition: all 0.3s ease; min-width: 40px;">
                ${pageNum}
            </button>
        `;
    }

    /**
     * Generate pseudo-random number from seed
     * 
     * Creates deterministic "random" values based on kepid seed.
     * Used for consistent planet property estimation.
     * 
     * @private
     * @param {number} seed - Seed value (typically kepid)
     * @returns {number} Pseudo-random number between 0 and 1
     */
    _pseudoRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Estimate planet radius based on kepid and score
     * 
     * Uses deterministic pseudo-random generation for consistency.
     * Returns actual radius if available, otherwise estimates.
     * 
     * @private
     * @param {Object} planet - Planet object with kepid and score
     * @returns {number} Estimated radius in Earth radii (0.5-4.5)
     */
    estimateRadius(planet) {
        if (planet.radius && !isNaN(planet.radius)) return planet.radius;
        const seed = planet.kepid || 1;
        const rand = this._pseudoRandom(seed);
        const score = planet.score || 0.5;
        return 0.5 + rand * (score * 4); // 0.5-4.5 Earth radii
    }

    /**
     * Estimate planet mass based on kepid and score
     * 
     * Uses deterministic pseudo-random generation for consistency.
     * Returns actual mass if available, otherwise estimates.
     * 
     * @private
     * @param {Object} planet - Planet object with kepid and score
     * @returns {number} Estimated mass in Earth masses (0.3-10.3)
     */
    estimateMass(planet) {
        if (planet.mass && !isNaN(planet.mass)) return planet.mass;
        const seed = (planet.kepid || 1) + 1;
        const rand = this._pseudoRandom(seed);
        const score = planet.score || 0.5;
        return 0.3 + rand * (score * 10); // 0.3-10.3 Earth masses
    }

    /**
     * Estimate planet distance based on kepid
     * 
     * Uses deterministic pseudo-random generation for consistency.
     * 
     * @private
     * @param {string|number} kepid - Planet's Kepler ID
     * @returns {number} Estimated distance in light-years (100-2100)
     */
    estimateDistance(kepid) {
        const seed = (kepid || 1) + 2;
        const rand = this._pseudoRandom(seed);
        return 100 + (rand * 2000); // 100-2100 light-years
    }

    /**
     * Estimate discovery year based on kepid
     * 
     * Uses deterministic pseudo-random generation for consistency.
     * Returns actual year if available, otherwise estimates.
     * 
     * @private
     * @param {Object} planet - Planet object with kepid
     * @returns {number} Discovery year (2009-2018)
     */
    estimateDiscoveryYear(planet) {
        if (planet.disc_year) return planet.disc_year;
        const seed = (planet.kepid || 1) + 3;
        const rand = this._pseudoRandom(seed);
        return 2009 + Math.floor(rand * 9); // 2009-2018
    }

    /**
     * Classify planet type based on radius
     * 
     * @private
     * @param {number} radius - Planet radius in Earth radii
     * @returns {string} Planet type: 'Earth-like', 'Super-Earth', 'Mini-Neptune', or 'Gas Giant'
     */
    classifyPlanet(radius) {
        if (radius < 1.25) return 'Earth-like';
        if (radius < 2.0) return 'Super-Earth';
        if (radius < 6.0) return 'Mini-Neptune';
        return 'Gas Giant';
    }

    /**
     * Get emoji icon for planet type
     * 
     * @private
     * @param {string} type - Planet type
     * @returns {string} Emoji icon for the planet type
     */
    getPlanetIcon(type) {
        const icons = {
            'Earth-like': '🌍',
            'Super-Earth': '🌎',
            'Mini-Neptune': '🔵',
            'Gas Giant': '🪐'
        };
        return icons[type] || '🌐';
    }

    /**
     * Generate sample data for fallback/testing
     * 
     * Creates sample planet data when real database is unavailable.
     * 
     * @private
     * @param {number} count - Number of sample planets to generate
     * @returns {Array<Object>} Array of sample planet objects
     */
    generateSampleData(count) {
        // Fallback sample data generator
        return Array.from({ length: count }, (_, i) => ({
            kepid: 10000000 + i,
            kepoi_name: `K${String(i + 1).padStart(5, '0')}.01`,
            kepler_name: i < 30 ? `Kepler-${i + 1} b` : null,
            status: i < 40 ? 'CONFIRMED' : 'CANDIDATE',
            score: 0.5 + Math.random() * 0.5,
            radius: 0.5 + Math.random() * 4,
            mass: 0.3 + Math.random() * 10,
            distance: 100 + Math.random() * 2000,
            disc_year: 2009 + Math.floor(Math.random() * 10),
            type: this.classifyPlanet(0.5 + Math.random() * 4),
            availability: 'available' // All planets start as available
        }));
    }
}

// Global function for claim button
// Claim planet function with login check
async function claimPlanet(kepid) {
    // Prevent race conditions: check if already claiming
    if (window.databaseInstance && window.databaseInstance.isClaiming) {
        console.log('⏳ Already processing a claim, please wait...');
        return;
    }

    // Set claiming flag to prevent double-clicks
    if (window.databaseInstance) {
        window.databaseInstance.isClaiming = true;
    }

    try {
        // Check if user is logged in
        if (typeof authManager === 'undefined' || !authManager.isAuthenticated()) {
            // Store the kepid for after login
            sessionStorage.setItem('pendingClaim', kepid);

            // Show login modal if available
            if (typeof showModal === 'function') {
                // Check if modal exists
                const loginModal = document.getElementById('login-modal');
                if (loginModal) {
                    showModal('login-modal');
                    if (window.databaseInstance) {
                        window.databaseInstance.isClaiming = false;
                    }
                    return;
                }
            }

            // If modal not available, show confirm and redirect
            if (confirm('🚀 You need to be logged in to claim exoplanets!\n\nWould you like to login now?')) {
                // Redirect to members page for login
                window.location.href = 'members.html?redirect=database&claim=' + kepid;
            } else {
                sessionStorage.removeItem('pendingClaim');
            }
            
            if (window.databaseInstance) {
                window.databaseInstance.isClaiming = false;
            }
            return;
        }

        // User is logged in, proceed with claim
        console.log('🚀 Claiming planet:', kepid);

        const apiBase = window.EXOPLANET_API_BASE || 'https://api.adrianotothestar.com';

        try {
            console.log(`🔌 Attempting to claim via backend: ${apiBase}...`);
            const response = await fetch(`${apiBase}/api/planets/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authManager.getHeaders ? authManager.getHeaders()['Authorization'] : `Bearer ${authManager.token || ''}`
                },
                body: JSON.stringify({ kepid: kepid }),
                signal: AbortSignal.timeout(3000)
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.success) {
                    console.log('✅ Planet claimed successfully via backend');
                    const planetName = (data && data.planet && data.planet.kepler_name)
                        || (data && data.planet && data.planet.kepoi_name)
                        || `Kepler-${kepid}`;

                    if (window.databaseInstance) {
                        window.databaseInstance.showSuccessNotification(
                            `Successfully claimed exoplanet!`,
                            `Planet: ${planetName}`,
                            'View Dashboard',
                            () => window.location.href = 'dashboard.html'
                        );
                    }

                    updatePlanetAvailability(kepid, 'claimed');
                    saveClaimToLocalStorage(kepid, data.planet);

                    if (window.getReputationSystem) {
                        const repSystem = window.getReputationSystem();
                        await repSystem.init();
                        await repSystem.updateActivity('planet_claimed');
                    }

                    if (window.databaseInstance) {
                        window.databaseInstance.isClaiming = false;
                    }

                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                    return;
                }
            }
            
            console.log('🔄 Falling back to localStorage...');
            await claimPlanetLocal(kepid);
        } catch (error) {
            console.error('✗ Error claiming planet:', error);
            await claimPlanetLocal(kepid);
        } finally {
            if (window.databaseInstance) {
                window.databaseInstance.isClaiming = false;
            }
        }
    } catch (e) {
        console.error('Unexpected error in claimPlanet:', e);
        if (window.databaseInstance) {
            window.databaseInstance.isClaiming = false;
        }
    }
}

// Claim planet using localStorage and Supabase (for GitLab Pages or backend fallback)
async function claimPlanetLocal(kepid) {
    console.log('💾 Claiming planet using localStorage and Supabase:', kepid);

    try {
        // Normalize kepid to number for comparison (do this first)
        const searchKepid = typeof kepid === 'string' ? parseInt(kepid, 10) : Number(kepid);
        console.log('🔍 Searching for planet with kepid:', searchKepid, '(original:', kepid, ', type:', typeof kepid, ')');

        // Get current user
        const user = authManager.getCurrentUser();
        if (!user) {
            console.error('❌ No user found');
            if (window.databaseInstance) {
                window.databaseInstance.showErrorNotification(
                    'Login Required',
                    'You must be logged in to claim planets. Please log in and try again.',
                    'Go to Login',
                    () => window.location.href = 'index.html#login'
                );
            } else {
                alert('❌ You must be logged in to claim planets.');
            }
            return;
        }
        console.log('✅ User found:', user.email || user.username);

        // Check if already claimed (check Supabase first, then localStorage)
        console.log('🔍 Checking if planet already claimed...');
        const existingClaim = await checkIfPlanetClaimed(kepid, user);
        if (existingClaim) {
            console.log('⚠️ Planet already claimed by this user');
            if (window.databaseInstance) {
                window.databaseInstance.showSuccessNotification(
                    'Already Claimed',
                    'You have already claimed this planet! View it in your dashboard.',
                    'View Dashboard',
                    () => window.location.href = 'dashboard.html'
                );
            } else {
                alert('✅ You have already claimed this planet!');
            }
            updatePlanetAvailability(kepid, 'claimed');
            return;
        }
        console.log('✅ Planet not yet claimed, proceeding...');

        // Find planet data - try multiple sources
        let planetData = null;
        const dbInstance = window.databaseInstance;

        // Try allData first
        if (dbInstance && dbInstance.allData) {
            console.log('📊 Searching in allData (length:', dbInstance.allData.length, ')');
            planetData = dbInstance.allData.find((p) => {
                // Use normalized comparison helper
                return dbInstance.compareKepid(p.kepid, searchKepid);
            });
            if (planetData) {
                console.log('✅ Found planet in allData:', planetData);
            }
        }

        // Try filteredData if not found
        if (!planetData && dbInstance && dbInstance.filteredData) {
            console.log('📊 Searching in filteredData (length:', dbInstance.filteredData.length, ')');
            planetData = dbInstance.filteredData.find((p) => {
                const planetKepid = typeof p.kepid === 'string' ? parseInt(p.kepid, 10) : Number(p.kepid);
                const matches = planetKepid === searchKepid;
                if (matches) {
                    console.log('✅ Found planet in filteredData:', p);
                }
                return matches;
            });
        }

        // Try searching using normalized comparison (handles type mismatches)
        if (!planetData && dbInstance && dbInstance.allData) {
            planetData = dbInstance.allData.find((p) => {
                return dbInstance.compareKepid(p.kepid, kepid);
            });
            if (planetData) {
                console.log('✅ Found planet by string comparison:', planetData);
            }
        }

        // If still not found, try to get from the clicked button's data attributes
        if (!planetData) {
            const claimButton = document.querySelector(`[data-kepid="${kepid}"]`);
            if (claimButton) {
                const planetCard = claimButton.closest('.planet-card');
                if (planetCard) {
                    // Try to extract planet data from the card's data attributes or text
                    const nameElement = planetCard.querySelector('.planet-name') || planetCard.querySelector('h3');
                    const planetName = nameElement ? nameElement.textContent : `Kepler-${kepid}`;
                    const typeElement = planetCard.querySelector('.planet-type');
                    const planetType = typeElement ? typeElement.textContent : 'Unknown';
                    const radiusElement = planetCard.querySelector('.planet-radius');
                    const planetRadius = radiusElement ? radiusElement.textContent : 'Unknown';

                    // Create minimal planet data from available info
                    planetData = {
                        kepid: typeof kepid === 'string' ? parseInt(kepid, 10) : kepid,
                        kepler_name: planetName.includes('Kepler') ? planetName : null,
                        kepoi_name: planetName.includes('K') && planetName.includes('.') ? planetName : null,
                        type: planetType,
                        radius: parseFloat(planetRadius) || 1.0,
                        mass: 1.0,
                        distance: 1000,
                        status: 'CONFIRMED'
                    };
                    console.log('⚠️ Planet data not in database, using extracted data:', planetData);
                }
            }
        }

        if (!planetData) {
            // Get sample kepids for debugging
            let sampleKepids = [];
            if (dbInstance && Array.isArray(dbInstance.allData)) {
                sampleKepids = dbInstance.allData.slice(0, 10).map((p) => {
                    return {
                        kepid: p.kepid,
                        type: typeof p.kepid,
                        kepler_name: p.kepler_name || p.kepoi_name
                    };
                });
            }

            console.warn('⚠️ Planet not found in database, creating fallback data:', {
                searchKepid: searchKepid,
                originalKepid: kepid,
                kepidType: typeof kepid,
                allDataLength: dbInstance && dbInstance.allData ? dbInstance.allData.length : 0,
                filteredDataLength: dbInstance && dbInstance.filteredData ? dbInstance.filteredData.length : 0,
                databaseInstanceExists: !!dbInstance,
                sampleKepids: sampleKepids
            });

            // Always create a minimal claim if we have the kepid - don't fail!
            console.log('📝 Creating claim with minimal data since planet not in database');
            planetData = {
                kepid: searchKepid,
                kepler_name: null,
                kepoi_name: `KOI-${searchKepid}`,
                type: 'Unknown',
                radius: 1.0,
                mass: 1.0,
                distance: 1000,
                status: 'CONFIRMED'
            };
            console.log('✅ Using fallback planet data:', planetData);
        }

        // Create new claim
        const newClaim = {
            id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            username: user.username || (user.email ? user.email.split('@')[0] : ''),
            email: user.email,
            kepid: kepid,
            planet: {
                kepler_name: planetData.kepler_name,
                kepoi_name: planetData.kepoi_name,
                type: planetData.type,
                radius: planetData.radius,
                mass: planetData.mass,
                distance: planetData.distance,
                status: planetData.status
            },
            status: 'active',
            claimedAt: new Date().toISOString(),
            certificate: {
                number: `CERT-${Date.now()}`,
                issued: new Date().toISOString()
            }
        };

        // Try to save to Supabase first
        let savedToSupabase = false;
        if (authManager.useSupabase && authManager.supabase) {
            try {
                console.log('☁️ Saving claim to Supabase...');
                const { data, error } = await authManager.supabase
                    .from('planet_claims')
                    .insert([{
                        user_id: user.id,
                        username: newClaim.username,
                        email: user.email,
                        kepid: kepid,
                        planet_data: newClaim.planet,
                        status: 'active',
                        claimed_at: newClaim.claimedAt,
                        certificate_number: newClaim.certificate.number
                    }])
                    .select();

                if (error) {
                    console.error('✗ Supabase insert error:', error);
                    // Continue to localStorage fallback
                } else {
                    console.log('✅ Claim saved to Supabase:', data);
                    savedToSupabase = true;
                }
            } catch (supabaseError) {
                console.error('✗ Supabase error:', supabaseError);
                // Continue to localStorage fallback
            }
        }

        // Always save to localStorage as backup
        const existingClaims = JSON.parse(localStorage.getItem('user_claims') || '[]');
        existingClaims.push(newClaim);
        localStorage.setItem('user_claims', JSON.stringify(existingClaims));
        console.log('💾 Claim saved to localStorage');

        if (savedToSupabase) {
            console.log('✅ Planet claimed and saved to Supabase + localStorage');
        } else {
            console.log('✅ Planet claimed and saved to localStorage (Supabase unavailable)');
        }

        // Create blockchain verification record
        if (window.blockchainVerificationSystem) {
            try {
                const verificationData = {
                    claimId: newClaim.id,
                    kepid: kepid,
                    planetName: planetData.kepler_name || planetData.kepoi_name || `Kepler-${kepid}`,
                    claimDate: newClaim.claimedAt
                };
                await window.blockchainVerificationSystem.createVerification(verificationData);
                console.log('✅ Blockchain verification record created');
            } catch (error) {
                console.error('Error creating blockchain verification:', error);
                // Don't fail the claim if verification fails
            }
        }

        // Show success notification with NFT certificate download option
        if (window.databaseInstance && window.databaseInstance.showSuccessNotification) {
            window.databaseInstance.showSuccessNotification(
                `Successfully claimed exoplanet!`,
                `Planet: ${planetData.kepler_name || planetData.kepoi_name || `Kepler-${kepid}`}\n\nDownload your NFT certificate to commemorate this claim!`,
                'Download NFT Certificate',
                async () => {
                    // Generate and download NFT certificate
                    if (window.nftCertificateGenerator) {
                        const claimData = {
                            userName: user.username || (user.email ? user.email.split('@')[0] : ''),
                            userEmail: user.email,
                            claimedAt: newClaim.claimedAt
                        };
                        await window.nftCertificateGenerator.downloadCertificate(planetData, claimData);
                    } else {
                        alert('NFT certificate generator not available. Please refresh the page and try again.');
                    }
                }
            );
        } else {
            // Fallback to alert with certificate option
            const downloadCert = confirm(`✅ Successfully claimed exoplanet!\n\nPlanet: ${planetData.kepler_name || planetData.kepoi_name}\n\nWould you like to download your NFT certificate?`);
            if (downloadCert && window.nftCertificateGenerator) {
                const claimData = {
                    userName: user.username || (user.email ? user.email.split('@')[0] : ''),
                    userEmail: user.email,
                    claimedAt: newClaim.claimedAt
                };
                await window.nftCertificateGenerator.downloadCertificate(planetData, claimData);
            }
        }

        // Update the planet card to show as claimed
        updatePlanetAvailability(kepid, 'claimed');

        // Update reputation system (using singleton)
        if (window.getReputationSystem) {
            const repSystem = window.getReputationSystem();
            await repSystem.init();
            await repSystem.updateActivity('planet_claimed');
        } else if (window.ReputationSystem) {
            const repSystem = ReputationSystem.getInstance();
            await repSystem.init();
            await repSystem.updateActivity('planet_claimed');
        }

        // Update database instance
        if (window.databaseInstance) {
            const planet = window.databaseInstance.allData.find(p => window.databaseInstance.compareKepid(p.kepid, kepid));
            if (planet) {
                planet.availability = 'claimed';
            }
        }

        // Refresh the page to update UI
        setTimeout(() => {
            location.reload();
        }, 1000);

    } catch (error) {
        console.error('✗ Error claiming planet locally:', error);
        alert('❌ Error claiming planet. Please try again later.');
    }
}

// Check if planet is already claimed (check Supabase and localStorage)
async function checkIfPlanetClaimed(kepid, user) {
    // Check Supabase first
    if (authManager.useSupabase && authManager.supabase) {
        try {
            const { data, error } = await authManager.supabase
                .from('planet_claims')
                .select('*')
                .eq('kepid', kepid)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .limit(1);

            if (!error && data && data.length > 0) {
                console.log('✓ Found claim in Supabase');
                return data[0];
            }
        } catch (error) {
            console.error('Error checking Supabase:', error);
        }
    }

    // Fallback to localStorage
    const existingClaims = JSON.parse(localStorage.getItem('user_claims') || '[]');
    const existingClaim = existingClaims.find(c => {
        if (c.kepid !== kepid) return false;
        const matchesUserId = c.userId && user.id && c.userId === user.id;
        const matchesUsername = c.username && user.username && c.username.toLowerCase() === user.username.toLowerCase();
        const matchesEmail = c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase();
        return matchesUserId || matchesUsername || matchesEmail;
    });

    return existingClaim || null;
}

// Save claim to localStorage as backup
function saveClaimToLocalStorage(kepid, planetData) {
    try {
        const user = authManager.getCurrentUser();
        if (!user) return;

        const existingClaims = JSON.parse(localStorage.getItem('user_claims') || '[]');
        const existingClaim = existingClaims.find(c => c.kepid === kepid && c.userId === user.id);

        if (!existingClaim) {
            const newClaim = {
                id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: user.id,
                username: user.username || (user.email ? user.email.split('@')[0] : ''),
                kepid: kepid,
                planet: planetData,
                status: 'active',
                claimedAt: new Date().toISOString()
            };

            existingClaims.push(newClaim);
            localStorage.setItem('user_claims', JSON.stringify(existingClaims));
            console.log('💾 Claim saved to localStorage as backup');
        }
    } catch (error) {
        console.error('Error saving claim to localStorage:', error);
    }
}

// Update planet availability in UI
function updatePlanetAvailability(kepid, status) {
    const planetCard = document.querySelector(`[data-kepid="${kepid}"]`);
    if (planetCard) {
        const claimBtn = planetCard.querySelector('.claim-button');
        if (claimBtn) {
            if (status === 'claimed') {
                claimBtn.textContent = '🔒 Already Claimed';
                claimBtn.disabled = true;
                claimBtn.style.background = 'rgba(239, 68, 68, 0.2)';
                claimBtn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }
        }
    }
}

// Wait for both DOM and Kepler data to be ready
(function () {
    let initAttempts = 0;
    const MAX_INIT_ATTEMPTS = 100; // 10 seconds timeout (increased from 3 seconds)

    function initDatabase() {
        // Surface basic status to the page if helper is available
        try {
            if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                window.databaseDebug('Checking Kepler database status ');
            }
        } catch (e) { }

        // Check if data is loaded (check both global and window)
        const db = (typeof KEPLER_DATABASE !== 'undefined') ? KEPLER_DATABASE : window.KEPLER_DATABASE;

        if (!db) {
            initAttempts++;
            if (initAttempts > MAX_INIT_ATTEMPTS) {
                console.warn('⚠️ Kepler database failed to load within timeout. Proceeding with fallback...');
                // Initialize with fallback data so page is still usable
                console.log('✨ Initializing Optimized Database System with fallback data...');
                try {
                    if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                        window.databaseDebug('Kepler database not found in time – using fallback sample planets');
                    }
                } catch (e) { }
                const database = new OptimizedDatabase();
                window.databaseInstance = database;
                return;
            } else {
                // Check more frequently at first, then less frequently
                const delay = initAttempts < 10 ? 50 : 100;
                setTimeout(initDatabase, delay);
                return;
            }
        }

        console.log('✨ Initializing Optimized Database System...');
        const database = new OptimizedDatabase();
        // Make database instance globally available for claim functions
        window.databaseInstance = database;

        if (db && db.stats) {
            console.log('✅ Database ready with', db.stats.total, 'planets!');
            try {
                if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                    window.databaseDebug('Database ready with ' + String(db.stats.total) + ' planets');
                }
            } catch (e) { }
        } else {
            console.log('⚠️ Database initialized with fallback/sample data');
            try {
                if (typeof window !== 'undefined' && typeof window.databaseDebug === 'function') {
                    window.databaseDebug('Database initialized with fallback/sample data');
                }
            } catch (e) { }
        }
    }

    // Attempt init on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDatabase);
    } else {
        initDatabase();
    }
})();

// Start initialization when DOM is ready
// Initializer removed - handled by global wrapper at end of file

// Add pulse animation style
if (!document.querySelector('#pulse-style')) {
    const style = document.createElement('style');
    style.id = 'pulse-style';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
    `;
    document.head.appendChild(style);
}

// Make claimPlanet explicitly global for onclick handlers
window.claimPlanet = claimPlanet;

// View planet in 3D
function viewPlanet3D(kepid) {
    let planet = null;
    if (window.databaseInstance && window.databaseInstance.allData) {
        planet = window.databaseInstance.allData.find((p) => { return p.kepid == kepid; });
    }
    if (!planet) {
        alert('Planet not found');
        return;
    }

    if (window.planet3DViewer) {
        if (window.planet3DViewer.showPlanet) {
            window.planet3DViewer.showPlanet(planet);
        } else if (window.planet3DViewer.visualizePlanet) {
            window.planet3DViewer.visualizePlanet(planet);
        } else {
            alert('3D viewer not fully initialized');
        }
    } else {
        alert('3D viewer not available');
    }
}

// Analyze planet habitability
function analyzeHabitability(kepid) {
    let planet = null;
    if (window.databaseInstance && window.databaseInstance.allData) {
        planet = window.databaseInstance.allData.find((p) => { return p.kepid == kepid; });
    }
    if (!planet) {
        alert('Planet not found');
        return;
    }

    if (window.habitabilityAnalysis && window.habitabilityAnalysis.displayAnalysis) {
        // Create modal for habitability analysis
        const modal = document.createElement('div');
        modal.id = 'habitability-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="color: #ba944f; font-family: 'Cormorant Garamond', serif; margin: 0;">Habitability Analysis</h1>
                    <button id="close-habitability-modal" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                <div id="habitability-analysis-container"></div>
            </div>
        `;

        document.body.appendChild(modal);

        window.habitabilityAnalysis.displayAnalysis('habitability-analysis-container', planet);

        document.getElementById('close-habitability-modal').addEventListener('click', () => {
            modal.remove();
        });
    } else {
        alert('Habitability analysis not available');
    }
}

// Global helper functions for new features
function showPlanetRarity(planetData) {
    if (window.planetRarityCalculator) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); z-index: 10001; display: flex; align-items: center; justify-content: center; overflow-y: auto;';
        modal.innerHTML = `
            <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="color: #ba944f; margin: 0;">Planet Rarity</h1>
                    <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                <div id="rarity-display-container"></div>
            </div>
        `;
        document.body.appendChild(modal);
        window.planetRarityCalculator.renderRarity('rarity-display-container', planetData);
    }
}

function toggleWishlist(kepid, planetData) {
    if (window.planetWishlistSystem) {
        const added = window.planetWishlistSystem.addToWishlist(planetData);
        if (added) {
            alert('Added to wishlist!');
        } else {
            alert('Already in wishlist!');
        }
    }
}

function toggleBookmark(kepid, planetData) {
    if (window.planetBookmarkSystem) {
        if (window.planetBookmarkSystem.isBookmarked(kepid)) {
            window.planetBookmarkSystem.removeBookmark(kepid);
            alert('Removed from bookmarks');
        } else {
            window.planetBookmarkSystem.addBookmark(planetData);
            alert('Bookmarked!');
        }
    }
}

function sharePlanet(planetData) {
    if (window.planetSocialSharing) {
        window.planetSocialSharing.sharePlanet(planetData, 'web');
    }
}

function addToComparison(kepid, planetData) {
    if (window.planetComparisonMatrix) {
        const added = window.planetComparisonMatrix.addPlanet(planetData);
        if (added) {
            alert('Added to comparison!');
            // Show comparison if we have 2+ planets
            if (window.planetComparisonMatrix.selectedPlanets.length >= 2) {
                const container = document.getElementById('comparison-tool-container');
                if (container) {
                    window.planetComparisonMatrix.renderMatrix('comparison-tool-container');
                }
            }
        } else {
            alert('Comparison full (max 5 planets) or already added');
        }
    }
}

function showPlanetDetails(kepid) {
    try {
        const db = window.databaseInstance;
        if (!db || !Array.isArray(db.allData)) {
            alert('Planet data not available yet. Please try again in a moment.');
            return;
        }

        const targetId = kepid;
        let planet = null;
        if (typeof db.compareKepid === 'function') {
            planet = db.allData.find((p) => db.compareKepid(p.kepid, targetId));
        }
        if (!planet) {
            planet = db.allData.find((p) => String(p.kepid) === String(targetId));
        }
        if (!planet) {
            alert('Planet not found in database.');
            return;
        }

        db.selectedPlanetKepid = String(planet.kepid || targetId);
        if (typeof db.updateURLFromState === 'function') {
            db.updateURLFromState();
        }

        // Track in User History
        if (window.userHistory) {
            window.userHistory.addVisit(planet);
        }

        const existing = document.getElementById('planet-details-modal');
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'planet-details-modal';
        modal.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 100%',
            'background: rgba(0, 0, 0, 0.95)',
            'z-index: 10002',
            'overflow-y: auto',
            'padding: 2rem'
        ].join(';');

        const status = planet.status || '';
        const statusUpper = status.toUpperCase();
        let displayStatus = status;
        if (statusUpper.includes('CONFIRMED') || status === 'Confirmed Planet') {
            displayStatus = 'CONFIRMED';
        } else if (statusUpper.includes('CANDIDATE') || status === 'CANDIDATE') {
            displayStatus = 'CANDIDATE';
        } else if (statusUpper.includes('FALSE')) {
            displayStatus = 'FALSE POSITIVE';
        }

        const type = planet.type || 'Unknown';
        const radius = typeof planet.radius === 'number' && !isNaN(planet.radius) ? planet.radius.toFixed(2) : 'N/A';
        const mass = typeof planet.mass === 'number' && !isNaN(planet.mass) ? planet.mass.toFixed(2) : 'N/A';
        const distance = typeof planet.distance === 'number' && !isNaN(planet.distance) ? planet.distance.toFixed(0) : 'N/A';
        const year = planet.disc_year || 'Unknown';
        const score = typeof planet.score === 'number' && !isNaN(planet.score) ? Math.round(planet.score * 100) : null;
        const availability = planet.availability || null;
        let availabilityLabel = 'Unknown';
        if (availability === 'available') {
            availabilityLabel = 'Available';
        } else if (availability === 'claimed') {
            availabilityLabel = 'Claimed';
        }

        const name = planet.kepler_name || planet.kepoi_name || `KOI-${planet.kepid}`;

        modal.innerHTML = `
            <div style="max-width: 1100px; margin: 0 auto; background: rgba(0, 0, 0, 0.85); border-radius: 18px; border: 2px solid rgba(186, 148, 79, 0.6); padding: 2rem; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <h2 style="margin: 0 0 0.5rem 0; color: #f9fafb; font-size: 1.8rem;">${name}</h2>
                        <div style="font-size: 0.95rem; color: rgba(249, 250, 251, 0.7);">
                            KEPID: ${planet.kepid || 'Unknown'}${planet.kepoi_name ? ` · KOI: ${planet.kepoi_name}` : ''}
                        </div>
                        <div style="font-size: 0.85rem; margin-top: 0.25rem; color: rgba(148, 163, 184, 0.9);">
                            Data source: NASA Exoplanet Archive
                            ${name ? `<a href="https://exoplanetarchive.ipac.caltech.edu/cgi-bin/DisplayOverview/nph-DisplayOverview?objname=${encodeURIComponent(name)}&type=PLANET" target="_blank" rel="noopener" style="color: #93c5fd; text-decoration: underline; margin-left: 0.25rem;">Open overview ↗</a>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="margin-bottom: 0.5rem;">
                            <span style="display: inline-block; background: rgba(186, 148, 79, 0.2); padding: 0.35rem 0.9rem; border-radius: 999px; border: 1px solid rgba(186, 148, 79, 0.6); color: #facc6b; font-size: 0.8rem; font-weight: 600;">${displayStatus || 'UNKNOWN'}</span>
                        </div>
                        <button onclick="closePlanetDetails()" style="background: transparent; border: none; color: #e5e7eb; font-size: 1.8rem; cursor: pointer;">×</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr); gap: 2rem; flex-wrap: wrap;">
                    <div>
                        <h3 style="color: #ba944f; margin-bottom: 0.75rem; font-size: 1.2rem;">Key stats</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.9rem; font-size: 0.95rem;">
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Type</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${type}</div>
                            </div>
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Radius (Earth)</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${radius}</div>
                            </div>
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Mass (Earth)</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${mass}</div>
                            </div>
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Distance (ly)</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${distance}</div>
                            </div>
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Discovery year</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${year}</div>
                            </div>
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Score</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${score !== null ? `${score}%` : 'N/A'}</div>
                            </div>
                            <div style="padding: 0.9rem; border-radius: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.4);">
                                <div style="opacity: 0.6;">Availability</div>
                                <div style="color: #e5e7eb; font-weight: 600;">${availabilityLabel}</div>
                            </div>
                        </div>

                        <div style="margin-top: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            <button onclick="viewPlanet3D('${planet.kepid}')" style="padding: 0.75rem 1.2rem; border-radius: 999px; border: 1px solid rgba(139, 92, 246, 0.7); background: rgba(139, 92, 246, 0.18); color: #c4b5fd; font-weight: 600; font-size: 0.9rem; cursor: pointer;">
                                🪐 View in 3D
                            </button>
                            <button onclick="analyzeHabitability('${planet.kepid}')" style="padding: 0.75rem 1.2rem; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.7); background: rgba(56, 189, 248, 0.16); color: #7dd3fc; font-weight: 600; font-size: 0.9rem; cursor: pointer;">
                                🌍 Habitability analysis
                            </button>
                        </div>
                        
                        <div style="margin-top: 1.5rem;">
                            <div id="planet-weather-container"></div>
                        </div>
                    </div>

                    <div>
                        <h3 style="color: #ba944f; margin-bottom: 0.75rem; font-size: 1.2rem;">AI description</h3>
                        <div id="planet-details-ai-description" style="font-size: 0.95rem; line-height: 1.6; color: rgba(249, 250, 251, 0.9); background: rgba(15, 23, 42, 0.85); border-radius: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.5); padding: 1rem; min-height: 3rem;"></div>
                        
                        <!-- Community Section -->
                        <div id="planet-comments-container" class="comments-section"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        try {
            if (window.aiPlanetDescriptions && typeof window.aiPlanetDescriptions === 'function') {
                const helper = window.aiPlanetDescriptions();
                if (helper && typeof helper.renderDescription === 'function') {
                    const descContainer = document.getElementById('planet-details-ai-description');
                    if (descContainer) {
                        helper.renderDescription(descContainer, planet);
                    }
                }
            }

            // Initialize Community Features
            if (window.communityUI && document.getElementById('planet-comments-container')) {
                window.communityUI.renderCommentsSection(
                    document.getElementById('planet-comments-container'),
                    planet.kepler_name || planet.kepoi_name || planet.kepid
                );
            }

            // Initialize Weather Simulation
            if (typeof window.planetWeatherSimulation === 'object' && typeof window.planetWeatherSimulation.renderWeatherSimulation === 'function') {
                window.planetWeatherSimulation.renderWeatherSimulation('planet-weather-container', planet);
            }
        } catch (e) {
            console.warn('Failed to render additional features in planet details modal:', e);
        }
    } catch (error) {
        console.warn('Failed to show planet details:', error);
    }
}

function closePlanetDetails() {
    try {
        const modal = document.getElementById('planet-details-modal');
        if (modal) {
            modal.remove();
        }

        const db = window.databaseInstance;
        if (db) {
            db.selectedPlanetKepid = null;
            if (typeof db.updateURLFromState === 'function') {
                db.updateURLFromState();
            }
        }
    } catch (error) {
        console.warn('Failed to close planet details modal:', error);
    }
}

// Make functions global
window.viewPlanet3D = viewPlanet3D;
window.analyzeHabitability = analyzeHabitability;
window.showPlanetRarity = showPlanetRarity;
window.toggleWishlist = toggleWishlist;
window.toggleBookmark = toggleBookmark;
window.sharePlanet = sharePlanet;
window.addToComparison = addToComparison;
window.showPlanetDetails = showPlanetDetails;
window.closePlanetDetails = closePlanetDetails;




// Expose global init function for backward compatibility
window.initDatabase = function () {
    console.log('🔄 Global initDatabase called - redirecting to OptimizedDatabase');
    if (!window.optimizedDatabase) {
        window.optimizedDatabase = new OptimizedDatabase();
    } else {
        window.optimizedDatabase.init();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.optimizedDatabase) window.optimizedDatabase = new OptimizedDatabase();
    });
} else {
    if (!window.optimizedDatabase) window.optimizedDatabase = new OptimizedDatabase();
}


