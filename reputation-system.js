/**
 * User Reputation System
 * Tracks points, ratings, and achievements
 * Uses singleton pattern to ensure single instance
 */

class ReputationSystem {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.reputation = null;
        this.badges = [];
        this.initialized = false;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ReputationSystem.instance) {
            ReputationSystem.instance = new ReputationSystem();
        }
        return ReputationSystem.instance;
    }

    async init() {
        if (this.initialized && this.currentUser) {
            return; // Already initialized
        }

        if (!this.supabase) {
            this.supabase = window.supabaseClient;
        }

        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        
        if (this.currentUser) {
            await this.loadReputation();
            await this.loadBadges();
            this.initialized = true;
        }
    }

    /**
     * Load user reputation
     */
    async loadReputation() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('user_reputation')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

            if (!data) {
                // Create reputation record if it doesn't exist
                await this.createReputationRecord();
                return;
            }

            this.reputation = data;
        } catch (error) {
            console.error('Error loading reputation:', error);
        }
    }

    /**
     * Create reputation record for new user
     */
    async createReputationRecord() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('user_reputation')
                .insert({
                    user_id: this.currentUser.id,
                    username: this.currentUser.user_metadata?.username || this.currentUser.email,
                    email: this.currentUser.email,
                    total_points: 0,
                    reputation_level: 'novice'
                })
                .select()
                .single();

            if (error) throw error;
            this.reputation = data;
        } catch (error) {
            console.error('Error creating reputation record:', error);
        }
    }

    /**
     * Add points to user
     */
    async addPoints(points, reason = '') {
        if (!this.currentUser || !this.reputation) {
            await this.init();
            if (!this.reputation) return;
        }

        try {
            const newPoints = this.reputation.total_points + points;
            const { data, error } = await this.supabase
                .from('user_reputation')
                .update({
                    total_points: newPoints,
                    last_activity: new Date().toISOString()
                })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            this.reputation = data;

            // Update reputation level
            await this.updateReputationLevel();

            // Check for badge unlocks
            await this.checkBadgeUnlocks();

            return data;
        } catch (error) {
            console.error('Error adding points:', error);
        }
    }

    /**
     * Update activity counter
     */
    async updateActivity(activityType, increment = 1) {
        if (!this.currentUser || !this.reputation) {
            await this.init();
            if (!this.reputation) return;
        }

        const updates = {
            last_activity: new Date().toISOString()
        };

        switch (activityType) {
            case 'planet_claimed':
                updates.planets_claimed = (this.reputation.planets_claimed || 0) + increment;
                await this.addPoints(10, 'Planet claimed');
                break;
            case 'listing_created':
                updates.listings_created = (this.reputation.listings_created || 0) + increment;
                await this.addPoints(5, 'Listing created');
                break;
            case 'transaction_completed':
                updates.transactions_completed = (this.reputation.transactions_completed || 0) + increment;
                await this.addPoints(20, 'Transaction completed');
                break;
            case 'message_sent':
                updates.messages_sent = (this.reputation.messages_sent || 0) + increment;
                await this.addPoints(1, 'Message sent');
                break;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_reputation')
                .update(updates)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            this.reputation = data;

            // Check for badge unlocks
            await this.checkBadgeUnlocks();

            return data;
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    }

    /**
     * Load user badges
     */
    async loadBadges() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('user_badges')
                .select(`
                    *,
                    badge:badges_catalog(*)
                `)
                .eq('user_id', this.currentUser.id)
                .order('earned_at', { ascending: false });

            if (error) throw error;
            this.badges = data || [];
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    }

    /**
     * Check and unlock badges based on current stats
     */
    async checkBadgeUnlocks() {
        if (!this.currentUser || !this.reputation) return;

        const stats = {
            planets_claimed: this.reputation.planets_claimed || 0,
            listings_created: this.reputation.listings_created || 0,
            transactions_completed: this.reputation.transactions_completed || 0,
            messages_sent: this.reputation.messages_sent || 0,
            total_points: this.reputation.total_points || 0
        };

        // Check claim badges
        if (stats.planets_claimed >= 1) await this.unlockBadge('first_claim');
        if (stats.planets_claimed >= 5) await this.unlockBadge('five_claims');
        if (stats.planets_claimed >= 10) await this.unlockBadge('ten_claims');
        if (stats.planets_claimed >= 50) await this.unlockBadge('fifty_claims');
        if (stats.planets_claimed >= 100) await this.unlockBadge('hundred_claims');

        // Check marketplace badges
        if (stats.transactions_completed >= 1) await this.unlockBadge('first_sale');
        if (stats.transactions_completed >= 5) await this.unlockBadge('five_sales');
        if (stats.transactions_completed >= 10) await this.unlockBadge('ten_sales');

        // Check social badges
        if (stats.messages_sent >= 1) await this.unlockBadge('first_message');
        if (stats.messages_sent >= 100) await this.unlockBadge('hundred_messages');

        // Check points badges
        if (stats.total_points >= 100) await this.unlockBadge('points_100');
        if (stats.total_points >= 500) await this.unlockBadge('points_500');
        if (stats.total_points >= 1000) await this.unlockBadge('points_1000');
        if (stats.total_points >= 5000) await this.unlockBadge('points_5000');
        if (stats.total_points >= 10000) await this.unlockBadge('points_10000');
    }

    /**
     * Unlock a badge for the user
     */
    async unlockBadge(badgeId) {
        if (!this.currentUser) return;

        // Check if already unlocked
        const hasBadge = this.badges.some(b => b.badge_id === badgeId);
        if (hasBadge) return;

        try {
            const { data, error } = await this.supabase
                .from('user_badges')
                .insert({
                    user_id: this.currentUser.id,
                    badge_id: badgeId
                })
                .select(`
                    *,
                    badge:badges_catalog(*)
                `)
                .single();

            if (error) {
                if (error.code === '23505') return; // Already exists (race condition)
                throw error;
            }

            // Add badge to local array
            this.badges.push(data);

            // Add points reward if any
            if (data.badge && data.badge.points_reward > 0) {
                await this.addPoints(data.badge.points_reward, `Badge unlocked: ${data.badge.name}`);
            }

            // Show notification
            this.showBadgeNotification(data.badge);

            // Trigger full-screen unlock animation if badges page is loaded
            if (window.badgesPageInstance && typeof window.badgesPageInstance.showBadgeUnlockAnimation === 'function') {
                window.badgesPageInstance.showBadgeUnlockAnimation(badgeId);
            }

            return data;
        } catch (error) {
            console.error('Error unlocking badge:', error);
        }
    }

    /**
     * Show badge unlock notification
     */
    showBadgeNotification(badge) {
        if (!badge) return;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="badge-notification-content">
                <div class="badge-icon">${badge.icon || '🏆'}</div>
                <div class="badge-info">
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description || ''}</div>
                    ${badge.points_reward > 0 ? `<div class="badge-points">+${badge.points_reward} points</div>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Get reputation level info
     */
    getReputationLevelInfo() {
        const levels = {
            novice: { name: 'Novice', color: '#888', minPoints: 0 },
            explorer: { name: 'Explorer', color: '#4cd137', minPoints: 500 },
            astronomer: { name: 'Astronomer', color: '#3498db', minPoints: 2000 },
            cosmologist: { name: 'Cosmologist', color: '#9b59b6', minPoints: 5000 },
            master: { name: 'Master', color: '#f39c12', minPoints: 10000 }
        };

        return levels[this.reputation?.reputation_level || 'novice'] || levels.novice;
    }

    /**
     * Update reputation level based on points
     */
    async updateReputationLevel() {
        if (!this.reputation) return;

        const points = this.reputation.total_points || 0;
        let newLevel = 'novice';

        if (points >= 10000) newLevel = 'master';
        else if (points >= 5000) newLevel = 'cosmologist';
        else if (points >= 2000) newLevel = 'astronomer';
        else if (points >= 500) newLevel = 'explorer';

        if (this.reputation.reputation_level !== newLevel) {
            try {
                const { data, error } = await this.supabase
                    .from('user_reputation')
                    .update({ reputation_level: newLevel })
                    .eq('user_id', this.currentUser.id)
                    .select()
                    .single();

                if (!error && data) {
                    this.reputation = data;
                }
            } catch (error) {
                console.error('Error updating reputation level:', error);
            }
        }
    }

    /**
     * Get leaderboard (top users by points)
     */
    async getLeaderboard(limit = 100) {
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('user_reputation')
                .select('user_id, username, email, total_points, reputation_level, planets_claimed, transactions_completed')
                .order('total_points', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            return [];
        }
    }

    /**
     * Get user's rank
     */
    async getUserRank() {
        if (!this.currentUser || !this.reputation) return null;

        try {
            const { data, error } = await this.supabase
                .from('user_reputation')
                .select('user_id')
                .gt('total_points', this.reputation.total_points || 0);

            if (error) throw error;
            return (data?.length || 0) + 1; // Rank is number of users above + 1
        } catch (error) {
            console.error('Error getting user rank:', error);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReputationSystem;
}

// Make available globally with singleton accessor
window.ReputationSystem = ReputationSystem;
window.getReputationSystem = () => ReputationSystem.getInstance();

