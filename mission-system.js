/**
 * Mission System
 * @class MissionSystem
 * @description Manages missions with tasks and completion tracking.
 */
class MissionSystem {
    constructor() {
        this.missions = new Map();
        this.userMissions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_is_si_on_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_is_si_on_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a mission.
     * @param {string} missionId - Mission identifier.
     * @param {object} missionData - Mission data.
     */
    createMission(missionId, missionData) {
        this.missions.set(missionId, {
            ...missionData,
            id: missionId,
            tasks: missionData.tasks || [],
            rewards: missionData.rewards || {},
            createdAt: new Date()
        });
        console.log(`Mission created: ${missionId}`);
    }

    /**
     * Assign mission to user.
     * @param {string} userId - User identifier.
     * @param {string} missionId - Mission identifier.
     */
    assignMission(userId, missionId) {
        const missionKey = `${userId}_${missionId}`;
        this.userMissions.set(missionKey, {
            userId,
            missionId,
            completedTasks: [],
            status: 'active',
            assignedAt: new Date()
        });
        console.log(`Mission assigned: ${missionId} to user ${userId}`);
    }

    /**
     * Complete task.
     * @param {string} userId - User identifier.
     * @param {string} missionId - Mission identifier.
     * @param {string} taskId - Task identifier.
     */
    completeTask(userId, missionId, taskId) {
        const missionKey = `${userId}_${missionId}`;
        const userMission = this.userMissions.get(missionKey);
        if (userMission && !userMission.completedTasks.includes(taskId)) {
            userMission.completedTasks.push(taskId);
            this.checkMissionCompletion(userId, missionId);
        }
    }

    /**
     * Check mission completion.
     * @param {string} userId - User identifier.
     * @param {string} missionId - Mission identifier.
     */
    checkMissionCompletion(userId, missionId) {
        const mission = this.missions.get(missionId);
        const missionKey = `${userId}_${missionId}`;
        const userMission = this.userMissions.get(missionKey);
        
        if (!mission || !userMission) return;

        const allTasksCompleted = mission.tasks.every(task => 
            userMission.completedTasks.includes(task.id)
        );

        if (allTasksCompleted && userMission.status === 'active') {
            userMission.status = 'completed';
            userMission.completedAt = new Date();
            console.log(`Mission completed: ${missionId} by user ${userId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.missionSystem = new MissionSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MissionSystem;
}

