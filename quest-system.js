/**
 * Quest System
 * @class QuestSystem
 * @description Manages quests with objectives, rewards, and progression.
 */
class QuestSystem {
    constructor() {
        this.quests = new Map();
        this.userQuests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('q_ue_st_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("q_ue_st_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a quest.
     * @param {string} questId - Quest identifier.
     * @param {object} questData - Quest data.
     */
    createQuest(questId, questData) {
        this.quests.set(questId, {
            ...questData,
            id: questId,
            objectives: questData.objectives || [],
            rewards: questData.rewards || {},
            createdAt: new Date()
        });
        console.log(`Quest created: ${questId}`);
    }

    /**
     * Start quest for user.
     * @param {string} userId - User identifier.
     * @param {string} questId - Quest identifier.
     */
    startQuest(userId, questId) {
        const questKey = `${userId}_${questId}`;
        this.userQuests.set(questKey, {
            userId,
            questId,
            progress: {},
            status: 'active',
            startedAt: new Date()
        });
        console.log(`Quest started: ${questId} for user ${userId}`);
    }

    /**
     * Update quest progress.
     * @param {string} userId - User identifier.
     * @param {string} questId - Quest identifier.
     * @param {string} objectiveId - Objective identifier.
     * @param {number} progress - Progress value.
     */
    updateProgress(userId, questId, objectiveId, progress) {
        const questKey = `${userId}_${questId}`;
        const userQuest = this.userQuests.get(questKey);
        if (userQuest) {
            userQuest.progress[objectiveId] = progress;
            this.checkQuestCompletion(userId, questId);
        }
    }

    /**
     * Check quest completion.
     * @param {string} userId - User identifier.
     * @param {string} questId - Quest identifier.
     */
    checkQuestCompletion(userId, questId) {
        const quest = this.quests.get(questId);
        const questKey = `${userId}_${questId}`;
        const userQuest = this.userQuests.get(questKey);
        
        if (!quest || !userQuest) return;

        const allCompleted = quest.objectives.every(objective => {
            const progress = userQuest.progress[objective.id] || 0;
            return progress >= objective.target;
        });

        if (allCompleted && userQuest.status === 'active') {
            userQuest.status = 'completed';
            userQuest.completedAt = new Date();
            console.log(`Quest completed: ${questId} by user ${userId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.questSystem = new QuestSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestSystem;
}

