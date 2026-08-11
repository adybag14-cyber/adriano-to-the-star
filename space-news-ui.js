/**
 * Real-Time Space News Feed Aggregator UI
 * User interface for the space news aggregator
 */

class SpaceNewsUI {
    constructor() {
        this.aggregator = null;
        this.container = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (window.spaceNewsAggregator) {
            this.aggregator = window.spaceNewsAggregator;
        }

        this.isInitialized = true;
        console.log('🎨 Space News UI initialized');
    }

    /**
     * Render news feed UI
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.container = container;

        container.innerHTML = `
            <div class="news-feed-container">
                <h3>Space News Feed</h3>
                <div class="news-filters">
                    <select id="news-source-filter" class="filter-select">
                        <option value="all">All Sources</option>
                    </select>
                    <input type="text" id="news-search" placeholder="Search news..." class="search-input">
                </div>
                <div id="news-articles" class="news-articles">
                    <div class="loading">Loading news...</div>
                </div>
            </div>
        `;

        // Load and render articles
        this.loadAndRenderArticles();
    }

    async loadAndRenderArticles() {
        if (!this.aggregator) return;

        const articles = this.aggregator.getArticles();
        this.renderArticles(articles);
    }

    renderArticles(articles) {
        const container = document.getElementById('news-articles');
        if (!container) return;

        if (articles.length === 0) {
            container.innerHTML = '<div class="empty-state">No articles available</div>';
            return;
        }

        container.innerHTML = articles.map(article => `
            <div class="news-article-card">
                <h4 class="article-title">${this.escapeHtml(article.title)}</h4>
                <p class="article-source">Source: ${this.escapeHtml(article.source)}</p>
                <p class="article-date">${new Date(article.publishedAt).toLocaleDateString()}</p>
                <p class="article-excerpt">${this.escapeHtml(article.excerpt || article.description || '')}</p>
                <a href="${this.escapeHtml(article.url)}" target="_blank" rel="noopener" class="article-link">Read More</a>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.spaceNewsUI) {
            window.spaceNewsUI = new SpaceNewsUI();
        }
    });
}


