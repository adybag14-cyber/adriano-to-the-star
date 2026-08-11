/**
 * Badges System Enhancements
 * Adds: More categories, seasonal badges, progress tracking
 */

class BadgesEnhancements {
    constructor(badgesPage) {
        this.badgesPage = badgesPage;
        this.supabase = badgesPage.supabase;
        this.reputationSystem = badgesPage.reputationSystem;
        this.seasonalBadges = [];
        this.progressTrackers = new Map();
    }

    async init() {
        await this.loadSeasonalBadges();
        await this.setupProgressTracking();
        this.renderProgressTrackers();
        this.trackEvent('badges_enhance_initialized');
    }

    /**
     * Load seasonal badges
     */
    async loadSeasonalBadges() {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; // 1-12
        const day = currentDate.getDate();

        // Define seasonal badges
        const seasonal = [
            {
                badge_id: 'new_year_2025',
                name: 'New Year Explorer',
                description: 'Active during January 2025',
                icon: '🎆',
                category: 'seasonal',
                available: month === 1,
                points_reward: 50
            },
            {
                badge_id: 'valentines_2025',
                name: 'Cosmic Valentine',
                description: 'Active during February 2025',
                icon: '💝',
                category: 'seasonal',
                available: month === 2,
                points_reward: 30
            },
            {
                badge_id: 'spring_2025',
                name: 'Spring Explorer',
                description: 'Active during March-May 2025',
                icon: '🌸',
                category: 'seasonal',
                available: month >= 3 && month <= 5,
                points_reward: 40
            },
            {
                badge_id: 'summer_2025',
                name: 'Summer Astronaut',
                description: 'Active during June-August 2025',
                icon: '☀️',
                category: 'seasonal',
                available: month >= 6 && month <= 8,
                points_reward: 40
            },
            {
                badge_id: 'autumn_2025',
                name: 'Autumn Stargazer',
                description: 'Active during September-November 2025',
                icon: '🍂',
                category: 'seasonal',
                available: month >= 9 && month <= 11,
                points_reward: 40
            },
            {
                badge_id: 'winter_2025',
                name: 'Winter Explorer',
                description: 'Active during December 2025',
                icon: '❄️',
                category: 'seasonal',
                available: month === 12,
                points_reward: 40
            }
        ];

        this.seasonalBadges = seasonal.filter(b => b.available);

        // Check if user should unlock seasonal badges
        if (this.reputationSystem && this.reputationSystem.currentUser) {
            for (const badge of this.seasonalBadges) {
                await this.checkSeasonalBadge(badge);
            }
        }
    }

    /**
     * Check and unlock seasonal badge
     */
    async checkSeasonalBadge(badge) {
        if (!this.reputationSystem || !this.reputationSystem.currentUser) return;

        // Check if user has any activity this season
        const hasActivity = this.reputationSystem.reputation?.last_activity;
        if (!hasActivity) return;

        const lastActivity = new Date(hasActivity);
        const now = new Date();
        const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);

        // If user was active in the last 7 days during the season, unlock badge
        if (daysSinceActivity <= 7 && badge.available) {
            await this.reputationSystem.unlockBadge(badge.badge_id);
        }
    }

    /**
     * Setup progress tracking for badges
     */
    async setupProgressTracking() {
        if (!this.reputationSystem || !this.reputationSystem.reputation) return;

        const reputation = this.reputationSystem.reputation;

        // Track progress for various badge categories
        this.progressTrackers.set('planets_claimed', {
            current: reputation.planets_claimed || 0,
            milestones: [1, 5, 10, 25, 50, 100, 250, 500],
            badgeIds: ['first_claim', 'five_claims', 'ten_claims', 'twenty_five_claims', 'fifty_claims', 'hundred_claims', 'two_fifty_claims', 'five_hundred_claims']
        });

        this.progressTrackers.set('messages_sent', {
            current: reputation.messages_sent || 0,
            milestones: [1, 10, 50, 100, 500, 1000],
            badgeIds: ['first_message', 'ten_messages', 'fifty_messages', 'hundred_messages', 'five_hundred_messages', 'thousand_messages']
        });

        this.progressTrackers.set('transactions_completed', {
            current: reputation.transactions_completed || 0,
            milestones: [1, 5, 10, 25, 50, 100],
            badgeIds: ['first_sale', 'five_sales', 'ten_sales', 'twenty_five_sales', 'fifty_sales', 'hundred_sales']
        });

        this.progressTrackers.set('total_points', {
            current: reputation.total_points || 0,
            milestones: [100, 500, 1000, 2500, 5000, 10000, 25000, 50000],
            badgeIds: ['points_100', 'points_500', 'points_1000', 'points_2500', 'points_5000', 'points_10000', 'points_25000', 'points_50000']
        });
    }

    /**
     * Render progress trackers
     */
    renderProgressTrackers() {
        const container = document.getElementById('badge-progress-trackers');
        if (!container) {
            // Create container if it doesn't exist
            const badgesContainer = document.getElementById('badges-container');
            if (badgesContainer) {
                const newContainer = document.createElement('div');
                newContainer.id = 'badge-progress-trackers';
                newContainer.className = 'badge-progress-section';
                badgesContainer.insertBefore(newContainer, badgesContainer.firstChild);
                this.renderProgressTrackers();
                return;
            }
            return;
        }

        container.innerHTML = `
            <h3 style="color: #ba944f; margin-bottom: 1.5rem; font-family: 'Cormorant Garamond', serif;">📈 Badge Progress</h3>
            ${Array.from(this.progressTrackers.entries()).map(([category, tracker]) => {
                const nextMilestone = tracker.milestones.find(m => m > tracker.current);
                const progress = nextMilestone 
                    ? (tracker.current / nextMilestone) * 100 
                    : 100;
                const categoryName = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

                return `
                    <div class="progress-tracker-card">
                        <div class="progress-header">
                            <span class="progress-category">${categoryName}</span>
                            <span class="progress-current">${tracker.current} / ${nextMilestone || 'Max'}</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${Math.min(100, progress)}%"></div>
                        </div>
                        ${nextMilestone ? `
                            <div class="progress-next">
                                Next badge at ${nextMilestone} ${categoryName.toLowerCase()}
                            </div>
                        ` : '<div class="progress-complete">✅ All milestones reached!</div>'}
                    </div>
                `;
            }).join('')}
        `;
    }

    /**
     * Get badge categories
     */
    getBadgeCategories() {
        return {
            claim: 'Planet Claims',
            marketplace: 'Marketplace',
            social: 'Social',
            milestone: 'Milestones',
            special: 'Special',
            seasonal: 'Seasonal',
            achievement: 'Achievements',
            exploration: 'Exploration',
            community: 'Community'
        };
    }

    /**
     * Add new badge categories
     */
    async addBadgeCategory(categoryName, description) {
        if (!this.supabase) return;

        try {
            // Add to badges_catalog with new category
            // This would require database schema update
            console.log(`New category: ${categoryName} - ${description}`);
        } catch (error) {
            console.error('Error adding badge category:', error);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`badges_enhance_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.BadgesEnhancements = BadgesEnhancements;
}

