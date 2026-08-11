/**
 * Planet Discovery News Aggregator (Enhanced)
 * Aggregates space and exoplanet news from multiple sources
 */

class PlanetDiscoveryNewsAggregator {
    constructor() {
        this.articles = [];
        this.sources = ['NASA', 'ESA', 'SpaceX', 'Space.com', 'Astronomy Now'];
        this.filters = {
            source: null,
            date: null,
            topic: null
        };
        this.init();
    }

    init() {
        this.loadArticles();
        console.log('📰 News aggregator initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ne_ws_ag_gr_eg_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async loadArticles() {
        // Load from existing space-news-aggregator if available
        if (window.spaceNewsAggregator) {
            try {
                const news = await window.spaceNewsAggregator.fetchNews();
                this.articles = news || [];
            } catch (error) {
                console.error('Error loading news:', error);
            }
        }

        // Add fallback articles
        if (this.articles.length === 0) {
            this.articles = [
                {
                    id: 'news-1',
                    title: 'New Exoplanet Discovered in Habitable Zone',
                    source: 'NASA',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    summary: 'Scientists have discovered a new Earth-sized planet in the habitable zone of a nearby star.',
                    url: '#',
                    image: 'https://via.placeholder.com/400x200/1a1a2e/ba944f?text=Exoplanet+News'
                },
                {
                    id: 'news-2',
                    title: 'Kepler Mission Data Reveals Thousands of Candidates',
                    source: 'Space.com',
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    summary: 'Analysis of Kepler mission data continues to reveal potential exoplanet candidates.',
                    url: '#',
                    image: 'https://via.placeholder.com/400x200/1a1a2e/ba944f?text=Kepler+News'
                }
            ];
        }
    }

    renderNewsAggregator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="news-aggregator-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📰 Space News Aggregator</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        <input type="text" id="news-search" placeholder="Search news..." style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                        <select id="news-source-filter" style="padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white;">
                            <option value="all">All Sources</option>
                            ${this.sources.map(source => `<option value="${source}">${source}</option>`).join('')}
                        </select>
                        <button id="refresh-news-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
                
                <div class="news-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.articles.forEach(article => {
            html += this.createNewsCard(article);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('news-search')?.addEventListener('input', (e) => {
            this.filterNews(e.target.value);
        });

        document.getElementById('news-source-filter')?.addEventListener('change', (e) => {
            this.filterBySource(e.target.value);
        });

        document.getElementById('refresh-news-btn')?.addEventListener('click', async () => {
            await this.refreshNews();
        });
    }

    createNewsCard(article) {
        const daysAgo = Math.floor((Date.now() - new Date(article.date)) / (1000 * 60 * 60 * 24));

        const imageUrl = (article && typeof article.image === 'string') ? article.image.trim() : '';
        const cardImageStyle = (imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null')
            ? `background-image: url('${imageUrl}');`
            : '';

        return `
            <div class="news-card" data-article-id="${article.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; overflow: hidden; cursor: pointer; transition: all 0.3s ease;">
                <div style="width: 100%; height: 200px; background: rgba(0, 0, 0, 0.5); ${cardImageStyle} background-size: cover; background-position: center;"></div>
                <div style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <span style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; color: #ba944f; font-weight: 600;">
                            ${article.source}
                        </span>
                        <span style="font-size: 0.75rem; opacity: 0.7;">${daysAgo} days ago</span>
                    </div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem; font-size: 1.1rem;">${article.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; line-height: 1.6;">${article.summary}</p>
                </div>
            </div>
        `;
    }

    filterNews(query) {
        const filtered = this.articles.filter(article => 
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.summary.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredNews(filtered);
    }

    filterBySource(source) {
        if (source === 'all') {
            this.renderFilteredNews(this.articles);
        } else {
            const filtered = this.articles.filter(article => article.source === source);
            this.renderFilteredNews(filtered);
        }
    }

    renderFilteredNews(articles) {
        const container = document.querySelector('.news-grid');
        if (!container) return;

        container.innerHTML = articles.map(article => this.createNewsCard(article)).join('');

        articles.forEach(article => {
            const card = document.querySelector(`[data-article-id="${article.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    if (article.url && article.url !== '#') {
                        window.open(article.url, '_blank');
                    }
                });
            }
        });
    }

    async refreshNews() {
        await this.loadArticles();
        this.renderNewsAggregator('news-aggregator-container');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryNewsAggregator = new PlanetDiscoveryNewsAggregator();
}

