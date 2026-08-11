/**
 * User Behavior Analytics System
 * Tracks user interactions, usage statistics, and popular features
 */

class UserAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
        this.pageViews = 0;
        this.featureUsage = {};
        this.userJourney = [];
        this.isInitialized = false;
        
        // Privacy-compliant: Only track with user consent
        this.consentGiven = localStorage.getItem('analytics-consent') === 'true';
        
        this.init();
    }

    /**
     * Initialize analytics system
     */
    init() {
        if (!this.consentGiven) {
            this.showConsentBanner();
            return;
        }

        this.isInitialized = true;
        this.loadStoredData();
        this.setupEventListeners();
        this.trackPageView();
        this.startSessionTracking();
        
        console.log('📊 User Analytics initialized');
    }

    /**
     * Show consent banner for analytics
     */
    showConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'analytics-consent-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #ba944f;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            color: #fff;
            font-family: 'Raleway', sans-serif;
            font-size: 0.9rem;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        banner.innerHTML = `
            <p style="margin: 0 0 1rem 0;">We use analytics to improve your experience. No personal data is collected.</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="analytics-accept" style="background: #ba944f; color: #000; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Accept</button>
                <button id="analytics-decline" style="background: transparent; color: #ba944f; border: 1px solid #ba944f; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer;">Decline</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('analytics-accept').addEventListener('click', () => {
            this.consentGiven = true;
            localStorage.setItem('analytics-consent', 'true');
            banner.remove();
            this.init();
        });

        document.getElementById('analytics-decline').addEventListener('click', () => {
            localStorage.setItem('analytics-consent', 'false');
            banner.remove();
        });
    }

    /**
     * Load stored analytics data
     */
    loadStoredData() {
        try {
            const stored = localStorage.getItem('user-analytics');
            if (stored) {
                const data = JSON.parse(stored);
                this.featureUsage = data.featureUsage || {};
                this.userJourney = data.userJourney || [];
            }
        } catch (error) {
            console.warn('Failed to load analytics data:', error);
        }
    }

    /**
     * Save analytics data to localStorage
     */
    saveData() {
        try {
            const data = {
                featureUsage: this.featureUsage,
                userJourney: this.userJourney,
                lastUpdated: Date.now()
            };
            localStorage.setItem('user-analytics', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save analytics data:', error);
        }
    }

    /**
     * Setup event listeners for tracking
     */
    setupEventListeners() {
        // Track clicks on interactive elements
        document.addEventListener('click', (e) => {
            const target = e.target;
            const feature = this.identifyFeature(target);
            if (feature) {
                this.trackFeatureUsage(feature);
            }
        }, true);

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackEvent('form_submit', {
                formId: e.target.id || 'unknown',
                formAction: e.target.action || 'unknown'
            });
        });

        // Track page navigation
        window.addEventListener('popstate', () => {
            this.trackPageView();
        });

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
            );
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                    this.trackEvent('scroll_depth', { depth: maxScroll });
                }
            }
        });
    }

    /**
     * Identify which feature was clicked
     */
    identifyFeature(element) {
        // Check for data attributes
        if (element.dataset.feature) {
            return element.dataset.feature;
        }

        // Check for IDs
        if (element.id) {
            const id = element.id.toLowerCase();
            if (id.includes('planet') || id.includes('claim')) return 'planet_claim';
            if (id.includes('search')) return 'search';
            if (id.includes('filter')) return 'filter';
            if (id.includes('compare')) return 'planet_compare';
            if (id.includes('favorite')) return 'favorite';
            if (id.includes('3d') || id.includes('viewer')) return '3d_viewer';
            if (id.includes('ai') || id.includes('stellar')) return 'stellar_ai';
            if (id.includes('messaging') || id.includes('message')) return 'messaging';
            if (id.includes('badge')) return 'badges';
            if (id.includes('leaderboard')) return 'leaderboard';
        }

        // Check for classes
        const classes = element.className;
        if (typeof classes === 'string') {
            if (classes.includes('planet-card')) return 'planet_view';
            if (classes.includes('claim-btn')) return 'planet_claim';
            if (classes.includes('search')) return 'search';
        }

        return null;
    }

    /**
     * Track a page view
     */
    trackPageView() {
        this.pageViews++;
        const page = window.location.pathname || '/';
        this.trackEvent('page_view', {
            page: page,
            timestamp: Date.now()
        });
        this.userJourney.push({
            action: 'page_view',
            page: page,
            timestamp: Date.now()
        });
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(feature) {
        if (!this.featureUsage[feature]) {
            this.featureUsage[feature] = 0;
        }
        this.featureUsage[feature]++;

        this.trackEvent('feature_usage', {
            feature: feature,
            count: this.featureUsage[feature]
        });

        this.saveData();
    }

    /**
     * Track a custom event
     */
    trackEvent(eventName, data = {}) {
        if (!this.isInitialized || !this.consentGiven) return;

        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            sessionId: this.getSessionId(),
            page: window.location.pathname
        };

        this.events.push(event);

        // Keep only last 1000 events in memory
        if (this.events.length > 1000) {
            this.events.shift();
        }

        // Save periodically
        if (this.events.length % 10 === 0) {
            this.saveData();
        }
    }

    /**
     * Start session tracking
     */
    startSessionTracking() {
        this.sessionInterval = setInterval(() => {
            const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
            this.trackEvent('session_heartbeat', {
                duration: sessionDuration
            });
        }, 60000); // Every minute
    }

    /**
     * Get session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics-session-id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('analytics-session-id', sessionId);
        }
        return sessionId;
    }

    /**
     * Get usage statistics
     */
    getStats() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
        
        return {
            sessionDuration: sessionDuration,
            pageViews: this.pageViews,
            featureUsage: { ...this.featureUsage },
            totalEvents: this.events.length,
            topFeatures: this.getTopFeatures(5),
            userJourney: this.userJourney.slice(-20) // Last 20 actions
        };
    }

    /**
     * Get top features by usage
     */
    getTopFeatures(limit = 5) {
        return Object.entries(this.featureUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([feature, count]) => ({ feature, count }));
    }

    /**
     * Export analytics data (for user download)
     */
    exportData() {
        const data = {
            stats: this.getStats(),
            events: this.events,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Reset analytics data
     */
    reset() {
        this.events = [];
        this.featureUsage = {};
        this.userJourney = [];
        this.pageViews = 0;
        localStorage.removeItem('user-analytics');
        console.log('📊 Analytics data reset');
    }

    /**
     * Cleanup - remove event listeners and intervals
     */
    destroy() {
        // Clear session interval
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
            this.sessionInterval = null;
        }

        // Note: We don't remove document-level event listeners as they're needed
        // for tracking. In a production app, you might want to make them optional.
        console.log('📊 Analytics cleanup complete');
    }
}

// Initialize analytics globally
if (typeof window !== 'undefined') {
    window.userAnalytics = new UserAnalytics();
    
    // Make available globally
    window.getAnalytics = () => window.userAnalytics;
}

