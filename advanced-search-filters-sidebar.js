/**
 * Advanced Search with Filters Sidebar
 * Comprehensive search with filter sidebar
 */

class AdvancedSearchFiltersSidebar {
    constructor() {
        this.filters = {};
        this.searchQuery = '';
        this.init();
    }
    
    init() {
        this.createSearchInterface();
        this.trackEvent('search_sidebar_initialized');
    }
    
    createSearchInterface() {
        const searchContainer = document.createElement('div');
        searchContainer.id = 'advanced-search-container';
        searchContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:10000;display:none;';
        
        searchContainer.innerHTML = `
            <div style="display:flex;height:100%;">
                <div id="search-filters-sidebar" style="width:300px;background:rgba(0,0,0,0.9);padding:20px;overflow-y:auto;border-right:2px solid rgba(186,148,79,0.5);">
                    <h3 style="color:#ba944f;margin:0 0 20px 0;">Filters</h3>
                    <div id="filters-content"></div>
                    <button id="apply-filters" style="width:100%;padding:10px;margin-top:20px;background:rgba(186,148,79,0.5);border:1px solid #ba944f;color:white;border-radius:6px;cursor:pointer;">Apply Filters</button>
                    <button id="clear-filters" style="width:100%;padding:10px;margin-top:10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:white;border-radius:6px;cursor:pointer;">Clear All</button>
                </div>
                <div style="flex:1;padding:20px;overflow-y:auto;">
                    <div style="display:flex;gap:10px;margin-bottom:20px;">
                        <input type="text" id="search-input" placeholder="Search..." style="flex:1;padding:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;">
                        <button id="close-search" style="padding:12px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:white;border-radius:6px;cursor:pointer;">Close</button>
                    </div>
                    <div id="search-results"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(searchContainer);
        
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchContainer.style.display = 'flex';
                document.getElementById('search-input').focus();
            }
        });
        
        document.getElementById('close-search').addEventListener('click', () => {
            searchContainer.style.display = 'none';
        });
        
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.performSearch();
        });
    }
    
    performSearch() {
        const results = document.getElementById('search-results');
        results.innerHTML = `<p style="color:white;">Searching for: ${this.searchQuery}</p>`;
        this.trackEvent('search_performed', { query: this.searchQuery });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`search_sidebar_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_search_filters_sidebar', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.advancedSearchFiltersSidebar = new AdvancedSearchFiltersSidebar(); });
} else {
    window.advancedSearchFiltersSidebar = new AdvancedSearchFiltersSidebar();
}


