/**
 * Advanced Search Features
 * 
 * Enhanced search functionality with autocomplete, search history,
 * saved searches, and advanced filtering options.
 * 
 * @class AdvancedSearchFeatures
 * @example
 * // Auto-initializes on page load
 * // Access via: window.advancedSearch()
 * 
 * // Perform advanced search
 * const search = window.advancedSearch();
 * search.performSearch('habitable planets', {
 *   filters: { type: 'Terrestrial', minDistance: 10 }
 * });
 */
class AdvancedSearchFeatures {
    constructor() {
        this.searchHistory = [];
        this.savedSearches = [];
        this.searchIndex = null;
        this.autocompleteResults = [];
        this.maxHistoryItems = 50;
        this.init();
    }

    init() {
        // Load search history and saved searches
        this.loadSearchHistory();
        this.loadSavedSearches();
        
        // Setup search input listeners
        this.setupSearchInputs();
        
        this.trackEvent('search_features_initialized');
    }

    /**
     * Setup search input listeners
     * 
     * @method setupSearchInputs
     * @returns {void}
     */
    setupSearchInputs() {
        // Find all search inputs
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="Search"], .search-input, #search-input');
        
        searchInputs.forEach(input => {
            // Autocomplete on input
            input.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value, input);
            });

            // Show history on focus
            input.addEventListener('focus', () => {
                this.showSearchHistory(input);
            });

            // Handle search on Enter
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(input.value, {}, input);
                }
            });
        });
    }

    /**
     * Handle search input for autocomplete
     * 
     * @method handleSearchInput
     * @param {string} query - Search query
     * @param {HTMLElement} input - Input element
     * @returns {void}
     */
    handleSearchInput(query, input) {
        if (!query || query.length < 2) {
            this.hideAutocomplete(input);
            return;
        }

        // Get autocomplete suggestions
        const suggestions = this.getAutocompleteSuggestions(query);
        this.showAutocomplete(suggestions, input);
    }

    /**
     * Get autocomplete suggestions
     * 
     * @method getAutocompleteSuggestions
     * @param {string} query - Search query
     * @returns {Array} Array of suggestions
     */
    getAutocompleteSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        const suggestions = [];

        // Search in history
        this.searchHistory.forEach(item => {
            if (item.toLowerCase().includes(lowerQuery) && !suggestions.includes(item)) {
                suggestions.push(item);
            }
        });

        // Add common search terms
        const commonTerms = [
            'habitable planets',
            'gas giants',
            'terrestrial planets',
            'recent discoveries',
            'earth-like planets',
            'super earths',
            'hot jupiters',
            'confirmed planets',
            'candidate planets'
        ];

        commonTerms.forEach(term => {
            if (term.toLowerCase().includes(lowerQuery) && !suggestions.includes(term)) {
                suggestions.push(term);
            }
        });

        return suggestions.slice(0, 10);
    }

    /**
     * Show autocomplete dropdown
     * 
     * @method showAutocomplete
     * @param {Array} suggestions - Array of suggestions
     * @param {HTMLElement} input - Input element
     * @returns {void}
     */
    showAutocomplete(suggestions, input) {
        // Remove existing autocomplete
        this.hideAutocomplete(input);

        if (suggestions.length === 0) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'search-autocomplete';
        dropdown.id = `autocomplete-${input.id || 'default'}`;
        dropdown.innerHTML = suggestions.map(suggestion => `
            <div class="autocomplete-item" data-suggestion="${suggestion}">
                <span class="autocomplete-icon">🔍</span>
                <span class="autocomplete-text">${suggestion}</span>
            </div>
        `).join('');

        // Position dropdown
        const rect = input.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.left = `${rect.left + window.scrollX}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.zIndex = '10000';

        document.body.appendChild(dropdown);

        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                input.value = item.dataset.suggestion;
                this.performSearch(item.dataset.suggestion, {}, input);
                this.hideAutocomplete(input);
            });
        });
    }

    /**
     * Hide autocomplete dropdown
     * 
     * @method hideAutocomplete
     * @param {HTMLElement} input - Input element
     * @returns {void}
     */
    hideAutocomplete(input) {
        const dropdown = document.getElementById(`autocomplete-${input.id || 'default'}`);
        if (dropdown) {
            dropdown.remove();
        }
    }

    /**
     * Show search history
     * 
     * @method showSearchHistory
     * @param {HTMLElement} input - Input element
     * @returns {void}
     */
    showSearchHistory(input) {
        if (this.searchHistory.length === 0) return;

        // Similar to autocomplete but shows history
        const history = this.searchHistory.slice(0, 10).reverse();
        this.showAutocomplete(history, input);
    }

    /**
     * Perform search
     * 
     * @method performSearch
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {HTMLElement} input - Input element (optional)
     * @returns {Promise<Object>} Search results
     */
    async performSearch(query, options = {}, input = null) {
        if (!query || query.trim().length === 0) {
            return { results: [], count: 0 };
        }

        // Add to history
        this.addToHistory(query);

        // Hide autocomplete
        if (input) {
            this.hideAutocomplete(input);
        }

        // Trigger search event
        const searchEvent = new CustomEvent('advanced-search', {
            detail: { query, options },
            bubbles: true
        });
        document.dispatchEvent(searchEvent);
        this.trackEvent('search_performed', { query, hasOptions: Object.keys(options).length > 0 });

        // If database search is available, use it
        if (window.databaseOptimized) {
            const db = window.databaseOptimized();
            if (db && db.search) {
                return db.search(query, options);
            }
        }

        return { results: [], count: 0 };
    }

    /**
     * Add search to history
     * 
     * @method addToHistory
     * @param {string} query - Search query
     * @returns {void}
     */
    addToHistory(query) {
        // Remove if already exists
        const index = this.searchHistory.indexOf(query);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }

        // Add to beginning
        this.searchHistory.unshift(query);

        // Limit history size
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }

        // Save to localStorage
        this.saveSearchHistory();
    }

    /**
     * Save search
     * 
     * @method saveSearch
     * @param {string} name - Search name
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {string} Search ID
     */
    saveSearch(name, query, options = {}) {
        const search = {
            id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            name,
            query,
            options,
            createdAt: new Date().toISOString()
        };

        this.savedSearches.push(search);
        this.saveSavedSearches();
        this.trackEvent('search_saved', { searchId: search.id, name });

        return search.id;
    }

    /**
     * Load search history from localStorage
     * 
     * @method loadSearchHistory
     * @returns {void}
     */
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('search-history');
            if (stored) {
                this.searchHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
        }
    }

    /**
     * Save search history to localStorage
     * 
     * @method saveSearchHistory
     * @returns {void}
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }

    /**
     * Load saved searches from localStorage
     * 
     * @method loadSavedSearches
     * @returns {void}
     */
    loadSavedSearches() {
        try {
            const stored = localStorage.getItem('saved-searches');
            if (stored) {
                this.savedSearches = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load saved searches:', error);
        }
    }

    /**
     * Save saved searches to localStorage
     * 
     * @method saveSavedSearches
     * @returns {void}
     */
    saveSavedSearches() {
        try {
            localStorage.setItem('saved-searches', JSON.stringify(this.savedSearches));
        } catch (error) {
            console.warn('Failed to save saved searches:', error);
        }
    }

    /**
     * Get search history
     * 
     * @method getSearchHistory
     * @returns {Array} Array of search queries
     */
    getSearchHistory() {
        return [...this.searchHistory];
    }

    /**
     * Clear search history
     * 
     * @method clearSearchHistory
     * @returns {void}
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    /**
     * Get saved searches
     * 
     * @method getSavedSearches
     * @returns {Array} Array of saved searches
     */
    getSavedSearches() {
        return [...this.savedSearches];
    }
}

// Initialize globally
let advancedSearchInstance = null;

function initAdvancedSearch() {
    if (!advancedSearchInstance) {
        advancedSearchInstance = new AdvancedSearchFeatures();
    }
    return advancedSearchInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedSearch);
} else {
    initAdvancedSearch();
}

// Add trackEvent method to prototype
AdvancedSearchFeatures.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`search_features_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'advanced_search_features', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Export globally
window.AdvancedSearchFeatures = AdvancedSearchFeatures;
window.advancedSearch = () => advancedSearchInstance;

