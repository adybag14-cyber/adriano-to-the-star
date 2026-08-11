/**
 * Planet Discovery Search History
 * Track search queries
 */

class PlanetDiscoverySearchHistory {
    constructor() {
        this.history = [];
        this.maxHistory = 50;
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadHistory();
        this.isInitialized = true;
        console.log('🔍 Planet Discovery Search History initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_se_ar_ch_hi_st_or_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadHistory() {
        try {
            const stored = localStorage.getItem('search-history');
            if (stored) this.history = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('search-history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    addSearch(query, results = 0) {
        const entry = {
            id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            query: query,
            results: results,
            timestamp: new Date().toISOString()
        };

        this.history.unshift(entry);
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }
        this.saveHistory();
        return entry;
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    getRecentSearches(limit = 10) {
        return this.history.slice(0, limit);
    }

    renderHistory(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="search-history" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🔍 Search History (${this.history.length})</h3>
                    <button onclick="planetDiscoverySearchHistory.clearHistory(); planetDiscoverySearchHistory.renderHistory('search-history-container');" style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
                        Clear
                    </button>
                </div>
                <div class="history-list">${this.renderHistoryList()}</div>
            </div>
        `;
    }

    renderHistoryList() {
        if (this.history.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No search history yet</p>';
        }

        return this.history.slice(0, 20).map(entry => `
            <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #ba944f; font-weight: 600;">${entry.query}</div>
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 0.25rem;">${entry.results} results • ${new Date(entry.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoverySearchHistory = PlanetDiscoverySearchHistory;
    window.planetDiscoverySearchHistory = new PlanetDiscoverySearchHistory();
}

