/**
 * Leaderboard System
 * Displays top users by reputation points
 */

class Leaderboard {
    constructor() {
        this.supabase = window.supabaseClient;
        this.reputationSystem = null;
        this.leaderboardData = [];
        this.currentUserRank = null;
    }

    async init() {
        // Initialize reputation system
        if (window.getReputationSystem) {
            this.reputationSystem = window.getReputationSystem();
            await this.reputationSystem.init();
        } else if (window.ReputationSystem) {
            this.reputationSystem = ReputationSystem.getInstance();
            await this.reputationSystem.init();
        }

        await this.loadLeaderboard();
        await this.loadUserRank();
        this.render();
    }

    /**
     * Load leaderboard data
     */
    async loadLeaderboard() {
        if (!this.reputationSystem) return;

        try {
            this.leaderboardData = await this.reputationSystem.getLeaderboard(100);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.leaderboardData = [];
        }
    }

    /**
     * Load current user's rank
     */
    async loadUserRank() {
        if (!this.reputationSystem) return;

        try {
            this.currentUserRank = await this.reputationSystem.getUserRank();
        } catch (error) {
            console.error('Error loading user rank:', error);
        }
    }

    /**
     * Render leaderboard
     */
    render() {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;

        const currentUserId = this.reputationSystem?.currentUser?.id;

        container.innerHTML = `
            <div class="leaderboard-header">
                <h2>🏆 Leaderboard</h2>
                ${this.currentUserRank ? `<p class="user-rank">Your Rank: #${this.currentUserRank}</p>` : ''}
            </div>
            <div class="leaderboard-filters">
                <button class="filter-btn active" data-filter="all">All Time</button>
                <button class="filter-btn" data-filter="month">This Month</button>
                <button class="filter-btn" data-filter="week">This Week</button>
            </div>
            <div class="leaderboard-list">
                ${this.leaderboardData.length > 0 ? this.leaderboardData.map((user, index) => {
                    const isCurrentUser = user.user_id === currentUserId;
                    const rank = index + 1;
                    const levelInfo = this.getLevelInfo(user.reputation_level);
                    
                    return `
                        <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}" data-rank="${rank}">
                            <div class="rank-badge rank-${rank}">
                                ${rank <= 3 ? this.getRankIcon(rank) : rank}
                            </div>
                            <div class="user-info">
                                <div class="username">${user.username || user.email?.split('@')[0] || 'Anonymous'}</div>
                                <div class="user-stats">
                                    <span class="level-badge" style="color: ${levelInfo.color}">
                                        ${levelInfo.icon} ${levelInfo.name}
                                    </span>
                                </div>
                            </div>
                            <div class="user-stats-details">
                                <div class="stat">
                                    <span class="stat-label">Points</span>
                                    <span class="stat-value">${(user.total_points || 0).toLocaleString()}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Planets</span>
                                    <span class="stat-value">${user.planets_claimed || 0}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Transactions</span>
                                    <span class="stat-value">${user.transactions_completed || 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : '<p class="no-data">No leaderboard data available</p>'}
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Get rank icon for top 3
     */
    getRankIcon(rank) {
        const icons = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };
        return icons[rank] || rank;
    }

    /**
     * Get level info
     */
    getLevelInfo(level) {
        const levels = {
            novice: { name: 'Novice', color: '#888', icon: '🌱' },
            explorer: { name: 'Explorer', color: '#4cd137', icon: '⭐' },
            astronomer: { name: 'Astronomer', color: '#3498db', icon: '🌟' },
            cosmologist: { name: 'Cosmologist', color: '#9b59b6', icon: '🌌' },
            master: { name: 'Master', color: '#f39c12', icon: '👑' }
        };
        return levels[level || 'novice'] || levels.novice;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // TODO: Implement time-based filtering
                this.render();
            });
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('leaderboard-container')) {
            window.leaderboardInstance = new Leaderboard();
            window.leaderboardInstance.init();
        }
    });
} else {
    if (document.getElementById('leaderboard-container')) {
        window.leaderboardInstance = new Leaderboard();
        window.leaderboardInstance.init();
    }
}

// Make available globally
window.Leaderboard = Leaderboard;

