/**
 * Real-time Space News Feed
 * Aggregated space news and updates feed
 * 
 * Features:
 * - News aggregation
 * - Real-time updates
 * - News categories
 * - Bookmarking
 * - Sharing
 */

class RealTimeSpaceNewsFeed {
    constructor() {
        this.newsItems = [];
        this.sources = [
            'NASA',
            'ESA',
            'SpaceX',
            'Space.com',
            'Astronomy.com'
        ];
        this.categories = [
            'All',
            'Planet Discoveries',
            'Space Missions',
            'Research',
            'Technology',
            'Events'
        ];
        this.currentCategory = 'All';
        this.init();
    }

    init() {
        // Create news feed UI
        this.createNewsFeedUI();

        // Load news
        this.loadNews();

        // Start periodic updates
        this.startNewsUpdates();

        console.log('📰 Real-time Space News Feed initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ea_lt_im_es_pa_ce_ne_ws_fe_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createNewsFeedUI() {
        const container = document.createElement('div');
        container.id = 'space-news-feed';
        container.className = 'space-news-feed';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
        `;

        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0; display: flex; justify-content: space-between; align-items: center;">
                <span>📰 Space News Feed</span>
                <button id="refresh-news" style="background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                    🔄 Refresh
                </button>
            </h2>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                ${this.categories.map(cat => `
                    <button class="news-category-btn" data-category="${cat}" 
                            style="padding: 0.5rem 1rem; background: ${cat === this.currentCategory ? 'rgba(186,148,79,0.3)' : 'rgba(186,148,79,0.1)'}; border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: ${cat === this.currentCategory ? '#ba944f' : 'rgba(255,255,255,0.7)'}; cursor: pointer;">
                        ${cat}
                    </button>
                `).join('')}
            </div>
            
            <div id="news-items-container" style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">
                    Loading news...
                </div>
            </div>
        `;

        // Insert into page
        const main = document.querySelector('main') || document.body;
        const firstSection = main.querySelector('section');
        if (firstSection) {
            firstSection.insertAdjacentElement('afterend', container);
        } else {
            main.appendChild(container);
        }

        // Event listeners
        document.getElementById('refresh-news').addEventListener('click', () => {
            this.loadNews();
        });

        document.querySelectorAll('.news-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentCategory = e.target.dataset.category;
                this.renderNews();
                // Update button styles
                document.querySelectorAll('.news-category-btn').forEach(b => {
                    const isActive = b.dataset.category === this.currentCategory;
                    if (isActive) {
                        b.style.background = 'rgba(186,148,79,0.3)';
                        b.style.color = '#ba944f';
                    } else {
                        b.style.background = 'rgba(186,148,79,0.1)';
                        b.style.color = 'rgba(255,255,255,0.7)';
                    }
                });
            });
        });
    }

    async loadNews() {
        // Simulate loading news (in production, would fetch from APIs)
        const container = document.getElementById('news-items-container');
        container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 1rem;">Loading news...</div>';

        try {
            // Generate sample news items
            const news = this.generateSampleNews();
            this.newsItems = news;
            this.renderNews();
        } catch (e) {
            console.error('Failed to load news:', e);
            container.innerHTML = '<div style="text-align: center; color: rgba(255,0,0,0.7); padding: 1rem;">Failed to load news</div>';
        }
    }

    generateSampleNews() {
        // Sample news items (in production, would come from APIs)
        const now = Date.now();
        return [
            {
                id: 'news-1',
                title: 'New Exoplanet Discovered in Habitable Zone',
                source: 'NASA',
                category: 'Planet Discoveries',
                summary: 'Scientists have discovered a new Earth-sized planet in the habitable zone of a nearby star.',
                date: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                url: 'https://www.nasa.gov/news/',
                image: null
            },
            {
                id: 'news-2',
                title: 'SpaceX Launches Latest Mission to Mars',
                source: 'SpaceX',
                category: 'Space Missions',
                summary: 'SpaceX successfully launched its latest mission to Mars, carrying supplies and equipment.',
                date: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
                url: 'https://www.spacex.com/launches/',
                image: null
            },
            {
                id: 'news-3',
                title: 'ESA Telescope Discovers Water on Distant Planet',
                source: 'ESA',
                category: 'Research',
                summary: 'The European Space Agency\'s telescope has detected signs of water vapor on a distant exoplanet.',
                date: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
                url: 'https://www.esa.int/',
                image: null
            },
            {
                id: 'news-4',
                title: 'New Technology Enables Better Planet Detection',
                source: 'Space.com',
                category: 'Technology',
                summary: 'Breakthrough technology allows astronomers to detect smaller planets than ever before.',
                date: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
                url: 'https://www.space.com/',
                image: null
            },
            {
                id: 'news-5',
                title: 'International Space Conference Announced',
                source: 'Astronomy.com',
                category: 'Events',
                summary: 'The annual International Space Conference will be held next month, featuring the latest discoveries.',
                date: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
                url: 'https://www.astronomy.com/',
                image: null
            }
        ];
    }

    renderNews() {
        const container = document.getElementById('news-items-container');
        if (!container) return;

        // Filter by category
        let filteredNews = this.newsItems;
        if (this.currentCategory !== 'All') {
            filteredNews = this.newsItems.filter(item => item.category === this.currentCategory);
        }

        if (filteredNews.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">No news in this category</div>';
            return;
        }

        container.innerHTML = filteredNews.map(item => `
            <div class="news-item" style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(186,148,79,0.3); border-radius: 10px; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="background: rgba(186,148,79,0.2); padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem; color: #ba944f;">
                                ${item.source}
                            </span>
                            <span style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">
                                ${this.formatDate(item.date)}
                            </span>
                        </div>
                        <h3 style="color: #ba944f; margin: 0 0 0.5rem 0; font-size: 1.2rem;">${item.title}</h3>
                        <p style="color: rgba(255,255,255,0.8); margin: 0; line-height: 1.6;">${item.summary}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="read-more-btn"
                            style="padding: 0.5rem 1rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: #ba944f; cursor: pointer; text-decoration: none; display: inline-block;">
                        Read More
                    </a>
                    <button class="bookmark-news-btn" data-news-id="${item.id}" 
                            style="padding: 0.5rem 1rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: #ba944f; cursor: pointer;">
                        ⭐ Bookmark
                    </button>
                    <button class="share-news-btn" data-news-id="${item.id}" 
                            style="padding: 0.5rem 1rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: #ba944f; cursor: pointer;">

                         🔗 Share
                    </button>
                </div>
            </div>
        `).join('');
        container.querySelectorAll('.read-more-btn').forEach(btn => {
            // No listener needed for standard anchor tag unless tracking
        });

        container.querySelectorAll('.bookmark-news-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newsId = e.target.dataset.newsId;
                this.bookmarkNews(newsId);
            });
        });

        container.querySelectorAll('.share-news-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newsId = e.target.dataset.newsId;
                this.shareNews(newsId);
            });
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }

    bookmarkNews(newsId) {
        const news = this.newsItems.find(n => n.id === newsId);
        if (!news) return;

        // Save to bookmarks
        const bookmarks = JSON.parse(localStorage.getItem('news-bookmarks') || '[]');
        if (!bookmarks.find(b => b.id === newsId)) {
            bookmarks.push(news);
            localStorage.setItem('news-bookmarks', JSON.stringify(bookmarks));
            alert('News bookmarked!');
        } else {
            alert('Already bookmarked');
        }
    }

    shareNews(newsId) {
        const news = this.newsItems.find(n => n.id === newsId);
        if (!news) return;

        if (navigator.share) {
            navigator.share({
                title: news.title,
                text: news.summary,
                url: news.url
            }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(news.url);
                alert('News link copied to clipboard!');
            });
        } else {
            navigator.clipboard.writeText(news.url);
            alert('News link copied to clipboard!');
        }
    }

    startNewsUpdates() {
        // Update news every 30 minutes
        setInterval(() => {
            this.loadNews();
        }, 30 * 60 * 1000);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.realTimeSpaceNewsFeed = new RealTimeSpaceNewsFeed();
    });
} else {
    window.realTimeSpaceNewsFeed = new RealTimeSpaceNewsFeed();
}

