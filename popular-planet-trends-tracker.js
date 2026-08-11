/**
 * Popular Planet Trends Tracker
 * Tracks trending planets and discovery patterns
 * 
 * Features:
 * - Trending planets
 * - Discovery rate tracking
 * - Popularity scores
 * - Time-based trends
 */

class PopularPlanetTrendsTracker {
    constructor() {
        this.trends = [];
        this.popularityScores = new Map();
        this.init();
    }
    
    init() {
        this.loadTrends();
        this.startTracking();
        console.log('📊 Popular Planet Trends Tracker initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_op_ul_ar_pl_an_et_tr_en_ds_tr_ac_ke_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    async loadTrends() {
        try {
            if (window.supabase) {
                // Load recent claims to calculate trends
                const { data } = await window.supabase
                    .from('planet_claims')
                    .select('planet_id, created_at')
                    .order('created_at', { ascending: false })
                    .limit(1000);
                
                if (data) {
                    this.calculateTrends(data);
                }
            }
        } catch (e) {
            console.warn('Failed to load trends:', e);
        }
    }
    
    calculateTrends(claims) {
        const now = Date.now();
        const timeWindows = {
            hour: 3600000,
            day: 86400000,
            week: 604800000
        };
        
        const planetActivity = new Map();
        
        claims.forEach(claim => {
            const planetId = claim.planet_id;
            const claimTime = new Date(claim.created_at).getTime();
            const age = now - claimTime;
            
            if (!planetActivity.has(planetId)) {
                planetActivity.set(planetId, {
                    total: 0,
                    recent: 0,
                    firstSeen: claimTime
                });
            }
            
            const activity = planetActivity.get(planetId);
            activity.total++;
            
            if (age < timeWindows.day) {
                activity.recent++;
            }
        });
        
        // Calculate popularity scores
        planetActivity.forEach((activity, planetId) => {
            const score = activity.recent * 10 + activity.total;
            this.popularityScores.set(planetId, {
                score,
                total: activity.total,
                recent: activity.recent,
                trend: activity.recent > activity.total / 7 ? 'up' : 'stable'
            });
        });
        
        // Sort by popularity
        this.trends = Array.from(this.popularityScores.entries())
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 20)
            .map(([planetId, data]) => ({ planetId, ...data }));
    }
    
    startTracking() {
        // Update trends every 5 minutes
        setInterval(() => {
            this.loadTrends();
        }, 300000);
    }
    
    getTrendingPlanets(limit = 10) {
        return this.trends.slice(0, limit);
    }
    
    getPlanetTrend(planetId) {
        return this.popularityScores.get(planetId);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.popularPlanetTrendsTracker = new PopularPlanetTrendsTracker();
    });
} else {
    window.popularPlanetTrendsTracker = new PopularPlanetTrendsTracker();
}
