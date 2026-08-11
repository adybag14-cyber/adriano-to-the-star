/**
 * Advanced Analytics Dashboard
 * Tracks user behavior, planet claims, marketplace activity, and trends
 */

class AnalyticsDashboard {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.reputationSystem = null;
        this.analytics = {
            userStats: null,
            planetTrends: null,
            marketplaceStats: null,
            activityTimeline: []
        };
    }

    /**
     * Wait for Supabase to be initialized
     */
    async waitForSupabase(maxWait = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            // First, check if auth manager is ready
            if (window.authManager) {
                // Wait for auth manager to be ready
                if (window.authManager.isReady) {
                    // Check if Supabase is available through auth manager
                    if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getUser === 'function') {
                        return true;
                    }
                    if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.getUser === 'function') {
                        return true;
                    }
                }
            }
            
            // Also check if Supabase is available directly (in case auth manager uses different variable)
            if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getUser === 'function') {
                return true;
            }
            if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.getUser === 'function') {
                return true;
            }
            
            // If Supabase library is loaded but not initialized, check if we can create client
            if (window.supabase && window.supabase.createClient && typeof SUPABASE_CONFIG !== 'undefined') {
                if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
                    // Try to create and verify client
                    try {
                        const testClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                        if (testClient && testClient.auth && typeof testClient.auth.getUser === 'function') {
                            return true; // Can create valid client
                        }
                    } catch (error) {
                        // Continue waiting
                    }
                }
            }
            
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('Timeout waiting for Supabase to initialize');
        return false;
    }

    async init() {
        const container = document.getElementById('analytics-container');
        if (!container) {
            console.error('Analytics container not found');
            return;
        }

        // Wait for Supabase to be ready (with timeout)
        await this.waitForSupabase();

        // Initialize Supabase client if not already initialized
        if (!this.supabase) {
            // Check for window.supabase (set by auth-supabase.js)
            if (window.supabase && window.supabase.auth) {
                this.supabase = window.supabase;
            } else if (window.supabaseClient && window.supabaseClient.auth) {
                this.supabase = window.supabaseClient;
            } else if (window.supabase && window.supabase.createClient) {
                // Try to create client from config
                if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
                    try {
                        this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                        // Verify the client was created correctly
                        if (!this.supabase || !this.supabase.auth) {
                            throw new Error('Failed to create valid Supabase client');
                        }
                    } catch (error) {
                        console.error('Error creating Supabase client:', error);
                        container.innerHTML = '<div class="error-message">Failed to initialize Supabase client. Please check your configuration.</div>';
                        return;
                    }
                } else {
                    container.innerHTML = '<div class="error-message">Supabase not configured. Please configure Supabase in supabase-config.js</div>';
                    return;
                }
            } else {
                container.innerHTML = '<div class="error-message">Supabase client not available. Please ensure Supabase scripts are loaded.</div>';
                return;
            }
        }

        // Final check authentication - ensure it's a valid client
        if (!this.supabase) {
            container.innerHTML = '<div class="error-message">Supabase client not initialized.</div>';
            return;
        }
        
        if (!this.supabase.auth) {
            container.innerHTML = '<div class="error-message">Supabase authentication not available. Please ensure Supabase is properly configured.</div>';
            return;
        }

        try {
            // Double-check that supabase and auth are available
            if (!this.supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            if (!this.supabase.auth) {
                throw new Error('Supabase auth not available');
            }
            
            // Safely get user with error handling
            const { data, error } = await this.supabase.auth.getUser();
            
            if (error) {
                const isMissingSession = (error && (error.name === 'AuthSessionMissingError' ||
                    String(error).includes('Auth session missing') ||
                    String(error).includes('AuthSessionMissingError')));

                if (!isMissingSession) {
                    console.error('Auth error:', error);
                }
                this.currentUser = null;
            } else if (data && data.user) {
                this.currentUser = data.user;
            } else {
                this.currentUser = null;
            }
        } catch (error) {
            const isMissingSession = (error && (error.name === 'AuthSessionMissingError' ||
                String(error).includes('Auth session missing') ||
                String(error).includes('AuthSessionMissingError')));

            if (!isMissingSession) {
                console.error('Error getting user:', error);
            }
            this.currentUser = null;
            // Don't return here - allow dashboard to show login prompt
        }

        if (!this.currentUser) {
            container.innerHTML = '<div class="login-prompt">Please <a href="login.html">login</a> to view analytics</div>';
            return;
        }

        // Initialize reputation system
        if (window.ReputationSystem) {
            this.reputationSystem = new ReputationSystem();
            await this.reputationSystem.init();
        }

        this.render();
        await this.loadAnalytics();
        this.trackEvent('analytics_dashboard_initialized');
    }

    /**
     * Render the dashboard UI
     */
    render() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-dashboard">
                <div class="dashboard-header">
                    <h2>Analytics Dashboard</h2>
                    <div class="refresh-controls">
                        <button class="refresh-btn" id="refresh-analytics">Refresh</button>
                        <select id="time-range" class="time-range-select">
                            <option value="7d">Last 7 days</option>
                            <option value="30d" selected>Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>
                </div>

                <div class="analytics-grid">
                    <!-- User Stats Card -->
                    <div class="analytics-card">
                        <h3>Your Statistics</h3>
                        <div id="user-stats" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <!-- Planet Claims Card -->
                    <div class="analytics-card">
                        <h3>Planet Claims</h3>
                        <div id="planet-stats" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <!-- Marketplace Activity Card -->
                    <div class="analytics-card">
                        <h3>Marketplace Activity</h3>
                        <div id="marketplace-stats" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <!-- Reputation Progress Card -->
                    <div class="analytics-card">
                        <h3>Reputation Progress</h3>
                        <div id="reputation-stats" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <!-- Activity Timeline Card -->
                    <div class="analytics-card full-width">
                        <h3>Activity Timeline</h3>
                        <div id="activity-timeline" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <!-- Popular Planets Card -->
                    <div class="analytics-card full-width">
                        <h3>Trending Planets</h3>
                        <div id="trending-planets" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <div class="analytics-card full-width">
                        <h3>Performance &amp; Web Vitals</h3>
                        <div id="performance-overview" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <div class="analytics-card full-width">
                        <h3>AI Usage Overview</h3>
                        <div id="ai-usage-overview" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>

                    <div class="analytics-card full-width">
                        <h3>AI Fairness Overview</h3>
                        <div id="fairness-overview" class="stats-content">
                            <div class="loading-state">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-analytics');
        const timeRange = document.getElementById('time-range');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAnalytics(true));
        }

        if (timeRange) {
            timeRange.addEventListener('change', () => this.loadAnalytics(true));
        }
    }

    /**
     * Load all analytics data
     */
    async loadAnalytics(forceRefresh = false) {
        if (!this.currentUser) {
            console.log('No current user, skipping analytics load');
            return;
        }

        if (!this.supabase || !this.supabase.auth) {
            console.error('Supabase client not available for loading analytics');
            return;
        }

        try {
            await Promise.all([
                this.loadUserStats().catch(err => console.error('Error loading user stats:', err)),
                this.loadPlanetStats().catch(err => console.error('Error loading planet stats:', err)),
                this.loadMarketplaceStats().catch(err => console.error('Error loading marketplace stats:', err)),
                this.loadReputationStats().catch(err => console.error('Error loading reputation stats:', err)),
                this.loadActivityTimeline().catch(err => console.error('Error loading activity timeline:', err)),
                this.loadTrendingPlanets().catch(err => console.error('Error loading trending planets:', err)),
                this.loadPerformanceOverview().catch(err => console.error('Error loading performance overview:', err)),
                this.loadAIUsageOverview().catch(err => console.error('Error loading AI usage overview:', err)),
                this.loadFairnessOverview().catch(err => console.error('Error loading fairness overview:', err))
            ]);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    /**
     * Load user statistics
     */
    async loadUserStats() {
        const container = document.getElementById('user-stats');
        if (!container) return;

        try {
            const reputation = this.reputationSystem?.reputation;
            if (!reputation) {
                container.innerHTML = '<p class="no-data">No data available</p>';
                return;
            }

            container.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-value">${reputation.total_points.toLocaleString()}</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reputation.reputation_level}</div>
                        <div class="stat-label">Level</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reputation.planets_claimed || 0}</div>
                        <div class="stat-label">Planets</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reputation.transactions_completed || 0}</div>
                        <div class="stat-label">Transactions</div>
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<p class="error">Error loading stats</p>';
        }
    }

    /**
     * Load planet statistics
     */
    async loadPlanetStats() {
        const container = document.getElementById('planet-stats');
        if (!container) return;

        try {
            if (!this.supabase || !this.supabase.auth) {
                container.innerHTML = '<p class="error">Supabase client not available</p>';
                return;
            }

            if (!this.currentUser || !this.currentUser.id) {
                container.innerHTML = '<p class="error">User not authenticated</p>';
                return;
            }

            const { data: claims, error } = await this.supabase
                .from('planet_claims')
                .select('kepid, claimed_at, planet_data')
                .eq('user_id', this.currentUser.id)
                .eq('status', 'active')
                .order('claimed_at', { ascending: false });

            if (error) throw error;

            const totalClaims = claims?.length || 0;
            const recentClaims = claims?.filter(c => {
                const claimDate = new Date(c.claimed_at);
                const daysAgo = (Date.now() - claimDate.getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 30;
            }).length || 0;

            container.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-value">${totalClaims}</div>
                        <div class="stat-label">Total Claims</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${recentClaims}</div>
                        <div class="stat-label">Last 30 Days</div>
                    </div>
                </div>
                ${totalClaims > 0 ? `
                    <div class="chart-container">
                        <canvas id="planet-claims-chart" width="300" height="150"></canvas>
                    </div>
                ` : '<p class="no-data">No planet claims yet</p>'}
            `;
        } catch (error) {
            container.innerHTML = '<p class="error">Error loading planet stats</p>';
        }
    }

    /**
     * Load marketplace statistics
     */
    async loadMarketplaceStats() {
        const container = document.getElementById('marketplace-stats');
        if (!container) return;

        try {
            if (!this.supabase || !this.supabase.auth) {
                container.innerHTML = '<p class="error">Supabase client not available</p>';
                return;
            }

            if (!this.currentUser || !this.currentUser.id) {
                container.innerHTML = '<p class="error">User not authenticated</p>';
                return;
            }

            const { data: listings, error } = await this.supabase
                .from('marketplace_listings')
                .select('*')
                .eq('seller_id', this.currentUser.id);

            if (error) throw error;

            const totalListings = listings?.length || 0;
            const activeListings = listings?.filter(l => l.status === 'active').length || 0;
            const soldListings = listings?.filter(l => l.status === 'sold').length || 0;
            const totalRevenue = listings?.filter(l => l.status === 'sold' && l.price)
                .reduce((sum, l) => sum + parseFloat(l.price || 0), 0) || 0;

            container.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-value">${totalListings}</div>
                        <div class="stat-label">Total Listings</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${activeListings}</div>
                        <div class="stat-label">Active</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${soldListings}</div>
                        <div class="stat-label">Sold</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
                        <div class="stat-label">Revenue</div>
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<p class="error">Error loading marketplace stats</p>';
        }
    }

    /**
     * Load reputation statistics
     */
    async loadReputationStats() {
        const container = document.getElementById('reputation-stats');
        if (!container) return;

        try {
            const reputation = this.reputationSystem?.reputation;
            if (!reputation) {
                container.innerHTML = '<p class="no-data">No reputation data</p>';
                return;
            }

            const levelInfo = this.reputationSystem.getReputationLevelInfo();
            const nextLevel = this.getNextLevel(reputation.total_points);

            container.innerHTML = `
                <div class="reputation-progress">
                    <div class="level-info">
                        <span class="current-level">${levelInfo.name}</span>
                        ${nextLevel ? `<span class="next-level">→ ${nextLevel.name}</span>` : '<span class="max-level">Max Level</span>'}
                    </div>
                    ${nextLevel ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(100, (reputation.total_points / nextLevel.minPoints) * 100)}%"></div>
                        </div>
                        <div class="progress-text">
                            ${reputation.total_points} / ${nextLevel.minPoints} points
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<p class="error">Error loading reputation</p>';
        }
    }

    /**
     * Load activity timeline
     */
    async loadActivityTimeline() {
        const container = document.getElementById('activity-timeline');
        if (!container) return;

        try {
            if (!this.supabase || !this.supabase.auth) {
                container.innerHTML = '<p class="error">Supabase client not available</p>';
                return;
            }

            if (!this.currentUser || !this.currentUser.id) {
                container.innerHTML = '<p class="error">User not authenticated</p>';
                return;
            }

            // Get recent activity from multiple sources
            const [claims, listings, transactions] = await Promise.all([
                this.supabase
                    .from('planet_claims')
                    .select('kepid, claimed_at, planet_data')
                    .eq('user_id', this.currentUser.id)
                    .order('claimed_at', { ascending: false })
                    .limit(10),
                this.supabase
                    .from('marketplace_listings')
                    .select('id, created_at, listing_type, status')
                    .eq('seller_id', this.currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(10),
                this.supabase
                    .from('marketplace_listings')
                    .select('id, sold_at, price')
                    .eq('buyer_id', this.currentUser.id)
                    .not('sold_at', 'is', null)
                    .order('sold_at', { ascending: false })
                    .limit(10)
            ]);

            const activities = [];

            if (claims.data) {
                claims.data.forEach(c => {
                    activities.push({
                        type: 'claim',
                        date: c.claimed_at,
                        description: `Claimed planet ${c.planet_data?.pl_name || `KEPID ${c.kepid}`}`
                    });
                });
            }

            if (listings.data) {
                listings.data.forEach(l => {
                    activities.push({
                        type: 'listing',
                        date: l.created_at,
                        description: `Created ${l.listing_type} listing`
                    });
                });
            }

            if (transactions.data) {
                transactions.data.forEach(t => {
                    activities.push({
                        type: 'transaction',
                        date: t.sold_at,
                        description: `Purchased planet for $${parseFloat(t.price || 0).toFixed(2)}`
                    });
                });
            }

            // Sort by date
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (activities.length === 0) {
                container.innerHTML = '<p class="no-data">No recent activity</p>';
                return;
            }

            container.innerHTML = `
                <div class="timeline">
                    ${activities.slice(0, 20).map(activity => `
                        <div class="timeline-item ${activity.type}">
                            <div class="timeline-date">${new Date(activity.date).toLocaleDateString()}</div>
                            <div class="timeline-content">${activity.description}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<p class="error">Error loading timeline</p>';
        }
    }

    /**
     * Load trending planets
     */
    async loadTrendingPlanets() {
        const container = document.getElementById('trending-planets');
        if (!container) return;

        try {
            if (!this.supabase || !this.supabase.auth) {
                container.innerHTML = '<p class="error">Supabase client not available</p>';
                return;
            }

            // Get most claimed planets
            const { data: claims, error } = await this.supabase
                .from('planet_claims')
                .select('kepid, planet_data')
                .eq('status', 'active');

            if (error) throw error;

            // Count claims per planet
            const planetCounts = {};
            claims?.forEach(claim => {
                const kepid = claim.kepid;
                planetCounts[kepid] = (planetCounts[kepid] || 0) + 1;
            });

            // Sort by count
            const trending = Object.entries(planetCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            if (trending.length === 0) {
                container.innerHTML = '<p class="no-data">No trending planets yet</p>';
                return;
            }

            container.innerHTML = `
                <div class="trending-list">
                    ${trending.map(([kepid, count], index) => {
                        const claim = claims.find(c => c.kepid === parseInt(kepid));
                        const planetName = claim?.planet_data?.pl_name || `KEPID ${kepid}`;
                        return `
                            <div class="trending-item">
                                <span class="trending-rank">#${index + 1}</span>
                                <span class="trending-name">${planetName}</span>
                                <span class="trending-count">${count} claim${count !== 1 ? 's' : ''}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<p class="error">Error loading trending planets</p>';
        }
    }

    async loadPerformanceOverview() {
        const container = document.getElementById('performance-overview');
        if (!container) return;

        try {
            let summary = null;
            if (typeof window.showPerformanceSummary === 'function') {
                summary = window.showPerformanceSummary(5) || {};
            } else {
                summary = {};
                if (window.performanceMonitor && typeof window.performanceMonitor.getMetrics === 'function') {
                    summary.rum = window.performanceMonitor.getMetrics();
                }
                if (window.coreWebVitalsMonitoring && typeof window.coreWebVitalsMonitoring.getMetrics === 'function') {
                    summary.webVitals = window.coreWebVitalsMonitoring.getMetrics();
                }
                summary.budgetBreaches = window.performanceBudgetBreaches || [];
            }

            const rumKeys = summary.rum ? Object.keys(summary.rum) : [];
            const webVitals = summary.webVitals || {};
            const budgetBreaches = summary.budgetBreaches || [];

            const vitalsEntries = Object.entries(webVitals).slice(0, 4);
            const recentBreaches = budgetBreaches.slice(-5).reverse();

            const vitalsHtml = vitalsEntries.length ? vitalsEntries.map(([name, metric]) => {
                const value = metric && typeof metric.value === 'number' ? metric.value.toFixed(2) : 'N/A';
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="opacity:0.8;">${name}</span>
                        <span style="font-weight:bold;color:#ba944f;">${value}</span>
                    </div>
                `;
            }).join('') : '<div class="no-data">No Web Vitals data</div>';

            const breachesHtml = recentBreaches.length ? recentBreaches.map(breach => {
                const time = breach && breach.timestamp ? new Date(breach.timestamp).toLocaleTimeString() : '';
                const metric = breach && breach.metric ? String(breach.metric).toUpperCase() : '';
                const value = breach && typeof breach.value === 'number' ? Math.round(breach.value) : '';
                const budget = breach && typeof breach.budget === 'number' ? Math.round(breach.budget) : '';
                return `
                    <div style="margin-bottom:4px;font-size:0.85rem;">
                        <span style="color:#f87171;font-weight:bold;">${metric}</span>
                        <span> ${value} &gt; ${budget}</span>
                        <span style="opacity:0.7;"> ${time}</span>
                    </div>
                `;
            }).join('') : '<div class="no-data">No recent budget breaches</div>';

            container.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">RUM Metrics</div>
                        <div style="font-size:1.4rem;font-weight:bold;color:#ba944f;">${rumKeys.length}</div>
                        <div style="font-size:0.8rem;opacity:0.7;">Active RUM metric keys</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">Web Vitals Snapshot</div>
                        <div>${vitalsHtml}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">Recent Budget Breaches</div>
                        <div>${breachesHtml}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading performance overview:', error);
            container.innerHTML = '<p class="error">Error loading performance overview</p>';
        }
    }

    async loadAIUsageOverview() {
        const container = document.getElementById('ai-usage-overview');
        if (!container) return;

        try {
            let events = [];
            if (window.aiUsageLogger && typeof window.aiUsageLogger.getRecent === 'function') {
                events = window.aiUsageLogger.getRecent(200);
            } else if (Array.isArray(window.aiUsageEvents)) {
                events = window.aiUsageEvents.slice(-200);
            }

            if (!events.length) {
                container.innerHTML = '<p class="no-data">No AI usage events recorded yet</p>';
                return;
            }

            const byFeature = {};
            const byModel = {};
            let fairnessCount = 0;

            events.forEach(e => {
                const feature = e && e.feature ? e.feature : 'unknown';
                const model = e && e.model ? e.model : 'unknown';
                if (!byFeature[feature]) {
                    byFeature[feature] = 0;
                }
                byFeature[feature] += 1;
                if (!byModel[model]) {
                    byModel[model] = 0;
                }
                byModel[model] += 1;
                if (e && e.context && e.context.fairness) {
                    fairnessCount += 1;
                }
            });

            const totalEvents = events.length;

            const topFeatures = Object.entries(byFeature)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const topModels = Object.entries(byModel)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const featureRows = topFeatures.map(([feature, count]) => {
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:0.9rem;">
                        <span style="opacity:0.8;">${feature}</span>
                        <span style="font-weight:bold;color:#ba944f;">${count}</span>
                    </div>
                `;
            }).join('');

            const modelRows = topModels.map(([model, count]) => {
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:0.9rem;">
                        <span style="opacity:0.8;">${model}</span>
                        <span style="font-weight:bold;color:#ba944f;">${count}</span>
                    </div>
                `;
            }).join('');

            const fairnessRatio = totalEvents > 0 ? (fairnessCount / totalEvents) : 0;

            container.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">AI Usage Events</div>
                        <div style="font-size:1.4rem;font-weight:bold;color:#ba944f;">${totalEvents}</div>
                        <div style="font-size:0.8rem;opacity:0.7;">Events in recent buffer</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">Events With Fairness Metadata</div>
                        <div style="font-size:1.4rem;font-weight:bold;color:#ba944f;">${fairnessCount}</div>
                        <div style="font-size:0.8rem;opacity:0.7;">${(fairnessRatio * 100).toFixed(0)}% of recent events</div>
                    </div>
                </div>
                <div style="margin-top:0.75rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;font-size:0.85rem;">
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">Top Features</div>
                        <div>${featureRows || '<div class="no-data">No feature data</div>'}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">Top Models</div>
                        <div>${modelRows || '<div class="no-data">No model data</div>'}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading AI usage overview:', error);
            container.innerHTML = '<p class="error">Error loading AI usage overview</p>';
        }
    }

    async loadFairnessOverview() {
        const container = document.getElementById('fairness-overview');
        if (!container) return;

        try {
            let events = [];
            if (window.aiUsageLogger && typeof window.aiUsageLogger.getRecent === 'function') {
                events = window.aiUsageLogger.getRecent(200);
            } else if (Array.isArray(window.aiUsageEvents)) {
                events = window.aiUsageEvents.slice(-200);
            }

            const fairnessEvents = events.filter(e => e && e.context && e.context.fairness);
            if (!fairnessEvents.length) {
                container.innerHTML = '<p class="no-data">No fairness data recorded yet</p>';
                return;
            }

            const byFeature = {};
            const bySeverity = {};

            fairnessEvents.forEach(e => {
                const feature = e.feature || 'unknown';
                const fairness = e.context.fairness || {};
                const severity = fairness.severity || 'unknown';

                if (!byFeature[feature]) {
                    byFeature[feature] = { count: 0 };
                }
                byFeature[feature].count += 1;

                if (!bySeverity[severity]) {
                    bySeverity[severity] = 0;
                }
                bySeverity[severity] += 1;
            });

            const featureRows = Object.keys(byFeature).map(feature => {
                const count = byFeature[feature].count;
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:0.9rem;">
                        <span style="opacity:0.8;">${feature}</span>
                        <span style="font-weight:bold;color:#ba944f;">${count}</span>
                    </div>
                `;
            }).join('');

            const severityRows = Object.keys(bySeverity).map(severity => {
                const count = bySeverity[severity];
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:0.9rem;">
                        <span style="opacity:0.8;">${severity}</span>
                        <span style="font-weight:bold;color:#ba944f;">${count}</span>
                    </div>
                `;
            }).join('');

            const recent = fairnessEvents.slice(-10).reverse();
            const recentRows = recent.map(e => {
                const fairness = e.context.fairness || {};
                const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '';
                return `
                    <tr>
                        <td style="padding:2px 4px;">${e.feature || ''}</td>
                        <td style="padding:2px 4px;">${fairness.severity || ''}</td>
                        <td style="padding:2px 4px;">${fairness.overallBias || ''}</td>
                        <td style="padding:2px 4px;">${time}</td>
                    </tr>
                `;
            }).join('');

            const exportButtonHtml = typeof window.exportFairnessMetrics === 'function'
                ? '<button type="button" style="margin-top:0.5rem;padding:0.35rem 0.8rem;border-radius:6px;border:1px solid rgba(186,148,79,0.6);background:rgba(0,0,0,0.6);color:#ba944f;cursor:pointer;font-size:0.8rem;" onclick="window.exportFairnessMetrics()">Export Fairness Metrics (JSON)</button>'
                : '<div style="margin-top:0.5rem;font-size:0.8rem;opacity:0.7;">Fairness export helper not loaded.</div>';

            container.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">By Feature</div>
                        <div>${featureRows}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border-radius:8px;padding:0.75rem;">
                        <div style="font-size:0.9rem;opacity:0.8;margin-bottom:4px;">By Severity</div>
                        <div>${severityRows}</div>
                    </div>
                </div>
                <div style="margin-top:0.75rem;font-size:0.85rem;">
                    <div style="opacity:0.8;margin-bottom:4px;">Recent Fairness Events</div>
                    <div style="max-height:150px;overflow:auto;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.3);">
                        <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                            <thead>
                                <tr style="background:rgba(255,255,255,0.04);">
                                    <th style="text-align:left;padding:2px 4px;">Feature</th>
                                    <th style="text-align:left;padding:2px 4px;">Severity</th>
                                    <th style="text-align:left;padding:2px 4px;">Bias</th>
                                    <th style="text-align:left;padding:2px 4px;">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentRows}
                            </tbody>
                        </table>
                    </div>
                    ${exportButtonHtml}
                </div>
            `;
        } catch (error) {
            console.error('Error loading fairness overview:', error);
            container.innerHTML = '<p class="error">Error loading fairness overview</p>';
        }
    }

    /**
     * Get next reputation level
     */
    getNextLevel(currentPoints) {
        const levels = [
            { name: 'Explorer', minPoints: 500 },
            { name: 'Astronomer', minPoints: 2000 },
            { name: 'Cosmologist', minPoints: 5000 },
            { name: 'Master', minPoints: 10000 }
        ];
        return levels.find(level => currentPoints < level.minPoints) || null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`analytics_dashboard_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize dashboard when DOM is ready
(function () {
    if (typeof window !== 'undefined') {
        window.AnalyticsDashboard = AnalyticsDashboard;
    }

    function initDashboardOnce() {
        if (typeof window === 'undefined') {
            return;
        }

        const dashboard = window.analyticsDashboardInstance || new AnalyticsDashboard();
        window.analyticsDashboardInstance = dashboard;

        if (!dashboard.__initPromise) {
            dashboard.__initPromise = dashboard.init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboardOnce);
    } else {
        initDashboardOnce();
    }
})();

