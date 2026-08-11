/**
 * Planet Discovery Feed
 * Real-time discovery updates
 */

class PlanetDiscoveryFeed {
    constructor() {
        this.feed = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadFeed();
        this.isInitialized = true;
        console.log('📡 Planet Discovery Feed initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_fe_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadFeed() {
        try {
            const stored = localStorage.getItem('discovery-feed');
            if (stored) this.feed = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading feed:', error);
        }
    }

    saveFeed() {
        try {
            localStorage.setItem('discovery-feed', JSON.stringify(this.feed));
        } catch (error) {
            console.error('Error saving feed:', error);
        }
    }

    addDiscovery(planetData, discoveredBy = 'System') {
        const entry = {
            id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            planetId: planetData.kepid,
            planetName: planetData.kepler_name || planetData.kepoi_name,
            discoveredBy: discoveredBy,
            timestamp: new Date().toISOString()
        };

        this.feed.unshift(entry);
        if (this.feed.length > 100) {
            this.feed = this.feed.slice(0, 100);
        }
        this.saveFeed();
        try {
            if (typeof window !== 'undefined' && typeof window.renderMyUniverseOverview === 'function') {
                window.renderMyUniverseOverview();
            }
        } catch (e) {}
        return entry;
    }

    renderFeed(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const recentFeed = this.feed.slice(0, 20);

        container.innerHTML = `
            <div class="discovery-feed" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📡 Discovery Feed</h3>
                <div class="feed-items">${this.renderFeedItems(recentFeed)}</div>
            </div>
        `;
    }

    renderFeedItems(feed) {
        if (feed.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No discoveries yet</p>';
        }

        return feed.map(entry => `
            <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem;">
                <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.25rem;">${entry.planetName} discovered</div>
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">by ${entry.discoveredBy}</div>
                <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.75rem;">${new Date(entry.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryFeed = PlanetDiscoveryFeed;
    window.planetDiscoveryFeed = new PlanetDiscoveryFeed();
}

