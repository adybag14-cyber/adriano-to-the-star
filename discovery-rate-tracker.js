/**
 * Discovery Rate Tracker
 * Tracks exoplanet discovery rates over time
 */

class DiscoveryRateTracker {
    constructor() {
        this.supabase = window.supabaseClient || null;
        this.discoveryData = [];
        this.init();
    }

    async init() {
        await this.loadDiscoveryData();
    }

    /**
     * Load discovery data from planet claims
     */
    async loadDiscoveryData() {
        try {
            if (!this.supabase) {
                this.supabase = window.supabaseClient || null;
            }

            if (!this.supabase || typeof this.supabase.from !== 'function') {
                this.discoveryData = [];
                return;
            }

            const { data: claims, error } = await this.supabase
                .from('planet_claims')
                .select('kepid, claimed_at, planet_data')
                .eq('status', 'active')
                .order('claimed_at', { ascending: true });

            if (error) throw error;

            // Group by date
            const discoveriesByDate = {};
            claims?.forEach(claim => {
                const date = new Date(claim.claimed_at).toISOString().split('T')[0];
                if (!discoveriesByDate[date]) {
                    discoveriesByDate[date] = [];
                }
                discoveriesByDate[date].push(claim);
            });

            // Convert to array format
            this.discoveryData = Object.entries(discoveriesByDate)
                .map(([date, claims]) => ({
                    date,
                    count: claims.length,
                    claims: claims
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

        } catch (error) {
            console.error('Error loading discovery data:', error);
            this.discoveryData = [];
        }
    }

    /**
     * Get discovery rate statistics
     */
    getDiscoveryRateStats(timeframe = '30d') {
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
            default:
                startDate = new Date(0);
                break;
        }

        const filtered = this.discoveryData.filter(d => new Date(d.date) >= startDate);
        const totalDiscoveries = filtered.reduce((sum, d) => sum + d.count, 0);
        const days = Math.max(1, Math.ceil((now - startDate) / (24 * 60 * 60 * 1000)));
        const dailyAverage = totalDiscoveries / days;

        return {
            total: totalDiscoveries,
            dailyAverage: Math.round(dailyAverage * 100) / 100,
            days: days,
            dataPoints: filtered.length,
            trend: this.calculateTrend(filtered)
        };
    }

    /**
     * Calculate trend (increasing/decreasing/stable)
     */
    calculateTrend(data) {
        if (data.length < 2) return 'stable';

        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));

        const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.1) return 'increasing';
        if (secondAvg < firstAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    /**
     * Get chart data for visualization
     */
    getChartData(timeframe = '30d') {
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
            default:
                startDate = new Date(0);
                break;
        }

        return this.discoveryData
            .filter(d => new Date(d.date) >= startDate)
            .map(d => ({
                date: d.date,
                count: d.count,
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
    }

    /**
     * Load NASA discovery data
     */
    async loadNASADiscoveryData() {
        try {
            if (window.nasaRealtimeUpdates) {
                const nasa = window.nasaRealtimeUpdates();
                if (nasa) {
                    const discoveries = await nasa.fetchLatestDiscoveries(100);
                    // Add to discovery data
                    discoveries.forEach(d => {
                        const date = d.discoveryDate ? new Date(d.discoveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                        const existing = this.discoveryData.find(dd => dd.date === date);
                        if (existing) {
                            existing.count++;
                        } else {
                            this.discoveryData.push({
                                date,
                                count: 1,
                                claims: []
                            });
                        }
                    });
                    this.discoveryData.sort((a, b) => new Date(a.date) - new Date(b.date));
                }
            }
        } catch (error) {
            console.warn('Error loading NASA discovery data:', error);
        }
    }

    /**
     * Display discovery rate dashboard
     */
    displayDashboard(container) {
        if (!container) return;

        const tracker = window.discoveryRateTracker && typeof window.discoveryRateTracker === 'function'
            ? window.discoveryRateTracker()
            : null;

        const stats7d = this.getDiscoveryRateStats('7d');
        const stats30d = this.getDiscoveryRateStats('30d');
        const stats90d = this.getDiscoveryRateStats('90d');
        const chartData = this.getChartData('30d');
        const chart = this.generateChart(chartData);

        container.innerHTML = `
            <div class="discovery-rate-dashboard" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="dashboard-header" style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid rgba(186, 148, 79, 0.3);">
                    <h3 style="color: #ba944f; margin: 0 0 0.5rem 0;">📈 Discovery Rate Tracker</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin: 0;">Track exoplanet discovery rates over time</p>
                </div>

                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">Last 7 Days</div>
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold; margin-bottom: 0.25rem;">${stats7d.total}</div>
                        <div style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">${stats7d.dailyAverage.toFixed(1)}/day</div>
                        <div style="font-size: 0.75rem; color: ${this.getTrendColor(stats7d.trend)}; margin-top: 0.5rem;">${this.getTrendIcon(stats7d.trend)} ${stats7d.trend}</div>
                    </div>
                    <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">Last 30 Days</div>
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold; margin-bottom: 0.25rem;">${stats30d.total}</div>
                        <div style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">${stats30d.dailyAverage.toFixed(1)}/day</div>
                        <div style="font-size: 0.75rem; color: ${this.getTrendColor(stats30d.trend)}; margin-top: 0.5rem;">${this.getTrendIcon(stats30d.trend)} ${stats30d.trend}</div>
                    </div>
                    <div class="stat-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; text-align: center;">
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">Last 90 Days</div>
                        <div style="font-size: 2rem; color: #ba944f; font-weight: bold; margin-bottom: 0.25rem;">${stats90d.total}</div>
                        <div style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">${stats90d.dailyAverage.toFixed(1)}/day</div>
                        <div style="font-size: 0.75rem; color: ${this.getTrendColor(stats90d.trend)}; margin-top: 0.5rem;">${this.getTrendIcon(stats90d.trend)} ${stats90d.trend}</div>
                    </div>
                </div>

                <div class="chart-container" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">📊 Discovery Rate Over Time (30 Days)</h4>
                    <div class="discovery-chart">${chart}</div>
                </div>

                <div class="dashboard-actions" style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="(window.discoveryRateTracker && window.discoveryRateTracker())?.loadNASADiscoveryData().then(() => (window.discoveryRateTracker && window.discoveryRateTracker())?.displayDashboard(document.getElementById('discovery-rate-container')))" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔄 Sync with NASA
                    </button>
                    <button onclick="(window.discoveryRateTracker && window.discoveryRateTracker())?.refresh()" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔄 Refresh
                    </button>
                    <button onclick="(window.discoveryRateTracker && window.discoveryRateTracker())?.exportData()" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        📥 Export
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate chart visualization
     */
    generateChart(data) {
        if (data.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5); text-align: center; padding: 2rem;">No discovery data available</p>';
        }

        const maxCount = Math.max(...data.map(d => d.count), 1);
        const bars = data.map(d => {
            const height = (d.count / maxCount) * 100;
            return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                    <div style="width: 100%; height: 150px; display: flex; align-items: flex-end;">
                        <div style="width: 100%; height: ${height}%; background: linear-gradient(to top, rgba(186, 148, 79, 0.6), rgba(186, 148, 79, 0.3)); border-radius: 4px 4px 0 0; min-height: ${d.count > 0 ? '4px' : '0'};" title="${d.count} discoveries on ${d.label}"></div>
                    </div>
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); writing-mode: vertical-rl; text-orientation: mixed;">${d.label}</span>
                </div>
            `;
        }).join('');

        return `<div style="display: flex; gap: 0.5rem; align-items: flex-end; height: 200px; overflow-x: auto;">${bars}</div>`;
    }

    /**
     * Get trend color
     */
    getTrendColor(trend) {
        const colors = {
            'increasing': '#4ade80',
            'decreasing': '#ef4444',
            'stable': '#fbbf24'
        };
        return colors[trend] || '#ba944f';
    }

    /**
     * Get trend icon
     */
    getTrendIcon(trend) {
        const icons = {
            'increasing': '📈',
            'decreasing': '📉',
            'stable': '➡️'
        };
        return icons[trend] || '➡️';
    }

    /**
     * Refresh dashboard
     */
    async refresh() {
        await this.loadDiscoveryData();
        await this.loadNASADiscoveryData();
        const container = document.getElementById('discovery-rate-container');
        if (container) {
            this.displayDashboard(container);
        }
    }

    /**
     * Export data
     */
    exportData() {
        const data = {
            discoveryData: this.discoveryData,
            stats7d: this.getDiscoveryRateStats('7d'),
            stats30d: this.getDiscoveryRateStats('30d'),
            stats90d: this.getDiscoveryRateStats('90d'),
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discovery-rate-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize globally
let discoveryRateTrackerInstance = null;

function initDiscoveryRateTracker() {
    if (!discoveryRateTrackerInstance) {
        discoveryRateTrackerInstance = new DiscoveryRateTracker();
    }
    return discoveryRateTrackerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiscoveryRateTracker);
} else {
    initDiscoveryRateTracker();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscoveryRateTracker;
}

// Make available globally
window.DiscoveryRateTracker = DiscoveryRateTracker;
window.discoveryRateTracker = () => discoveryRateTrackerInstance;

