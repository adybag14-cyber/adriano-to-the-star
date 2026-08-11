/**
 * Levels and Progression Advanced
 * Advanced leveling system
 */

class LevelsProgressionAdvanced {
    constructor() {
        this.levels = new Map();
        this.userLevels = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Levels and Progression Advanced initialized' };
    }

    defineLevel(levelNumber, xpRequired, rewards) {
        if (levelNumber < 1) {
            throw new Error('Level number must be at least 1');
        }
        const level = {
            levelNumber,
            xpRequired,
            rewards: rewards || [],
            createdAt: new Date()
        };
        this.levels.set(levelNumber, level);
        return level;
    }

    addXP(userId, xp) {
        if (xp <= 0) {
            throw new Error('XP must be positive');
        }
        const userLevel = this.userLevels.get(userId) || { level: 1, xp: 0 };
        userLevel.xp += xp;
        // Check for level up
        const nextLevel = this.levels.get(userLevel.level + 1);
        if (nextLevel && userLevel.xp >= nextLevel.xpRequired) {
            userLevel.level++;
        }
        this.userLevels.set(userId, userLevel);
        return userLevel;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelsProgressionAdvanced;
}

