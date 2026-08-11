/**
 * Levels and Progression
 * Level and progression system
 */

class LevelsProgression {
    constructor() {
        this.levels = new Map();
        this.init();
    }
    
    init() {
        this.setupLevels();
    }
    
    setupLevels() {
        // Setup levels
    }
    
    async createLevel(levelData) {
        const level = {
            id: Date.now().toString(),
            number: levelData.number,
            requiredPoints: levelData.requiredPoints,
            rewards: levelData.rewards || [],
            createdAt: Date.now()
        };
        this.levels.set(level.id, level);
        return level;
    }
    
    async getUserLevel(userId) {
        if (window.gamificationSystem) {
            const user = window.gamificationSystem.users.get(userId);
            const points = user?.points || 0;
            
            // Find level based on points
            for (const level of this.levels.values()) {
                if (points >= level.requiredPoints) {
                    return level;
                }
            }
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.levelsProgression = new LevelsProgression(); });
} else {
    window.levelsProgression = new LevelsProgression();
}

