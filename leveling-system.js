/**
 * Leveling System
 * @class LevelingSystem
 * @description Manages user levels with XP, progression, and level rewards.
 */
class LevelingSystem {
    constructor() {
        this.userLevels = new Map();
        this.levelConfig = [];
        this.init();
    }

    init() {
        this.trackEvent('l_ev_el_in_gs_ys_te_m_initialized');
        this.setupLevels();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ev_el_in_gs_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupLevels() {
        // Generate level configuration (exponential XP requirements)
        for (let level = 1; level <= 100; level++) {
            this.levelConfig.push({
                level,
                xpRequired: Math.floor(100 * Math.pow(1.5, level - 1)),
                rewards: {
                    points: level * 10,
                    badge: level % 10 === 0 ? `level_${level}` : null
                }
            });
        }
    }

    /**
     * Add XP to user.
     * @param {string} userId - User identifier.
     * @param {number} xp - XP to add.
     */
    addXP(userId, xp) {
        const userLevel = this.userLevels.get(userId) || {
            userId,
            level: 1,
            xp: 0,
            totalXP: 0
        };

        userLevel.xp += xp;
        userLevel.totalXP += xp;

        // Check for level up
        while (this.checkLevelUp(userLevel)) {
            this.levelUp(userId, userLevel);
        }

        this.userLevels.set(userId, userLevel);
        console.log(`Added ${xp} XP to user ${userId}`);
    }

    /**
     * Check if user should level up.
     * @param {object} userLevel - User level data.
     * @returns {boolean} Whether user should level up.
     */
    checkLevelUp(userLevel) {
        const currentLevelConfig = this.levelConfig[userLevel.level - 1];
        const nextLevelConfig = this.levelConfig[userLevel.level];
        
        if (!nextLevelConfig) return false; // Max level reached

        return userLevel.xp >= nextLevelConfig.xpRequired;
    }

    /**
     * Level up user.
     * @param {string} userId - User identifier.
     * @param {object} userLevel - User level data.
     */
    levelUp(userId, userLevel) {
        userLevel.level++;
        const levelConfig = this.levelConfig[userLevel.level - 1];
        
        console.log(`User ${userId} leveled up to level ${userLevel.level}!`);
        
        // Award level rewards
        if (levelConfig.rewards) {
            // Placeholder for reward distribution
            console.log(`Rewards: ${JSON.stringify(levelConfig.rewards)}`);
        }
    }

    /**
     * Get user level.
     * @param {string} userId - User identifier.
     * @returns {object} User level data.
     */
    getUserLevel(userId) {
        return this.userLevels.get(userId) || {
            userId,
            level: 1,
            xp: 0,
            totalXP: 0
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.levelingSystem = new LevelingSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelingSystem;
}
