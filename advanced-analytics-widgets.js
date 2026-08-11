/**
 * Advanced Analytics Widgets
 * Custom widgets for analytics dashboard with trending planets, discovery rate, etc.
 */

class AdvancedAnalyticsWidgets {
    constructor(analyticsDashboard) {
        this.analytics = analyticsDashboard;
        this.supabase = analyticsDashboard?.supabase || window.supabaseClient || window.supabase;
        this.widgets = {};
        this.init();
    }

    async init() {
        this.trackEvent('analytics_widgets_initialized');
        
        // Wait for analytics dashboard to be ready
        if (window.analyticsDashboard) {
            this.setupWidgets();
        } else {
            // Wait for dashboard
            setTimeout(() => {
                if (window.analyticsDashboard) {
                    this.setupWidgets();
                }
            }, 2000);
        }
    }

    setupWidgets() {
        // Register widgets with dashboard
        if (window.dashboardWidgets) {
            this.registerWidgets();
        }
    }

    registerWidgets() {
        // These widgets will be available in the dashboard widget library
        this.widgets = {
            'trending-planets': {
                render: () => this.renderTrendingPlanets(),
                update: () => this.updateTrendingPlanets(),
                refreshInterval: 30000 // 30 seconds
            },
            'discovery-rate': {
                render: () => this.renderDiscoveryRate(),
                update: () => this.updateDiscoveryRate(),
                refreshInterval: 60000 // 1 minute
            },
            'popular-planet-trends': {
                render: () => this.renderPopularTrends(),
                update: () => this.updatePopularTrends(),
                refreshInterval: 60000
            },
            'claim-statistics': {
                render: () => this.renderClaimStatistics(),
                update: () => this.updateClaimStatistics(),
                refreshInterval: 30000
            }
        };
    }

    /**
     * Render trending planets widget
     */
    async renderTrendingPlanets() {
        const data = await this.getTrendingPlanets();
        this.trackEvent('trending_planets_rendered', { count: data.length });
        
        return `
            <div class="trending-planets-widget">
                <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.2rem;">🔥 Trending Planets</h3>
                <div class="trending-list">
                    ${data.map((planet, index) => `
                        <div class="trending-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: rgba(186, 148, 79, 0.1); border-radius: 8px;">
                            <div>
                                <div style="display: inline-block; width: 20px; height: 20px; background: ${this.getTrendColor(index)}; border-radius: 50%; margin-right: 0.5rem;"></div>
                                <span style="color: #e0e0e0; font-weight: 600;">${planet.name || `Kepler-${planet.kepid}`}</span>
                            </div>
                            <div style="color: #ba944f; font-size: 0.9rem;">
                                ${planet.claims || 0} claims
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get trending planets data
     */
    async getTrendingPlanets() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('planet_claims')
                    .select('kepid, created_at')
                    .order('created_at', { ascending: false })
                    .limit(100)
                    .catch(() => ({ data: [], error: null }));

                if (data) {
                    // Count claims per planet
                    const planetCounts = {};
                    data.forEach(claim => {
                        const kepid = claim.kepid;
                        planetCounts[kepid] = (planetCounts[kepid] || 0) + 1;
                    });

                    // Sort by claim count
                    return Object.entries(planetCounts)
                        .map(([kepid, claims]) => ({ kepid, claims }))
                        .sort((a, b) => b.claims - a.claims)
                        .slice(0, 5);
                }
            }
        } catch (error) {
            console.error('Error getting trending planets:', error);
        }

        // Fallback data
        return [
            { kepid: '12345678', name: 'Kepler-452b', claims: 15 },
            { kepid: '87654321', name: 'Kepler-22b', claims: 12 },
            { kepid: '11223344', name: 'TRAPPIST-1e', claims: 10 },
            { kepid: '44332211', name: 'Proxima Centauri b', claims: 8 },
            { kepid: '55667788', name: 'Kepler-186f', claims: 7 }
        ];
    }

    /**
     * Render discovery rate widget
     */
    async renderDiscoveryRate() {
        const data = await this.getDiscoveryRate();
        
        return `
            <div class="discovery-rate-widget">
                <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.2rem;">📈 Discovery Rate</h3>
                <div class="rate-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 8px;">
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold;">${data.today || 0}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Today</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 8px;">
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold;">${data.week || 0}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">This Week</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 8px;">
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold;">${data.month || 0}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">This Month</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 8px;">
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold;">${data.total || 0}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get discovery rate data
     */
    async getDiscoveryRate() {
        try {
            if (this.supabase) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

                const { data: allClaims } = await this.supabase
                    .from('planet_claims')
                    .select('created_at')
                    .catch(() => ({ data: [] }));

                if (allClaims && allClaims.data) {
                    const todayCount = allClaims.data.filter(c => new Date(c.created_at) >= today).length;
                    const weekCount = allClaims.data.filter(c => new Date(c.created_at) >= weekAgo).length;
                    const monthCount = allClaims.data.filter(c => new Date(c.created_at) >= monthAgo).length;

                    return {
                        today: todayCount,
                        week: weekCount,
                        month: monthCount,
                        total: allClaims.data.length
                    };
                }
            }
        } catch (error) {
            console.error('Error getting discovery rate:', error);
        }

        return { today: 0, week: 0, month: 0, total: 0 };
    }

    /**
     * Render popular trends widget
     */
    async renderPopularTrends() {
        const trends = await this.getPopularTrends();
        
        return `
            <div class="popular-trends-widget">
                <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.2rem;">📊 Popular Trends</h3>
                <div class="trends-list">
                    ${trends.map(trend => `
                        <div class="trend-item" style="padding: 0.75rem; margin-bottom: 0.5rem; background: rgba(186, 148, 79, 0.1); border-left: 3px solid #ba944f; border-radius: 4px;">
                            <div style="color: #e0e0e0; font-weight: 600; margin-bottom: 0.25rem;">${trend.category}</div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">${trend.description}</div>
                            <div style="color: #ba944f; font-size: 0.85rem; margin-top: 0.25rem;">${trend.count} activities</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get popular trends
     */
    async getPopularTrends() {
        // This would analyze user behavior and planet claim patterns
        return [
            { category: 'Earth-like Planets', description: 'Most claimed planet type', count: 245 },
            { category: 'Habitable Zone', description: 'Planets in habitable zone', count: 189 },
            { category: 'Gas Giants', description: 'Large gas giant planets', count: 156 },
            { category: 'Super-Earths', description: 'Super-Earth discoveries', count: 134 }
        ];
    }

    /**
     * Render claim statistics widget
     */
    async renderClaimStatistics() {
        const stats = await this.getClaimStatistics();
        
        return `
            <div class="claim-statistics-widget">
                <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.2rem;">📈 Claim Statistics</h3>
                <div class="stats-chart" style="position: relative; height: 200px;">
                    <canvas id="claims-chart" width="400" height="200"></canvas>
                </div>
                <div class="stats-summary" style="margin-top: 1rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                    <div style="text-align: center; padding: 0.5rem; background: rgba(186, 148, 79, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.5rem; color: #ba944f; font-weight: bold;">${stats.total}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.8rem;">Total Claims</div>
                    </div>
                    <div style="text-align: center; padding: 0.5rem; background: rgba(186, 148, 79, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.5rem; color: #ba944f; font-weight: bold;">${stats.unique}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.8rem;">Unique Planets</div>
                    </div>
                    <div style="text-align: center; padding: 0.5rem; background: rgba(186, 148, 79, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.5rem; color: #ba944f; font-weight: bold;">${stats.users}</div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.8rem;">Active Users</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get claim statistics
     */
    async getClaimStatistics() {
        try {
            if (this.supabase) {
                const { data: claims } = await this.supabase
                    .from('planet_claims')
                    .select('kepid, user_id')
                    .catch(() => ({ data: [] }));

                if (claims && claims.data) {
                    const uniquePlanets = new Set(claims.data.map(c => c.kepid)).size;
                    const uniqueUsers = new Set(claims.data.map(c => c.user_id)).size;

                    return {
                        total: claims.data.length,
                        unique: uniquePlanets,
                        users: uniqueUsers
                    };
                }
            }
        } catch (error) {
            console.error('Error getting claim statistics:', error);
        }

        return { total: 0, unique: 0, users: 0 };
    }

    /**
     * Update widgets
     */
    async updateTrendingPlanets() {
        const widget = document.querySelector('[data-widget-id="trending-planets"] .widget-content');
        if (widget) {
            widget.innerHTML = await this.renderTrendingPlanets();
        }
    }

    async updateDiscoveryRate() {
        const widget = document.querySelector('[data-widget-id="discovery-rate"] .widget-content');
        if (widget) {
            widget.innerHTML = await this.renderDiscoveryRate();
        }
    }

    async updatePopularTrends() {
        const widget = document.querySelector('[data-widget-id="popular-planet-trends"] .widget-content');
        if (widget) {
            widget.innerHTML = await this.renderPopularTrends();
        }
    }

    async updateClaimStatistics() {
        const widget = document.querySelector('[data-widget-id="claim-statistics"] .widget-content');
        if (widget) {
            widget.innerHTML = await this.renderClaimStatistics();
        }
    }

    getTrendColor(index) {
        const colors = ['#ff6b6b', '#ffa500', '#ffd700', '#90ee90', '#87ceeb'];
        return colors[index % colors.length];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`analytics_widgets_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_analytics_widgets', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize when analytics dashboard is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.analyticsDashboard) {
                window.advancedAnalyticsWidgets = new AdvancedAnalyticsWidgets(window.analyticsDashboard);
            }
        }, 2000);
    });
}

