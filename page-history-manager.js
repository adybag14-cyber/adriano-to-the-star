/**
 * Page History Manager
 * 
 * Enhanced browser history management with visual history,
 * back/forward navigation, and history search.
 * 
 * @class PageHistoryManager
 * @example
 * // Auto-initializes on page load
 * // Access via: window.pageHistoryManager()
 */
class PageHistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 100;
        this.init();
    }

    init() {
        // Track page visits
        this.trackPageVisit();
        
        // Setup navigation listeners
        this.setupNavigationListeners();
        
        // Create history button
        this.createHistoryButton();
        
        console.log('✅ Page History Manager initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ag_eh_is_to_ry_ma_na_ge_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Track page visit
     * 
     * @method trackPageVisit
     * @returns {void}
     */
    trackPageVisit() {
        const visit = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || null
        };

        // Load existing history
        this.loadHistory();

        // Add to history if not duplicate
        const lastVisit = this.history[this.history.length - 1];
        if (!lastVisit || lastVisit.url !== visit.url) {
            this.history.push(visit);
            
            // Limit history size
            if (this.history.length > this.maxHistory) {
                this.history = this.history.slice(-this.maxHistory);
            }

            this.currentIndex = this.history.length - 1;
            this.saveHistory();
        } else {
            this.currentIndex = this.history.length - 1;
        }
    }

    /**
     * Setup navigation listeners
     * 
     * @method setupNavigationListeners
     * @returns {void}
     */
    setupNavigationListeners() {
        // Listen for popstate (back/forward)
        window.addEventListener('popstate', () => {
            this.trackPageVisit();
        });

        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.target) {
                // Track navigation
                setTimeout(() => {
                    this.trackPageVisit();
                }, 100);
            }
        });
    }

    /**
     * Create history button
     * 
     * @method createHistoryButton
     * @returns {void}
     */
    createHistoryButton() {
        // Check if button already exists
        if (document.getElementById('page-history-btn')) return;

        const button = document.createElement('button');
        button.id = 'page-history-btn';
        button.className = 'page-history-btn';
        button.setAttribute('aria-label', 'Page History');
        button.innerHTML = '📜';
        button.title = 'Page History';
        
        button.addEventListener('click', () => this.showHistoryPanel());
        
        document.body.appendChild(button);
    }

    /**
     * Show history panel
     * 
     * @method showHistoryPanel
     * @returns {void}
     */
    showHistoryPanel() {
        // Check if panel already exists
        let panel = document.getElementById('page-history-panel');
        if (panel) {
            panel.classList.add('open');
            this.renderHistory();
            return;
        }

        // Create panel
        panel = document.createElement('div');
        panel.id = 'page-history-panel';
        panel.className = 'page-history-panel';
        panel.innerHTML = `
            <div class="page-history-header">
                <h3>📜 Page History</h3>
                <button class="page-history-close" aria-label="Close">×</button>
            </div>
            <div class="page-history-content">
                <div class="page-history-search">
                    <input type="text" id="history-search" class="history-search-input" placeholder="Search history...">
                </div>
                <div class="page-history-list" id="history-list"></div>
            </div>
        `;

        document.body.appendChild(panel);

        // Setup event listeners
        const closeBtn = panel.querySelector('.page-history-close');
        const searchInput = panel.querySelector('#history-search');

        closeBtn.addEventListener('click', () => this.hideHistoryPanel());
        searchInput.addEventListener('input', (e) => {
            this.filterHistory(e.target.value);
        });

        // Render history
        this.renderHistory();

        // Show panel
        setTimeout(() => panel.classList.add('open'), 10);
    }

    /**
     * Hide history panel
     * 
     * @method hideHistoryPanel
     * @returns {void}
     */
    hideHistoryPanel() {
        const panel = document.getElementById('page-history-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    }

    /**
     * Render history
     * 
     * @method renderHistory
     * @returns {void}
     */
    renderHistory() {
        const listContainer = document.getElementById('history-list');
        if (!listContainer) return;

        if (this.history.length === 0) {
            listContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">No history yet</p>';
            return;
        }

        listContainer.innerHTML = this.history
            .slice()
            .reverse()
            .map((visit, index) => `
                <div class="history-item ${index === 0 ? 'current' : ''}" data-url="${visit.url}">
                    <div class="history-item-icon">${index === 0 ? '📍' : '🔗'}</div>
                    <div class="history-item-content">
                        <div class="history-item-title">${visit.title}</div>
                        <div class="history-item-url">${this.formatURL(visit.url)}</div>
                        <div class="history-item-time">${this.formatTime(visit.timestamp)}</div>
                    </div>
                </div>
            `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                if (url !== window.location.href) {
                    window.location.href = url;
                }
            });
        });
    }

    /**
     * Filter history
     * 
     * @method filterHistory
     * @param {string} query - Search query
     * @returns {void}
     */
    filterHistory(query) {
        const items = document.querySelectorAll('.history-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const title = item.querySelector('.history-item-title')?.textContent || '';
            const url = item.querySelector('.history-item-url')?.textContent || '';
            const matches = title.toLowerCase().includes(lowerQuery) || 
                          url.toLowerCase().includes(lowerQuery);
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    /**
     * Format URL
     * 
     * @method formatURL
     * @param {string} url - URL to format
     * @returns {string} Formatted URL
     */
    formatURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname + urlObj.search;
        } catch {
            return url;
        }
    }

    /**
     * Format time
     * 
     * @method formatTime
     * @param {string} isoString - ISO time string
     * @returns {string} Formatted time
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Get history
     * 
     * @method getHistory
     * @returns {Array} History array
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear history
     * 
     * @method clearHistory
     * @returns {void}
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveHistory();
        this.renderHistory();
    }

    /**
     * Load history from localStorage
     * 
     * @method loadHistory
     * @returns {void}
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem('page-history');
            if (stored) {
                this.history = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load page history:', error);
        }
    }

    /**
     * Save history to localStorage
     * 
     * @method saveHistory
     * @returns {void}
     */
    saveHistory() {
        try {
            localStorage.setItem('page-history', JSON.stringify(this.history));
        } catch (error) {
            console.warn('Failed to save page history:', error);
        }
    }
}

// Initialize globally
let pageHistoryManagerInstance = null;

function initPageHistoryManager() {
    if (!pageHistoryManagerInstance) {
        pageHistoryManagerInstance = new PageHistoryManager();
    }
    return pageHistoryManagerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageHistoryManager);
} else {
    initPageHistoryManager();
}

// Export globally
window.PageHistoryManager = PageHistoryManager;
window.pageHistoryManager = () => pageHistoryManagerInstance;

