/**
 * Badges & Achievements Page
 */

class BadgesPage {
    constructor() {
        this.supabase = window.supabaseClient;
        this.reputationSystem = null;
        this.allBadges = [];
        this.userBadges = [];
    }

    async init() {
        // Use singleton reputation system
        if (window.getReputationSystem) {
            this.reputationSystem = window.getReputationSystem();
        } else if (window.ReputationSystem) {
            this.reputationSystem = ReputationSystem.getInstance();
        } else {
            this.reputationSystem = new ReputationSystem();
        }
        await this.reputationSystem.init();

        await this.loadAllBadges();
        await this.loadUserBadges();
        this.renderReputation();
        this.renderBadges();
        this.trackEvent('badges_page_initialized');
    }

    /**
     * Load all available badges
     */
    async loadAllBadges() {
        try {
            const { data, error } = await this.supabase
                .from('badges_catalog')
                .select('*')
                .order('category', { ascending: true })
                .order('points_reward', { ascending: false });

            if (error) throw error;
            this.allBadges = data || [];
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    }

    /**
     * Load user's earned badges
     */
    async loadUserBadges() {
        if (!this.reputationSystem.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', this.reputationSystem.currentUser.id);

            if (error) throw error;
            this.userBadges = (data || []).map(b => b.badge_id);
        } catch (error) {
            console.error('Error loading user badges:', error);
        }
    }

    /**
     * Render reputation summary
     */
    renderReputation() {
        const container = document.getElementById('reputation-summary');
        if (!container) return;

        const reputation = this.reputationSystem.reputation;
        if (!reputation) {
            container.innerHTML = '<p>Please login to view your reputation</p>';
            return;
        }

        const levelInfo = this.reputationSystem.getReputationLevelInfo();
        const nextLevel = this.getNextLevel(reputation.total_points);

        container.innerHTML = `
            <div class="reputation-card">
                <div class="reputation-header">
                    <h2>Your Reputation</h2>
                    <div class="reputation-level ${reputation.reputation_level}">
                        <span class="level-icon">${this.getLevelIcon(reputation.reputation_level)}</span>
                        <span class="level-name">${levelInfo.name}</span>
                    </div>
                </div>
                <div class="reputation-stats">
                    <div class="stat-item">
                        <div class="stat-value">${reputation.total_points.toLocaleString()}</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reputation.planets_claimed || 0}</div>
                        <div class="stat-label">Planets Claimed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reputation.transactions_completed || 0}</div>
                        <div class="stat-label">Transactions</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.userBadges.length}</div>
                        <div class="stat-label">Badges Earned</div>
                    </div>
                </div>
                ${nextLevel ? `
                    <div class="progress-bar">
                        <div class="progress-label">
                            <span>Progress to ${nextLevel.name}</span>
                            <span>${reputation.total_points} / ${nextLevel.minPoints} points</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${Math.min(100, (reputation.total_points / nextLevel.minPoints) * 100)}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render all badges
     */
    renderBadges() {
        const container = document.getElementById('badges-container');
        if (!container) return;

        // Group badges by category
        const grouped = this.allBadges.reduce((acc, badge) => {
            if (!acc[badge.category]) acc[badge.category] = [];
            acc[badge.category].push(badge);
            return acc;
        }, {});

        const categories = {
            claim: 'Planet Claims',
            marketplace: 'Marketplace',
            social: 'Social',
            milestone: 'Milestones',
            special: 'Special'
        };

        // Add leaderboard link if available
        const leaderboardLink = window.Leaderboard ? `
            <div class="badges-header-actions">
                <a href="leaderboard.html" class="leaderboard-link">🏆 View Leaderboard</a>
            </div>
        ` : '';

        container.innerHTML = leaderboardLink + Object.entries(grouped).map(([category, badges]) => `
            <div class="badges-category">
                <h3>${categories[category] || category}</h3>
                <div class="badges-grid">
                    ${badges.map(badge => this.renderBadgeCard(badge)).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render a single badge card
     */
    renderBadgeCard(badge) {
        const isEarned = this.userBadges.includes(badge.badge_id);
        const rarityClass = badge.rarity || 'common';

        return `
            <div class="badge-card ${isEarned ? 'earned' : 'locked'} ${rarityClass}" data-badge-id="${badge.badge_id}" data-earned="${isEarned}">
                <div class="badge-icon">${badge.icon || '🏆'}</div>
                <div class="badge-info">
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description || ''}</div>
                    ${badge.points_reward > 0 ? `<div class="badge-points">+${badge.points_reward} pts</div>` : ''}
                    <div class="badge-rarity ${rarityClass}">${badge.rarity}</div>
                </div>
                ${isEarned ? '<div class="badge-checkmark">✓</div>' : '<div class="badge-lock">🔒</div>'}
            </div>
        `;
    }

    /**
     * Show badge unlock animation
     */
    showBadgeUnlockAnimation(badgeId) {
        const badgeCard = document.querySelector(`[data-badge-id="${badgeId}"]`);
        if (!badgeCard) return;

        // Create unlock animation overlay
        const overlay = document.createElement('div');
        overlay.className = 'badge-unlock-overlay';
        overlay.innerHTML = `
            <div class="badge-unlock-content">
                <div class="badge-unlock-icon">🎉</div>
                <div class="badge-unlock-title">Badge Unlocked!</div>
                <div class="badge-unlock-name">${badgeCard.querySelector('.badge-name')?.textContent || 'New Badge'}</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // Update badge card
        badgeCard.classList.remove('locked');
        badgeCard.classList.add('earned');
        badgeCard.setAttribute('data-earned', 'true');
        const lockIcon = badgeCard.querySelector('.badge-lock');
        if (lockIcon) {
            lockIcon.outerHTML = '<div class="badge-checkmark">✓</div>';
        }

        // Remove overlay after animation
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 500);
        }, 3000);

        // Add sparkle effect to badge
        this.addSparkleEffect(badgeCard);
    }

    /**
     * Add sparkle effect to badge card
     */
    addSparkleEffect(badgeCard) {
        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'badge-sparkle';
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #ba944f;
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: sparkle 1s ease-out forwards;
                animation-delay: ${Math.random() * 0.5}s;
            `;
            badgeCard.style.position = 'relative';
            badgeCard.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 1000);
        }
    }

    /**
     * Get level icon
     */
    getLevelIcon(level) {
        const icons = {
            novice: '🌱',
            explorer: '⭐',
            astronomer: '🌟',
            cosmologist: '🌌',
            master: '👑'
        };
        return icons[level] || '🌱';
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
                window.performanceMonitoring.recordMetric(`badges_page_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize page when DOM is ready
(function () {
    let page;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            page = new BadgesPage();
            window.badgesPageInstance = page;
            page.init();
        });
    } else {
        page = new BadgesPage();
        window.badgesPageInstance = page;
        page.init();
    }
})();

