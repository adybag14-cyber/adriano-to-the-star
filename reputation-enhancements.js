/**
 * Reputation System Enhancements
 * Adds: Daily login streaks, weekly/monthly leaderboards, activity history
 */

class ReputationEnhancements {
    constructor(reputationSystem) {
        this.reputationSystem = reputationSystem;
        this.supabase = reputationSystem.supabase;
        this.currentUser = reputationSystem.currentUser;
    }

    /**
     * Track daily login streak
     */
    async trackDailyLogin() {
        if (!this.currentUser) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = localStorage.getItem(`last_login_${this.currentUser.id}`);
            
            // Check if already logged in today
            if (lastLogin === today) {
                return; // Already counted today
            }

            // Get current streak
            const streakData = await this.getLoginStreak();
            let currentStreak = streakData.current_streak || 0;
            const lastLoginDate = streakData.last_login_date;

            // Calculate new streak
            if (lastLoginDate) {
                const lastDate = new Date(lastLoginDate);
                const todayDate = new Date(today);
                const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

                if (daysDiff === 1) {
                    // Consecutive day - increment streak
                    currentStreak += 1;
                } else if (daysDiff > 1) {
                    // Streak broken - reset to 1
                    currentStreak = 1;
                } else {
                    // Same day - don't increment
                    return;
                }
            } else {
                // First login
                currentStreak = 1;
            }

            // Update streak in database
            const { data, error } = await this.supabase
                .from('user_reputation')
                .update({
                    login_streak: currentStreak,
                    last_login_date: today,
                    longest_streak: Math.max(currentStreak, streakData.longest_streak || 0)
                })
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            // Award points for streaks
            if (currentStreak % 7 === 0) {
                // Weekly milestone
                await this.reputationSystem.addPoints(50, `7-day login streak!`);
            } else if (currentStreak % 30 === 0) {
                // Monthly milestone
                await this.reputationSystem.addPoints(200, `30-day login streak!`);
            } else if (currentStreak > 0) {
                // Daily login bonus
                await this.reputationSystem.addPoints(1, 'Daily login');
            }

            // Save to localStorage
            localStorage.setItem(`last_login_${this.currentUser.id}`, today);

            // Update reputation object
            if (this.reputationSystem.reputation) {
                this.reputationSystem.reputation.login_streak = currentStreak;
                this.reputationSystem.reputation.last_login_date = today;
            }

            return { current_streak: currentStreak, last_login_date: today };
        } catch (error) {
            console.error('Error tracking daily login:', error);
        }
    }

    /**
     * Get login streak data
     */
    async getLoginStreak() {
        if (!this.currentUser) return { current_streak: 0, longest_streak: 0 };

        try {
            const { data, error } = await this.supabase
                .from('user_reputation')
                .select('login_streak, longest_streak, last_login_date')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data || { current_streak: 0, longest_streak: 0, last_login_date: null };
        } catch (error) {
            console.error('Error getting login streak:', error);
            return { current_streak: 0, longest_streak: 0 };
        }
    }

    /**
     * Get weekly leaderboard
     */
    async getWeeklyLeaderboard(limit = 10) {
        try {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
            weekStart.setHours(0, 0, 0, 0);

            const { data, error } = await this.supabase
                .from('user_reputation')
                .select('*')
                .gte('last_activity', weekStart.toISOString())
                .order('total_points', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting weekly leaderboard:', error);
            return [];
        }
    }

    /**
     * Get monthly leaderboard
     */
    async getMonthlyLeaderboard(limit = 10) {
        try {
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const { data, error } = await this.supabase
                .from('user_reputation')
                .select('*')
                .gte('last_activity', monthStart.toISOString())
                .order('total_points', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting monthly leaderboard:', error);
            return [];
        }
    }

    /**
     * Add activity to history
     */
    async addActivityHistory(activityType, description, points = 0) {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('activity_history')
                .insert({
                    user_id: this.currentUser.id,
                    activity_type: activityType,
                    description: description,
                    points_earned: points,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Keep only last 100 activities per user
            await this.cleanupActivityHistory();

            return data;
        } catch (error) {
            console.error('Error adding activity history:', error);
        }
    }

    /**
     * Get activity history
     */
    async getActivityHistory(limit = 50) {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await this.supabase
                .from('activity_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting activity history:', error);
            return [];
        }
    }

    /**
     * Cleanup old activity history (keep last 100)
     */
    async cleanupActivityHistory() {
        if (!this.currentUser) return;

        try {
            // Get count
            const { count } = await this.supabase
                .from('activity_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', this.currentUser.id);

            if (count > 100) {
                // Get IDs to keep (last 100)
                const { data: keepData } = await this.supabase
                    .from('activity_history')
                    .select('id')
                    .eq('user_id', this.currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(100);

                const keepIds = (keepData || []).map(r => r.id);

                // Delete old records
                await this.supabase
                    .from('activity_history')
                    .delete()
                    .eq('user_id', this.currentUser.id)
                    .not('id', 'in', `(${keepIds.join(',')})`);
            }
        } catch (error) {
            console.error('Error cleaning up activity history:', error);
        }
    }

    /**
     * Track additional activity types
     */
    async trackActivity(activityType, description, points = 0) {
        if (!this.currentUser) return;

        // Add to activity history
        await this.addActivityHistory(activityType, description, points);

        // Update reputation if points awarded
        if (points > 0) {
            await this.reputationSystem.addPoints(points, description);
        }

        // Update specific activity counters
        const activityMap = {
            'planet_shared': { field: 'planets_shared', points: 2 },
            'planet_favorited': { field: 'planets_favorited', points: 1 },
            'planet_compared': { field: 'planets_compared', points: 1 },
            'description_generated': { field: 'descriptions_generated', points: 3 },
            'search_performed': { field: 'searches_performed', points: 0 }
        };

        const activity = activityMap[activityType];
        if (activity) {
            await this.reputationSystem.updateActivity(activityType, 1);
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ReputationEnhancements = ReputationEnhancements;
}

