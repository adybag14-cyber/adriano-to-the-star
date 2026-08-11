/**
 * Levels and Progression v2
 * Advanced levels and progression system
 */

class LevelsProgressionV2 {
    constructor() {
        this.users = new Map();
        this.levels = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Levels and Progression v2 initialized' };
    }

    defineLevel(levelNumber, name, xpRequired) {
        if (xpRequired < 0) {
            throw new Error('XP required must be non-negative');
        }
        const level = {
            id: Date.now().toString(),
            levelNumber,
            name,
            xpRequired,
            definedAt: new Date()
        };
        this.levels.set(levelNumber, level);
        return level;
    }

    addXP(userId, xp) {
        if (xp <= 0) {
            throw new Error('XP must be positive');
        }
        if (!this.users.has(userId)) {
            this.users.set(userId, { userId, level: 1, xp: 0 });
        }
        const user = this.users.get(userId);
        user.xp += xp;
        // Check for level up
        const currentLevel = this.levels.get(user.level);
        const nextLevel = this.levels.get(user.level + 1);
        if (nextLevel && user.xp >= nextLevel.xpRequired) {
            user.level = nextLevel.levelNumber;
        }
        return { userId, level: user.level, xp: user.xp };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelsProgressionV2;
}

