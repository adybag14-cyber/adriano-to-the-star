/**
 * Fuzzy Search System
 * 
 * Implements comprehensive search functionality with fuzzy matching.
 * 
 * @module FuzzySearchSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class FuzzySearchSystem {
    constructor() {
        this.index = new Map();
        this.searchHistory = [];
        this.isInitialized = false;
    }

    /**
     * Initialize fuzzy search system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('FuzzySearchSystem already initialized');
            return;
        }

        this.loadSearchHistory();
        
        this.isInitialized = true;
        console.log('✅ Fuzzy Search System initialized');
    }

    /**
     * Index data
     * @public
     * @param {string} key - Index key
     * @param {Array} items - Items to index
     * @param {Function} getText - Function to extract searchable text
     */
    index(key, items, getText = null) {
        const indexData = items.map((item, index) => {
            const text = getText ? getText(item) : String(item);
            return {
                item,
                text: text.toLowerCase(),
                originalIndex: index
            };
        });

        this.index.set(key, indexData);
    }

    /**
     * Search
     * @public
     * @param {string} key - Index key
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Search results
     */
    search(key, query, options = {}) {
        const {
            limit = 10,
            threshold = 0.3,
            minScore = 0
        } = options;

        if (!this.index.has(key)) {
            return [];
        }

        const indexData = this.index.get(key);
        const queryLower = query.toLowerCase();
        const results = [];

        indexData.forEach(({ item, text }) => {
            const score = this.fuzzyMatch(text, queryLower);
            if (score >= threshold && score >= minScore) {
                results.push({
                    item,
                    score,
                    matches: this.getMatches(text, queryLower)
                });
            }
        });

        // Sort by score (descending)
        results.sort((a, b) => b.score - a.score);

        // Limit results
        const limited = results.slice(0, limit);

        // Save to history
        this.addToHistory(query);

        return limited.map(r => r.item);
    }

    /**
     * Fuzzy match
     * @private
     * @param {string} text - Text to search in
     * @param {string} query - Search query
     * @returns {number} Match score (0-1)
     */
    fuzzyMatch(text, query) {
        if (text === query) {
            return 1.0;
        }

        if (text.includes(query)) {
            return 0.8;
        }

        // Levenshtein distance
        const distance = this.levenshteinDistance(text, query);
        const maxLength = Math.max(text.length, query.length);
        const similarity = 1 - (distance / maxLength);

        return Math.max(0, similarity);
    }

    /**
     * Calculate Levenshtein distance
     * @private
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Get matches
     * @private
     * @param {string} text - Text
     * @param {string} query - Query
     * @returns {Array} Match positions
     */
    getMatches(text, query) {
        const matches = [];
        let index = text.indexOf(query);
        
        while (index !== -1) {
            matches.push({ start: index, end: index + query.length });
            index = text.indexOf(query, index + 1);
        }

        return matches;
    }

    /**
     * Add to search history
     * @private
     * @param {string} query - Search query
     */
    addToHistory(query) {
        this.searchHistory.unshift({
            query,
            timestamp: Date.now()
        });

        // Keep only last 50
        if (this.searchHistory.length > 50) {
            this.searchHistory.pop();
        }

        this.saveSearchHistory();
    }

    /**
     * Get search history
     * @public
     * @param {number} limit - Limit results
     * @returns {Array} Search history
     */
    getSearchHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    }

    /**
     * Clear search history
     * @public
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    /**
     * Save search history
     * @private
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.warn('Failed to save search history:', e);
        }
    }

    /**
     * Load search history
     * @private
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('search-history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load search history:', e);
        }
    }
}

// Create global instance
window.FuzzySearchSystem = FuzzySearchSystem;
window.fuzzySearch = new FuzzySearchSystem();
window.fuzzySearch.init();

