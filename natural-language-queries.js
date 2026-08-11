/**
 * Natural Language Planet Queries
 * Convert natural language queries to database searches
 * Example: "Find habitable planets near Earth"
 */

class NaturalLanguageQueries {
    constructor() {
        this.supabase = window.supabaseClient;
        this.queryCache = new Map();
        this.lastNLQueryLog = { query: '', time: 0 };
        this.init();
    }

    init() {
        // Setup query input handler
        this.setupQueryInput();
    }

    /**
     * Setup natural language query input
     */
    setupQueryInput() {
        // Find or create query input
        const searchInput = document.querySelector('#database-search, input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
            // Add natural language indicator
            const wrapper = searchInput.parentElement;
            if (wrapper && !wrapper.querySelector('.nl-query-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'nl-query-indicator';
                indicator.innerHTML = '💬 Try: "habitable planets near Earth"';
                indicator.style.cssText = `
                    font-size: 0.85rem;
                    color: rgba(186, 148, 79, 0.7);
                    margin-top: 0.25rem;
                    font-style: italic;
                `;
                wrapper.appendChild(indicator);
            }

            // Listen for natural language patterns
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (this.isNaturalLanguageQuery(query)) {
                        e.preventDefault();
                        this.processNaturalLanguageQuery(query);
                    }
                }
            });
        }
    }

    /**
     * Check if query is natural language
     */
    isNaturalLanguageQuery(query) {
        const nlPatterns = [
            /find|show|search|list|get/i,
            /habitable|earth-like|similar to earth/i,
            /near|close to|within/i,
            /larger|smaller|bigger|smaller than/i,
            /hotter|colder|warmer|cooler/i,
            /gas giant|terrestrial|rocky/i,
            /confirmed|candidate/i
        ];

        return nlPatterns.some(pattern => pattern.test(query));
    }

    /**
     * Process natural language query
     */
    async processNaturalLanguageQuery(query) {
        try {
            const filters = this.parseQuery(query);
            const db = (typeof window !== 'undefined') ? window.databaseOptimized : null;

            if (db && typeof db.applyNaturalLanguageFilters === 'function') {
                db.applyNaturalLanguageFilters(filters, query);
                const resultsArray = Array.isArray(db.filteredData) ? db.filteredData : [];
                this.logNaturalLanguageQueryAnalytics(query, filters, resultsArray);
                return;
            }

            const results = await this.executeQuery(filters);
            
            this.logNaturalLanguageQueryAnalytics(query, filters, results);

            // Display results
            this.displayResults(results, query);
        } catch (error) {
            console.error('Error processing natural language query:', error);
            this.showError('Could not process query. Please try rephrasing.');
        }
    }

    /**
     * Parse natural language query into filters
     */
    parseQuery(query) {
        const filters = {};
        const lowerQuery = query.toLowerCase();

        // Synonyms / intents
        const lifePhrases = [/life-bearing/i, /supports life/i, /could have life/i];
        if (lifePhrases.some(r => r.test(query))) {
            filters.habitable = true;
            filters.temperature_min = 200;
            filters.temperature_max = 300;
        }

        // Habitable/Earth-like
        if (/habitable|earth-like|similar to earth|life/i.test(query)) {
            filters.habitable = true;
            // Typical habitable zone: 0.5-2 AU, temperature 200-300K
            filters.temperature_min = 200;
            filters.temperature_max = 300;
        }

        // Distance (near Earth)
        const distanceMatch = query.match(/(?:within|near|close to|less than|under|around|approximately|about)\s*(\d+(?:\.\d+)?)\s*(light.?years?|ly|parsecs?|pc)/i);
        if (distanceMatch) {
            const value = parseFloat(distanceMatch[1]);
            const unit = distanceMatch[2].toLowerCase();
            if (unit.includes('pc') || unit.includes('parsec')) {
                filters.distance_max = value * 3.262;
            } else {
                filters.distance_max = value;
            }
        } else if (/near|close/i.test(query)) {
            filters.distance_max = 100; // Default: within 100 light-years
        }

        // Size comparisons
        if (/larger|bigger|greater than|more than/i.test(query)) {
            const sizeMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:times?|x)\s*(?:larger|bigger)/i);
            if (sizeMatch) {
                filters.radius_min = parseFloat(sizeMatch[1]);
            } else {
                filters.radius_min = 1; // Larger than Earth
            }
        }

        if (/smaller|less than|under/i.test(query)) {
            const sizeMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:times?|x)\s*(?:smaller|less)/i);
            if (sizeMatch) {
                filters.radius_max = parseFloat(sizeMatch[1]);
            } else {
                filters.radius_max = 1; // Smaller than Earth
            }
        }

        // Temperature
        if (/hot|hotter|warm/i.test(query)) {
            filters.temperature_min = 300;
        }
        if (/cold|colder|cool/i.test(query)) {
            filters.temperature_max = 200;
        }

        // Planet type
        if (/gas giant|jupiter/i.test(query)) {
            filters.planet_type = 'Gas Giant';
            filters.radius_min = 4; // Jupiter-like
        }
        if (/terrestrial|rocky|earth-like/i.test(query)) {
            filters.planet_type = 'Terrestrial';
            filters.radius_max = 2; // Earth-like size
        }

        // Confirmation status
        if (/confirmed/i.test(query)) {
            filters.disposition = 'CONFIRMED';
        }
        if (/candidate/i.test(query)) {
            filters.disposition = 'CANDIDATE';
        }

        return filters;
    }

    /**
     * Execute query with filters
     */
    async executeQuery(filters) {
        if (!this.supabase || typeof this.supabase.from !== 'function') {
            return [];
        }

        // Build Supabase query
        let query = this.supabase
            .from('planet_claims')
            .select('*')
            .eq('status', 'active');

        // Apply filters
        if (filters.disposition) {
            query = query.eq('planet_data->>koi_pdisposition', filters.disposition);
        }

        if (filters.radius_min) {
            // Would need to filter by planet_data->>koi_prad
            // This is simplified - actual implementation would need proper JSONB queries
        }

        if (filters.distance_max) {
            // Would need to filter by planet_data->>koi_dor
        }

        if (filters.temperature_min || filters.temperature_max) {
            // Would need to filter by planet_data->>koi_teq
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;

        return data || [];
    }

    logNaturalLanguageQueryAnalytics(query, filters, results) {
        try {
            if (!query || query.length < 2) {
                return;
            }

            const now = Date.now();
            if (this.lastNLQueryLog && this.lastNLQueryLog.query === query && typeof this.lastNLQueryLog.time === 'number') {
                const elapsed = now - this.lastNLQueryLog.time;
                if (elapsed >= 0 && elapsed < 10000) {
                    return;
                }
            }

            this.lastNLQueryLog = { query, time: now };

            const computeFairnessSummary = () => {
                if (!window.aiModelBiasDetection || typeof window.aiModelBiasDetection.detectBias !== 'function') {
                    return null;
                }
                try {
                    const modelId = 'planet-search:nl';
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
                    console.warn('AI fairness detection failed for natural language planet search:', e);
                    return null;
                }
            };

            const baseContext = {
                queryLength: query.length,
                isNaturalLanguage: true,
                resultsCount: Array.isArray(results) ? results.length : null,
                hasFilters: !!filters && Object.keys(filters).length > 0,
                fairness: computeFairnessSummary()
            };

            const safeLog = (extraContext) => {
                if (!window.aiUsageLogger || typeof window.aiUsageLogger.log !== 'function') {
                    return;
                }
                try {
                    window.aiUsageLogger.log({
                        feature: 'planet-search-nl',
                        model: 'ui',
                        context: Object.assign({}, baseContext, extraContext || {}, {
                            fairness: computeFairnessSummary()
                        })
                    });
                } catch (e) {
                    console.warn('AI usage logging failed for natural language query:', e);
                }
            };

            if (window.textClassification && typeof window.textClassification.classify === 'function') {
                Promise.resolve(window.textClassification.classify(query, { source: 'planet-search-nl' }))
                    .then((result) => {
                        const classificationContext = {
                            textCategory: result && result.category ? result.category : null,
                            textCategoryConfidence: result && typeof result.confidence === 'number' ? result.confidence : null
                        };
                        safeLog(classificationContext);
                    })
                    .catch((error) => {
                        console.warn('Natural language text classification failed:', error);
                        safeLog({});
                    });
            } else {
                safeLog({});
            }
        } catch (error) {
            console.warn('Natural language query analytics failed:', error);
        }
    }

    /**
     * Display query results
     */
    displayResults(results, originalQuery) {
        // Create results modal or update search results
        const resultsContainer = document.getElementById('search-results') || 
                                document.querySelector('.planet-list') ||
                                document.getElementById('database-container');

        if (!resultsContainer) {
            this.showResultsModal(results, originalQuery);
            return;
        }

        // Update results display
        if (window.databaseOptimized && typeof window.databaseOptimized.renderPlanets === 'function') {
            window.databaseOptimized.renderPlanets(results);
        } else {
            this.showResultsModal(results, originalQuery);
        }
    }

    /**
     * Show results in modal
     */
    showResultsModal(results, query) {
        const modal = document.createElement('div');
        modal.className = 'nl-query-results-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Query Results: "${query}"</h3>
                    <button class="close-modal" onclick="this.closest('.nl-query-results-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="results-count">Found ${results.length} planets</p>
                    <div class="results-list">
                        ${results.length > 0 ? results.slice(0, 20).map(planet => `
                            <div class="result-item">
                                <strong>KEPID: ${planet.kepid}</strong>
                                <span>${planet.planet_data?.koi_pdisposition || 'Unknown'}</span>
                            </div>
                        `).join('') : '<p>No planets found matching your query.</p>'}
                    </div>
                </div>
            </div>
        `;

        // Style modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(modal);
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'nl-query-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 107, 107, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize natural language queries
let naturalLanguageQueriesInstance = null;

function initNaturalLanguageQueries() {
    if (!naturalLanguageQueriesInstance) {
        naturalLanguageQueriesInstance = new NaturalLanguageQueries();
    }
    return naturalLanguageQueriesInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNaturalLanguageQueries);
} else {
    initNaturalLanguageQueries();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaturalLanguageQueries;
}

// Make available globally
window.NaturalLanguageQueries = NaturalLanguageQueries;
window.naturalLanguageQueries = () => naturalLanguageQueriesInstance;

