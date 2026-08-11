/**
 * Advanced Search Suggestions with AI
 * 
 * Provides intelligent search suggestions based on context, user behavior,
 * search history, popular searches, and AI-powered pattern matching.
 * Includes keyboard navigation and visual highlighting.
 * 
 * @class AdvancedSearchSuggestions
 * @example
 * // Auto-initializes on page load
 * // Access via: window.searchSuggestions()
 * 
 * // Clear search history
 * const suggestions = window.searchSuggestions();
 * suggestions.clearHistory();
 */
class AdvancedSearchSuggestions {
    constructor() {
        this.suggestions = [];
        this.searchHistory = [];
        this.popularSearches = [];
        this.aiSuggestions = [];
        this.currentQuery = '';
        this.suggestionContainer = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        // Load search history
        this.loadSearchHistory();
        
        // Load popular searches
        this.loadPopularSearches();
        
        // Setup search input listeners
        this.setupSearchInputs();
        
        this.trackEvent('search_suggestions_initialized');
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
     * Save search query to history
     * 
     * Adds query to history, removes duplicates, and keeps only last 50 entries.
     * 
     * @method saveToHistory
     * @param {string} query - Search query to save
     * @returns {void}
     */
    saveToHistory(query) {
        if (!query || query.trim().length === 0) return;

        const trimmedQuery = query.trim().toLowerCase();
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(q => q !== trimmedQuery);
        
        // Add to beginning
        this.searchHistory.unshift(trimmedQuery);
        
        // Keep only last 50
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }

        // Save to localStorage
        try {
            localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }

    /**
     * Load popular searches
     */
    loadPopularSearches() {
        // Default popular searches for exoplanet database
        this.popularSearches = [
            'habitable planets',
            'gas giants',
            'earth-like planets',
            'kepler objects',
            'confirmed exoplanets',
            'super earth',
            'hot jupiter',
            'water worlds',
            'terrestrial planets',
            'ice giants'
        ];

        // Load from localStorage if available
        try {
            const stored = localStorage.getItem('popular-searches');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.length > 0) {
                    this.popularSearches = parsed;
                }
            }
        } catch (error) {
            console.warn('Failed to load popular searches:', error);
        }
    }

    /**
     * Setup search input listeners
     */
    setupSearchInputs() {
        // Find all search inputs
        const searchInputs = document.querySelectorAll(
            'input[type="search"], input[placeholder*="search" i], input[name*="search" i], #search-input, .search-input'
        );

        searchInputs.forEach(input => {
            // Focus event
            input.addEventListener('focus', () => {
                this.showSuggestions(input);
            });

            // Input event
            input.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
                this.updateSuggestions(input);
            });

            // Blur event (with delay to allow clicks)
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSuggestions();
                }, 200);
            });

            // Keyboard navigation
            input.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });
        });
    }

    /**
     * Generate AI-powered search suggestions
     * 
     * Uses pattern matching and AI (if available) to generate contextual suggestions.
     * 
     * @method generateAISuggestions
     * @param {string} query - Search query
     * @returns {Promise<string[]>} Array of suggestion strings
     */
    async generateAISuggestions(query) {
        if (!query || query.length < 2) return [];

        try {
            // Use Gemini AI for suggestions if available
            if (window.GEMINI_API_KEY || window.gemini) {
                return await this.queryAIForSuggestions(query);
            }
        } catch (error) {
            console.warn('AI suggestions unavailable:', error);
        }

        return [];
    }

    /**
     * Query AI for search suggestions
     */
    async queryAIForSuggestions(query) {
        // This would use Gemini AI to generate contextual suggestions
        // For now, return pattern-based suggestions
        const patterns = {
            'planet': ['habitable planets', 'gas giant planets', 'terrestrial planets'],
            'earth': ['earth-like planets', 'super earth', 'earth size'],
            'kepler': ['kepler objects', 'kepler confirmed', 'kepler candidates'],
            'habitable': ['habitable zone', 'habitable planets', 'potentially habitable'],
            'giant': ['gas giants', 'ice giants', 'super jupiter']
        };

        const lowerQuery = query.toLowerCase();
        const suggestions = [];

        Object.keys(patterns).forEach(key => {
            if (lowerQuery.includes(key)) {
                suggestions.push(...patterns[key]);
            }
        });

        return suggestions.slice(0, 5);
    }

    /**
     * Get suggestions based on query
     */
    async getSuggestions(query) {
        if (!query || query.length === 0) {
            return {
                history: this.searchHistory.slice(0, 5),
                popular: this.popularSearches.slice(0, 5),
                ai: []
            };
        }

        const lowerQuery = query.toLowerCase();
        
        // Filter history
        const historyMatches = this.searchHistory
            .filter(h => h.includes(lowerQuery))
            .slice(0, 5);

        // Filter popular
        const popularMatches = this.popularSearches
            .filter(p => p.includes(lowerQuery))
            .slice(0, 5);

        // Get AI suggestions
        const aiSuggestions = await this.generateAISuggestions(query);

        return {
            history: historyMatches,
            popular: popularMatches,
            ai: aiSuggestions
        };
    }

    /**
     * Update suggestions display
     */
    async updateSuggestions(input) {
        const suggestions = await this.getSuggestions(this.currentQuery);
        this.displaySuggestions(input, suggestions);
    }

    /**
     * Show suggestions
     */
    showSuggestions(input) {
        // Allow updating even if visible to refresh suggestions
        const suggestions = {
            history: this.searchHistory.slice(0, 5),
            popular: this.popularSearches.slice(0, 5),
            ai: []
        };

        this.displaySuggestions(input, suggestions);
    }

    /**
     * Display suggestions
     */
    displaySuggestions(input, suggestions) {
        // Remove existing container
        if (this.suggestionContainer) {
            this.suggestionContainer.remove();
        }

        // Check if we have any suggestions
        const hasHistory = suggestions.history.length > 0;
        const hasPopular = suggestions.popular.length > 0;
        const hasAI = suggestions.ai.length > 0;

        if (!hasHistory && !hasPopular && !hasAI && this.currentQuery.length > 0) {
            this.hideSuggestions();
            return;
        }

        // Create container
        this.suggestionContainer = document.createElement('div');
        this.suggestionContainer.className = 'search-suggestions-container';
        this.suggestionContainer.id = 'search-suggestions';

        let html = '';

        // History section
        if (hasHistory) {
            html += `
                <div class="suggestions-section">
                    <div class="suggestions-header">Recent Searches</div>
                    <div class="suggestions-list">
                        ${suggestions.history.map(query => `
                            <div class="suggestion-item" data-query="${this.escapeHtml(query)}">
                                <span class="suggestion-icon">🕒</span>
                                <span class="suggestion-text">${this.highlightQuery(query, this.currentQuery)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Popular section
        if (hasPopular && this.currentQuery.length === 0) {
            html += `
                <div class="suggestions-section">
                    <div class="suggestions-header">Popular Searches</div>
                    <div class="suggestions-list">
                        ${suggestions.popular.map(query => `
                            <div class="suggestion-item" data-query="${this.escapeHtml(query)}">
                                <span class="suggestion-icon">🔥</span>
                                <span class="suggestion-text">${this.escapeHtml(query)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // AI suggestions section
        if (hasAI) {
            html += `
                <div class="suggestions-section">
                    <div class="suggestions-header">AI Suggestions</div>
                    <div class="suggestions-list">
                        ${suggestions.ai.map(query => `
                            <div class="suggestion-item ai-suggestion" data-query="${this.escapeHtml(query)}">
                                <span class="suggestion-icon">🤖</span>
                                <span class="suggestion-text">${this.escapeHtml(query)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.suggestionContainer.innerHTML = html;

        // Position relative to input
        const rect = input.getBoundingClientRect();
        this.suggestionContainer.style.cssText = `
            position: absolute;
            top: ${rect.bottom + window.scrollY + 5}px;
            left: ${rect.left + window.scrollX}px;
            width: ${rect.width}px;
            z-index: 10000;
        `;

        document.body.appendChild(this.suggestionContainer);
        this.isVisible = true;

        // Add click handlers
        this.suggestionContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                input.value = query;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                this.selectSuggestion(query, input);
            });

            item.addEventListener('mouseenter', () => {
                item.classList.add('hovered');
            });

            item.addEventListener('mouseleave', () => {
                item.classList.remove('hovered');
            });
        });

        this.injectStyles();
    }

    /**
     * Highlight query in text
     */
    highlightQuery(text, query) {
        if (!query || query.length === 0) return this.escapeHtml(text);

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Select suggestion
     */
    selectSuggestion(query, input) {
        this.saveToHistory(query);
        this.trackEvent('suggestion_selected', { query });
        this.hideSuggestions();

        // Trigger search if there's a search handler
        if (input.form) {
            input.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else {
            // Trigger custom search event
            input.dispatchEvent(new CustomEvent('search', { 
                detail: { query },
                bubbles: true 
            }));
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        if (!this.isVisible || !this.suggestionContainer) return;

        const items = Array.from(this.suggestionContainer.querySelectorAll('.suggestion-item'));
        const currentIndex = items.findIndex(item => item.classList.contains('selected'));

        let newIndex = currentIndex;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else if (event.key === 'Enter' && currentIndex >= 0) {
            event.preventDefault();
            const selectedItem = items[currentIndex];
            if (selectedItem) {
                selectedItem.click();
            }
            return;
        } else if (event.key === 'Escape') {
            this.hideSuggestions();
            return;
        }

        // Update selection
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === newIndex);
        });

        // Scroll into view
        if (newIndex >= 0 && items[newIndex]) {
            items[newIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Hide suggestions
     */
    hideSuggestions() {
        if (this.suggestionContainer) {
            this.suggestionContainer.remove();
            this.suggestionContainer = null;
        }
        this.isVisible = false;
    }

    /**
     * Clear search history
     */
    clearHistory() {
        this.searchHistory = [];
        localStorage.removeItem('search-history');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('search-suggestions-styles')) return;

        const style = document.createElement('style');
        style.id = 'search-suggestions-styles';
        style.textContent = `
            .search-suggestions-container {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                max-height: 400px;
                overflow-y: auto;
                font-family: 'Raleway', sans-serif;
                animation: slideDown 0.2s ease;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .suggestions-section {
                padding: 0.5rem 0;
            }

            .suggestions-header {
                padding: 0.5rem 1rem;
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid rgba(186, 148, 79, 0.2);
            }

            .suggestions-list {
                display: flex;
                flex-direction: column;
            }

            .suggestion-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                cursor: pointer;
                transition: all 0.2s;
                color: rgba(255, 255, 255, 0.8);
            }

            .suggestion-item:hover,
            .suggestion-item.selected {
                background: rgba(186, 148, 79, 0.2);
                color: #ba944f;
            }

            .suggestion-icon {
                font-size: 1rem;
                opacity: 0.7;
            }

            .suggestion-text {
                flex: 1;
            }

            .suggestion-text mark {
                background: rgba(186, 148, 79, 0.3);
                color: #ba944f;
                font-weight: 600;
                padding: 0 2px;
            }

            .ai-suggestion {
                border-left: 3px solid rgba(186, 148, 79, 0.5);
            }

            .search-suggestions-container::-webkit-scrollbar {
                width: 8px;
            }

            .search-suggestions-container::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }

            .search-suggestions-container::-webkit-scrollbar-thumb {
                background: rgba(186, 148, 79, 0.5);
                border-radius: 4px;
            }

            .search-suggestions-container::-webkit-scrollbar-thumb:hover {
                background: rgba(186, 148, 79, 0.7);
            }

            @media (max-width: 768px) {
                .search-suggestions-container {
                    max-height: 300px;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let searchSuggestionsInstance = null;

function initSearchSuggestions() {
    if (!searchSuggestionsInstance) {
        searchSuggestionsInstance = new AdvancedSearchSuggestions();
    }
    return searchSuggestionsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchSuggestions);
} else {
    initSearchSuggestions();
}

// Add trackEvent method
AdvancedSearchSuggestions.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`search_suggestions_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'advanced_search_suggestions', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Export globally
window.AdvancedSearchSuggestions = AdvancedSearchSuggestions;
window.searchSuggestions = () => searchSuggestionsInstance;

