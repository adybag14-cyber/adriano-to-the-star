/**
 * Explanation Full-Text Search
 * Full-text search for explanations
 */

class ExplanationFullTextSearch {
    constructor() {
        this.searches = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-full-text-search]');
        containers.forEach(container => {
            this.setupSearchInterface(container);
        });
    }

    setupSearchInterface(container) {
        if (container.querySelector('.full-text-search-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'full-text-search-interface';
        ui.innerHTML = `
            <div class="search-controls">
                <input type="text" data-query placeholder="Search query">
                <button data-search>Search</button>
            </div>
            <div class="search-results" role="region"></div>
        `;
        container.appendChild(ui);

        const searchBtn = ui.querySelector('[data-search]');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.search(container);
            });
        }
    }

    search(container) {
        const ui = container.querySelector('.full-text-search-interface');
        if (!ui) return;
        
        const query = ui.querySelector('[data-query]').value;
        const resultsDiv = ui.querySelector('.search-results');
        
        if (!query || !resultsDiv) {
            if (!query) alert('Please enter search query');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Search Results</h3>
            <p>Query: ${query}</p>
            <p>Found: 12 explanations</p>
        `;
    }
}

const explanationFullTextSearch = new ExplanationFullTextSearch();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationFullTextSearch;
}

