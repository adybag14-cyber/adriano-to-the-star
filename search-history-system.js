/**
 * Search History System with Saved Searches
 * 
 * Implements comprehensive search history with saved searches.
 * 
 * @module SearchHistorySystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class SearchHistorySystem {
    constructor() {
        this.history = [];
        this.savedSearches = new Map();
        this.maxHistory = 100;
        this.isInitialized = false;
    }

    /**
     * Initialize search history system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('SearchHistorySystem already initialized');
            return;
        }

        this.loadHistory();
        this.loadSavedSearches();
        
        this.isInitialized = true;
        console.log('✅ Search History System initialized');
    }

    /**
     * Add to history
     * @public
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @param {Object} context - Search context
     */
    addToHistory(query, filters = {}, context = {}) {
        const search = {
            id: Date.now() + Math.random(),
            query,
            filters,
            context,
            timestamp: new Date().toISOString(),
            resultCount: context.resultCount || null
        };

        // Remove duplicate if exists
        const existingIndex = this.history.findIndex(h => 
            h.query === query && JSON.stringify(h.filters) === JSON.stringify(filters)
        );
        if (existingIndex > -1) {
            this.history.splice(existingIndex, 1);
        }

        this.history.unshift(search);

        // Keep only last maxHistory
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        this.saveHistory();
    }

    /**
     * Get history
     * @public
     * @param {Object} filter - Filter options
     * @returns {Array} Search history
     */
    getHistory(filter = {}) {
        let filtered = [...this.history];

        if (filter.limit) {
            filtered = filtered.slice(0, filter.limit);
        }

        if (filter.query) {
            const queryLower = filter.query.toLowerCase();
            filtered = filtered.filter(h => 
                h.query.toLowerCase().includes(queryLower)
            );
        }

        return filtered;
    }

    /**
     * Save search
     * @public
     * @param {string} name - Saved search name
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @returns {Object} Saved search object
     */
    saveSearch(name, query, filters = {}) {
        const savedSearch = {
            id: Date.now() + Math.random(),
            name,
            query,
            filters,
            createdAt: new Date().toISOString()
        };

        this.savedSearches.set(savedSearch.id, savedSearch);
        this.saveSavedSearches();

        return savedSearch;
    }

    /**
     * Get saved search
     * @public
     * @param {string} id - Saved search ID
     * @returns {Object|null} Saved search object
     */
    getSavedSearch(id) {
        return this.savedSearches.get(id) || null;
    }

    /**
     * Get all saved searches
     * @public
     * @returns {Array} Saved searches array
     */
    getAllSavedSearches() {
        return Array.from(this.savedSearches.values());
    }

    /**
     * Delete saved search
     * @public
     * @param {string} id - Saved search ID
     * @returns {boolean} True if deleted
     */
    deleteSavedSearch(id) {
        const deleted = this.savedSearches.delete(id);
        if (deleted) {
            this.saveSavedSearches();
        }
        return deleted;
    }

    /**
     * Clear history
     * @public
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    /**
     * Save history
     * @private
     */
    saveHistory() {
        try {
            localStorage.setItem('search-history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('Failed to save search history:', e);
        }
    }

    /**
     * Load history
     * @private
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('search-history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load search history:', e);
        }
    }

    /**
     * Save saved searches
     * @private
     */
    saveSavedSearches() {
        try {
            const searches = Object.fromEntries(this.savedSearches);
            localStorage.setItem('saved-searches', JSON.stringify(searches));
        } catch (e) {
            console.warn('Failed to save saved searches:', e);
        }
    }

    /**
     * Load saved searches
     * @private
     */
    loadSavedSearches() {
        try {
            const saved = localStorage.getItem('saved-searches');
            if (saved) {
                const searches = JSON.parse(saved);
                Object.entries(searches).forEach(([key, value]) => {
                    this.savedSearches.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load saved searches:', e);
        }
    }
}

// Create global instance
window.SearchHistorySystem = SearchHistorySystem;
window.searchHistory = new SearchHistorySystem();
window.searchHistory.init();

