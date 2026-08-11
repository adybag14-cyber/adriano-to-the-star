/**
 * Planet Claim Statistics Dashboard
 * Shows: Claim trends, popular planets, claim analytics
 */

class PlanetStatisticsDashboard {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.stats = null;
    }

    async init() {
        if (window.authManager) {
            this.currentUser = window.authManager.getCurrentUser();
        }

        await this.loadStatistics();
        this.render();
    }

    /**
     * Load statistics from database
     */
    async loadStatistics() {
        try {
            // Get all claims
            const { data: claims, error: claimsError } = await this.supabase
                .from('planet_claims')
                .select('*');

            if (claimsError) throw claimsError;

            // Calculate statistics
            this.stats = {
                total_claims: claims.length,
                unique_planets: new Set(claims.map(c => c.kepid)).size,
                unique_users: new Set(claims.map(c => c.user_id)).size,
                claims_by_month: this.groupByMonth(claims),
                popular_planets: this.getPopularPlanets(claims),
                claims_by_user: this.getClaimsByUser(claims),
                recent_claims: claims
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10)
            };

        } catch (error) {
            console.error('Error loading statistics:', error);
            this.stats = this.getDefaultStats();
        }
    }

    /**
     * Group claims by month
     */
    groupByMonth(claims) {
        const grouped = {};
        claims.forEach(claim => {
            const date = new Date(claim.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[monthKey]) {
                grouped[monthKey] = 0;
            }
            grouped[monthKey]++;
        });
        return grouped;
    }

    /**
     * Get popular planets (most claimed)
     */
    getPopularPlanets(claims) {
        const planetCounts = {};
        claims.forEach(claim => {
            const kepid = claim.kepid;
            if (!planetCounts[kepid]) {
                planetCounts[kepid] = {
                    kepid: kepid,
                    count: 0,
                    planet_name: claim.planet_name || `Kepler-${kepid}`
                };
            }
            planetCounts[kepid].count++;
        });

        return Object.values(planetCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Get claims by user
     */
    getClaimsByUser(claims) {
        const userCounts = {};
        claims.forEach(claim => {
            const userId = claim.user_id;
            if (!userCounts[userId]) {
                userCounts[userId] = 0;
            }
            userCounts[userId]++;
        });

        return Object.entries(userCounts)
            .map(([userId, count]) => ({ user_id: userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Get default stats (fallback)
     */
    getDefaultStats() {
        return {
            total_claims: 0,
            unique_planets: 0,
            unique_users: 0,
            claims_by_month: {},
            popular_planets: [],
            claims_by_user: [],
            recent_claims: []
        };
    }

    /**
     * Render dashboard
     */
    render() {
        const container = document.getElementById('planet-statistics-dashboard');
        if (!container) {
            // Create container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = 'planet-statistics-dashboard';
            document.body.appendChild(newContainer);
            this.renderContent(newContainer);
        } else {
            this.renderContent(container);
        }
    }

    /**
     * Render dashboard content
     */
    renderContent(container) {
        if (!this.stats) {
            container.innerHTML = '<p>Loading statistics...</p>';
            return;
        }

        const monthlyData = Object.entries(this.stats.claims_by_month)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-12); // Last 12 months

        container.innerHTML = `
            <div class="statistics-dashboard">
                <h2>📊 Planet Claim Statistics</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.total_claims.toLocaleString()}</div>
                        <div class="stat-label">Total Claims</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.unique_planets.toLocaleString()}</div>
                        <div class="stat-label">Unique Planets</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.unique_users.toLocaleString()}</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>📈 Claim Trends (Last 12 Months)</h3>
                    <div class="chart-container">
                        <canvas id="claims-chart" width="800" height="300"></canvas>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>⭐ Most Popular Planets</h3>
                    <div class="popular-planets">
                        ${this.stats.popular_planets.map((planet, index) => `
                            <div class="popular-planet-item">
                                <span class="rank">${index + 1}.</span>
                                <span class="planet-name">${planet.planet_name}</span>
                                <span class="claim-count">${planet.count} claims</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section">
                    <h3>👥 Top Claimers</h3>
                    <div class="top-claimers">
                        ${this.stats.claims_by_user.map((user, index) => `
                            <div class="claimer-item">
                                <span class="rank">${index + 1}.</span>
                                <span class="user-id">User ${user.user_id.substring(0, 8)}...</span>
                                <span class="claim-count">${user.count} planets</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section">
                    <h3>🕒 Recent Claims</h3>
                    <div class="recent-claims">
                        ${this.stats.recent_claims.map(claim => `
                            <div class="recent-claim-item">
                                <span class="planet-name">${claim.planet_name || `Kepler-${claim.kepid}`}</span>
                                <span class="claim-date">${new Date(claim.created_at).toLocaleDateString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Render chart
        this.renderChart(monthlyData);
    }

    /**
     * Render chart using canvas
     */
    renderChart(monthlyData) {
        const canvas = document.getElementById('claims-chart');
        if (!canvas || monthlyData.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find max value
        const maxValue = Math.max(...monthlyData.map(([, count]) => count));

        // Draw axes
        ctx.strokeStyle = '#ba944f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw bars
        const barWidth = chartWidth / monthlyData.length;
        monthlyData.forEach(([month, count], index) => {
            const barHeight = (count / maxValue) * chartHeight;
            const x = padding + index * barWidth;
            const y = height - padding - barHeight;

            // Draw bar
            ctx.fillStyle = '#ba944f';
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Raleway';
            ctx.textAlign = 'center';
            ctx.fillText(count, x + barWidth / 2, y - 5);

            // Draw month label
            ctx.fillStyle = '#ba944f';
            ctx.font = '9px Raleway';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(month.substring(5), 0, 0);
            ctx.restore();
        });
    }
}

// Auto-initialize if container exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('planet-statistics-dashboard')) {
            const dashboard = new PlanetStatisticsDashboard();
            dashboard.init();
        }
    });
} else {
    if (document.getElementById('planet-statistics-dashboard')) {
        const dashboard = new PlanetStatisticsDashboard();
        dashboard.init();
    }
}

// Export
if (typeof window !== 'undefined') {
    window.PlanetStatisticsDashboard = PlanetStatisticsDashboard;
}

