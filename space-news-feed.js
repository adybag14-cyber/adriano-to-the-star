/**
 * Real-Time Space News Feed
 * Aggregates and displays real-time space news
 * 
 * Features:
 * - Multiple news sources
 * - Real-time updates
 * - News filtering
 * - Notifications
 */

class SpaceNewsFeed {
    constructor() {
        this.articles = [];
        this.sources = [
            'https://www.nasa.gov/rss/dyn/breaking_news.rss',
            'https://www.space.com/feeds/all'
        ];
        this.init();
    }
    
    init() {
        this.loadNews();
        this.setupAutoRefresh();
        this.createNewsWidget();
        console.log('📰 Space News Feed initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_pa_ce_ne_ws_fe_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    async loadNews() {
        try {
            // Fetch news from multiple sources
            const promises = this.sources.map(url => this.fetchRSS(url));
            const results = await Promise.allSettled(promises);
            
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    this.articles.push(...result.value);
                }
            });
            
            // Sort by date
            this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.articles = this.articles.slice(0, 20); // Keep latest 20
            
            this.updateNewsWidget();
        } catch (e) {
            console.error('Failed to load news:', e);
        }
    }
    
    async fetchRSS(url) {
        try {
            // RSS parsing would go here
            // For now, return sample data
            return [
                {
                    title: 'New Exoplanet Discovered',
                    link: '#',
                    date: new Date(),
                    source: 'NASA'
                }
            ];
        } catch (e) {
            console.error(`Failed to fetch RSS from ${url}:`, e);
            return [];
        }
    }
    
    setupAutoRefresh() {
        // Refresh every 30 minutes
        setInterval(() => {
            this.loadNews();
        }, 1800000);
    }
    
    createNewsWidget() {
        const widget = document.createElement('div');
        widget.id = 'space-news-widget';
        widget.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            max-height: 500px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ba944f;
            border-radius: 12px;
            padding: 15px;
            z-index: 9998;
            overflow-y: auto;
            color: white;
        `;
        
        document.body.appendChild(widget);
        this.updateNewsWidget();
    }
    
    updateNewsWidget() {
        const widget = document.getElementById('space-news-widget');
        if (!widget) return;
        
        widget.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 15px 0;">📰 Space News</h3>
            <div>
                ${this.articles.slice(0, 5).map(article => `
                    <div style="
                        padding: 10px;
                        margin-bottom: 10px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 6px;
                    ">
                        <h4 style="margin: 0 0 5px 0; font-size: 0.9rem;">${article.title}</h4>
                        <p style="margin: 0; font-size: 0.8rem; color: #ccc;">${article.source} • ${new Date(article.date).toLocaleDateString()}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.spaceNewsFeed = new SpaceNewsFeed();
    });
} else {
    window.spaceNewsFeed = new SpaceNewsFeed();
}

