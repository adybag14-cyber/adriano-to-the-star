/**
 * Planet Discovery Analytics Tracking
 * Enhanced analytics tracking for user behavior and engagement
 */

class PlanetDiscoveryAnalyticsTracking {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.init();
    }

    init() {
        this.loadUserId();
        this.trackPageView();
        this.setupAutoTracking();
        console.log('📊 Analytics tracking initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_an_al_yt_ic_st_ra_ck_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    async loadUserId() {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    this.userId = user.id;
                }
            } catch (error) {
                console.error('Error loading user ID:', error);
            }
        }
    }

    trackPageView() {
        this.track('page_view', {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        });
    }

    track(eventName, properties = {}) {
        const event = {
            event: eventName,
            properties: {
                ...properties,
                session_id: this.sessionId,
                user_id: this.userId,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                user_agent: navigator.userAgent,
                screen_width: window.screen.width,
                screen_height: window.screen.height,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight
            }
        };

        this.events.push(event);

        // Send to analytics service
        this.sendEvent(event);

        // Store locally
        this.storeEvent(event);
    }

    trackPlanetView(planetId) {
        this.track('planet_view', {
            planet_id: planetId
        });
    }

    trackPlanetClaim(planetId) {
        this.track('planet_claim', {
            planet_id: planetId
        });
    }

    trackSearch(query) {
        this.track('search', {
            query: query,
            query_length: query.length
        });
    }

    trackButtonClick(buttonName, context = {}) {
        this.track('button_click', {
            button_name: buttonName,
            ...context
        });
    }

    trackTimeOnPage() {
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            this.track('time_on_page', {
                seconds: timeSpent,
                page: window.location.pathname
            });
        });
    }

    trackScroll(depth) {
        this.track('scroll', {
            depth: depth,
            page: window.location.pathname
        });
    }

    setupAutoTracking() {
        // Track button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, a[href]');
            if (button) {
                const buttonName = button.textContent.trim() || button.getAttribute('aria-label') || button.id || 'unknown';
                this.trackButtonClick(buttonName, {
                    href: button.href || null,
                    id: button.id || null
                });
            }
        });

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (scrollPercent % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                    this.trackScroll(scrollPercent);
                }
            }
        });

        // Track time on page
        this.trackTimeOnPage();
    }

    async sendEvent(event) {
        // Send to Supabase
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                await supabase
                    .from('analytics_events')
                    .insert({
                        event_name: event.event,
                        properties: event.properties,
                        session_id: event.properties.session_id,
                        user_id: event.properties.user_id,
                        timestamp: event.properties.timestamp
                    });
            } catch (error) {
                console.error('Error sending analytics event:', error);
            }
        }

        // Send to Google Analytics (if configured)
        if (typeof gtag !== 'undefined') {
            gtag('event', event.event, event.properties);
        }
    }

    storeEvent(event) {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics-events') || '[]');
            stored.push(event);
            
            // Keep only last 100 events
            if (stored.length > 100) {
                stored.shift();
            }
            
            localStorage.setItem('analytics-events', JSON.stringify(stored));
        } catch (error) {
            console.error('Error storing analytics event:', error);
        }
    }

    getEvents(limit = null) {
        const events = this.events;
        return limit ? events.slice(-limit) : events;
    }

    exportAnalytics(format = 'json') {
        const events = this.getEvents();

        if (format === 'json') {
            const json = JSON.stringify(events, null, 2);
            this.downloadFile(json, 'analytics.json', 'application/json');
        } else if (format === 'csv') {
            const csv = [
                'Event,Timestamp,User ID,Session ID,URL',
                ...events.map(e => 
                    `"${e.event}","${e.properties.timestamp}","${e.properties.user_id || ''}","${e.properties.session_id}","${e.properties.url}"`
                )
            ].join('\n');
            this.downloadFile(csv, 'analytics.csv', 'text/csv');
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryAnalyticsTracking = new PlanetDiscoveryAnalyticsTracking();
}

