/**
 * Real-Time Space News Feed
 * Aggregates news from NASA, ESA, SpaceX, and other space agencies
 */

class RealtimeSpaceNewsFeed {
    constructor() {
        this.newsItems = [];
        this.sources = {
            nasa: true,
            esa: true,
            spacex: true
        };
        this.updateInterval = 30 * 60 * 1000; // 30 minutes
        this.maxItems = 50;
        this.init();
    }

    async init() {
        this.trackEvent('r_ea_lt_im_es_pa_ce_ne_ws_fe_ed_initialized');
        await this.loadNews();
        
        // Set up periodic updates
        setInterval(() => this.loadNews(), this.updateInterval);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ea_lt_im_es_pa_ce_ne_ws_fe_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Load news from all sources
     */
    async loadNews() {
        this.newsItems = [];
        
        // Load from NASA
        if (this.sources.nasa && window.nasaRealtimeUpdates) {
            const nasaUpdates = window.nasaRealtimeUpdates();
            if (nasaUpdates) {
                const discoveries = await nasaUpdates.fetchLatestDiscoveries(5);
                discoveries.forEach(d => {
                    this.newsItems.push({
                        title: `New Exoplanet Discovered: ${d.name}`,
                        summary: `NASA has discovered a new exoplanet using the ${d.discoveryMethod} method.`,
                        source: 'NASA',
                        date: d.discoveryDate || new Date().toISOString(),
                        category: 'Exoplanets',
                        url: `https://exoplanetarchive.ipac.caltech.edu/overview/${d.nasaId}`,
                        type: 'discovery'
                    });
                });
            }
        }

        // Load from ESA
        if (this.sources.esa && window.esaAPI) {
            const esaNews = window.esaAPI.getRecentNews(30);
            esaNews.forEach(article => {
                this.newsItems.push({
                    title: article.title,
                    summary: article.summary,
                    source: 'ESA',
                    date: article.date,
                    category: article.category,
                    url: article.url,
                    image: article.image,
                    type: 'news'
                });
            });
        }

        // Load from SpaceX
        if (this.sources.spacex && window.spacexAPI) {
            const upcoming = window.spacexAPI.launches
                .filter(l => new Date(l.date_utc) > new Date())
                .sort((a, b) => new Date(a.date_utc) - new Date(b.date_utc))
                .slice(0, 5);
            
            upcoming.forEach(launch => {
                this.newsItems.push({
                    title: `Upcoming Launch: ${launch.name || 'SpaceX Mission'}`,
                    summary: launch.details || `SpaceX is preparing for an upcoming launch.`,
                    source: 'SpaceX',
                    date: launch.date_utc,
                    category: 'Launches',
                    url: launch.links?.webcast || launch.links?.article || '#',
                    type: 'launch'
                });
            });
        }

        // Sort by date (newest first)
        this.newsItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limit items
        if (this.newsItems.length > this.maxItems) {
            this.newsItems = this.newsItems.slice(0, this.maxItems);
        }

        console.log(`✅ Loaded ${this.newsItems.length} news items`);
        
        // Update display if container exists
        const container = document.getElementById('space-news-feed-container');
        if (container) {
            this.displayFeed(container);
        }
    }

    /**
     * Display news feed
     */
    displayFeed(container, limit = 10) {
        if (!container) return;

        const items = this.newsItems.slice(0, limit);

        container.innerHTML = `
            <div class="space-news-feed" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div class="feed-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid rgba(186, 148, 79, 0.3);">
                    <div>
                        <h3 style="color: #ba944f; margin: 0 0 0.5rem 0;">📰 Space News Feed</h3>
                        <p style="color: rgba(255, 255, 255, 0.7); margin: 0; font-size: 0.9rem;">Latest updates from NASA, ESA, and SpaceX</p>
                    </div>
                    <button class="btn-refresh" onclick="window.spaceNewsFeed.loadNews()" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔄 Refresh
                    </button>
                </div>

                <div class="news-feed-list" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${items.length > 0 ? items.map(item => `
                        <div class="news-feed-item" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; transition: all 0.3s; cursor: pointer;" onclick="window.open('${item.url}', '_blank')">
                            <div style="display: flex; gap: 1.5rem;">
                                ${item.image ? `
                                    <div style="flex-shrink: 0; width: 120px; height: 80px; border-radius: 8px; overflow: hidden; background: rgba(255, 255, 255, 0.1);">
                                        <img src="${item.image}" alt="${this.escapeHtml(item.title)}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                ` : ''}
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
                                        <span style="background: ${this.getSourceColor(item.source)}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${item.source}</span>
                                        <span style="background: rgba(186, 148, 79, 0.3); color: #ba944f; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem;">${item.category}</span>
                                        <span style="color: rgba(255, 255, 255, 0.5); font-size: 0.85rem;">${this.formatDate(item.date)}</span>
                                        ${item.type === 'discovery' ? '<span style="font-size: 1.2rem;">🆕</span>' : ''}
                                        ${item.type === 'launch' ? '<span style="font-size: 1.2rem;">🚀</span>' : ''}
                                    </div>
                                    <h4 style="color: #ba944f; margin: 0 0 0.75rem 0; font-size: 1.1rem; line-height: 1.4;">${this.escapeHtml(item.title)}</h4>
                                    <p style="color: rgba(255, 255, 255, 0.8); margin: 0; line-height: 1.6;">${this.escapeHtml(item.summary)}</p>
                                </div>
                            </div>
                        </div>
                    `).join('') : `
                        <div style="text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.5);">
                            <p>No news items available at this time.</p>
                            <button onclick="window.spaceNewsFeed.loadNews()" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 1rem;">
                                Load News
                            </button>
                        </div>
                    `}
                </div>

                ${items.length >= limit ? `
                    <div style="text-align: center; margin-top: 2rem;">
                        <button onclick="window.spaceNewsFeed.displayFeed(document.getElementById('space-news-feed-container'), ${limit + 10})" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Load More
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get source color
     */
    getSourceColor(source) {
        const colors = {
            'NASA': 'rgba(0, 102, 204, 0.8)',
            'ESA': 'rgba(0, 51, 153, 0.8)',
            'SpaceX': 'rgba(0, 0, 0, 0.8)'
        };
        return colors[source] || 'rgba(186, 148, 79, 0.6)';
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return date.toLocaleDateString();
    }

    /**
     * Filter news by source
     */
    filterBySource(source) {
        return this.newsItems.filter(item => item.source === source);
    }

    /**
     * Filter news by category
     */
    filterByCategory(category) {
        return this.newsItems.filter(item => item.category === category);
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const sources = {};
        const categories = {};
        
        this.newsItems.forEach(item => {
            sources[item.source] = (sources[item.source] || 0) + 1;
            categories[item.category] = (categories[item.category] || 0) + 1;
        });

        return {
            total: this.newsItems.length,
            bySource: sources,
            byCategory: categories
        };
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize globally
let spaceNewsFeedInstance = null;

function initSpaceNewsFeed() {
    if (!spaceNewsFeedInstance) {
        spaceNewsFeedInstance = new RealtimeSpaceNewsFeed();
    }
    return spaceNewsFeedInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpaceNewsFeed);
} else {
    initSpaceNewsFeed();
}

// Export globally
window.RealtimeSpaceNewsFeed = RealtimeSpaceNewsFeed;
window.spaceNewsFeed = () => spaceNewsFeedInstance;

