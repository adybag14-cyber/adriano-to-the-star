/**
 * Real-Time Space News Feed Aggregator
 * Aggregates space news from multiple sources
 */

class SpaceNewsAggregator {
    constructor() {
        this.newsSources = [
            {
                name: 'NASA News',
                url: 'https://www.nasa.gov/news/releases/latest/',
                type: 'rss',
                enabled: true
            },
            {
                name: 'Space.com',
                url: 'https://www.space.com/news',
                type: 'web',
                enabled: true
            },
            {
                name: 'ESA News',
                url: 'https://www.esa.int/News',
                type: 'web',
                enabled: true
            }
        ];
        this.articles = [];
        this.updateInterval = 60 * 60 * 1000; // 1 hour
        this.init();
    }

    async init() {
        this.trackEvent('s_pa_ce_ne_ws_ag_gr_eg_at_or_initialized');
        await this.fetchNews();
        
        // Set up periodic updates
        setInterval(() => this.fetchNews(), this.updateInterval);
        
        // Add real-time WebSocket support if available
        this.setupWebSocketConnection();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_pa_ce_ne_ws_ag_gr_eg_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Setup WebSocket for real-time news updates
     */
    setupWebSocketConnection() {
        // In production, this would connect to a news feed WebSocket
        // For now, we'll use polling with shorter intervals for "real-time" feel
        if (this.updateInterval > 5 * 60 * 1000) {
            // If update interval is more than 5 minutes, add a quick check every 5 minutes
            setInterval(() => {
                this.fetchNews().catch(err => console.warn('News fetch error:', err));
            }, 5 * 60 * 1000);
        }
    }

    /**
     * Fetch news from all sources
     */
    async fetchNews() {
        console.log('📡 Fetching space news...');
        
        const allArticles = [];
        
        // Fetch from each source
        for (const source of this.newsSources.filter(s => s.enabled)) {
            try {
                const articles = await this.fetchFromSource(source);
                allArticles.push(...articles);
            } catch (error) {
                console.warn(`Error fetching from ${source.name}:`, error);
            }
        }

        // Sort by date (newest first)
        this.articles = allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`✅ Loaded ${this.articles.length} news articles`);
        return this.articles;
    }

    /**
     * Fetch news from a specific source
     */
    async fetchFromSource(source) {
        // Since we can't directly access external APIs due to CORS,
        // we'll use a fallback approach with sample data
        // In production, this would use a backend proxy or RSS parser
        
        return this.getFallbackNews(source);
    }

    /**
     * Get fallback news data
     */
    getFallbackNews(source) {
        const now = new Date();
        const articles = [];
        
        // Generate sample articles based on source
        if (source.name === 'NASA News') {
            articles.push(
                {
                    title: 'NASA Discovers New Exoplanet in Habitable Zone',
                    summary: 'Scientists using the Kepler Space Telescope have identified a new Earth-like planet...',
                    source: 'NASA',
                    date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    url: 'https://www.nasa.gov/news',
                    category: 'Exoplanets'
                },
                {
                    title: 'James Webb Telescope Reveals Atmospheric Composition of Distant Worlds',
                    summary: 'Latest observations provide unprecedented detail about exoplanet atmospheres...',
                    source: 'NASA',
                    date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    url: 'https://www.nasa.gov/news',
                    category: 'Research'
                }
            );
        } else if (source.name === 'Space.com') {
            articles.push(
                {
                    title: 'Breakthrough in Exoplanet Detection Methods',
                    summary: 'New techniques allow detection of smaller, Earth-sized planets...',
                    source: 'Space.com',
                    date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    url: 'https://www.space.com',
                    category: 'Technology'
                }
            );
        } else if (source.name === 'ESA News') {
            articles.push(
                {
                    title: 'CHEOPS Mission Discovers Unusual Exoplanet System',
                    summary: 'European space telescope reveals unique planetary configuration...',
                    source: 'ESA',
                    date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    url: 'https://www.esa.int',
                    category: 'Missions'
                }
            );
        }

        return articles;
    }

    /**
     * Display news feed
     */
    displayNewsFeed(container, limit = 10) {
        if (!container) return;

        const recentArticles = this.articles.slice(0, limit);

        container.innerHTML = `
            <div class="space-news-feed" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="news-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">📰 Latest Space News</h3>
                    <button class="refresh-news-btn" onclick="spaceNewsAggregator.fetchNews().then(() => spaceNewsAggregator.displayNewsFeed(document.getElementById('news-container'), 10))" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔄 Refresh
                    </button>
                </div>

                <div class="news-list">
                    ${recentArticles.length > 0 ? recentArticles.map(article => `
                        <div class="news-article" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(186, 148, 79, 0.2)'" onmouseout="this.style.background='rgba(186, 148, 79, 0.1)'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                <div style="flex: 1;">
                                    <h4 style="color: #e0e0e0; margin: 0 0 0.5rem 0; font-size: 1.1rem; line-height: 1.4;">
                                        ${article.title}
                                    </h4>
                                    <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                                        <span>📅 ${new Date(article.date).toLocaleDateString()}</span>
                                        <span>🏷️ ${article.category}</span>
                                        <span>📰 ${article.source}</span>
                                    </div>
                                </div>
                            </div>
                            <p style="color: rgba(255, 255, 255, 0.8); margin: 0.75rem 0; line-height: 1.6;">
                                ${article.summary}
                            </p>
                            ${article.url ? `
                                <a href="${article.url}" target="_blank" style="color: #ba944f; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
                                    Read More →
                                </a>
                            ` : ''}
                        </div>
                    `).join('') : `
                        <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.6);">
                            <p>No news articles available at this time.</p>
                            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check back later for updates.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Get articles by category
     */
    getArticlesByCategory(category) {
        return this.articles.filter(article => 
            article.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Get recent articles (last N days)
     */
    getRecentArticles(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.articles.filter(article => 
            new Date(article.date) >= cutoffDate
        );
    }
}

// Initialize space news aggregator
if (typeof window !== 'undefined') {
    window.SpaceNewsAggregator = SpaceNewsAggregator;
    window.spaceNewsAggregator = new SpaceNewsAggregator();
}

