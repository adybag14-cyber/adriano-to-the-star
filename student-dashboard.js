/**
 * Student Dashboard
 * @class StudentDashboard
 * @description Provides student dashboard with courses, progress, and achievements.
 */
class StudentDashboard {
    constructor() {
        this.dashboards = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_tu_de_nt_da_sh_bo_ar_d_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_tu_de_nt_da_sh_bo_ar_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Get or create student dashboard.
     * @param {string} userId - User identifier.
     * @returns {object} Dashboard data.
     */
    getDashboard(userId) {
        if (!this.dashboards.has(userId)) {
            this.dashboards.set(userId, {
                userId,
                enrolledCourses: [],
                completedCourses: [],
                inProgressCourses: [],
                achievements: [],
                stats: {
                    totalCourses: 0,
                    completedCourses: 0,
                    totalXP: 0,
                    currentStreak: 0
                },
                createdAt: new Date()
            });
        }
        return this.dashboards.get(userId);
    }

    /**
     * Update dashboard stats.
     * @param {string} userId - User identifier.
     */
    updateStats(userId) {
        const dashboard = this.getDashboard(userId);
        dashboard.stats.totalCourses = dashboard.enrolledCourses.length;
        dashboard.stats.completedCourses = dashboard.completedCourses.length;
        dashboard.stats.inProgressCourses = dashboard.inProgressCourses.length;
    }

    /**
     * Add achievement to dashboard.
     * @param {string} userId - User identifier.
     * @param {object} achievement - Achievement data.
     */
    addAchievement(userId, achievement) {
        const dashboard = this.getDashboard(userId);
        if (!dashboard.achievements.find(a => a.id === achievement.id)) {
            dashboard.achievements.push(achievement);
            console.log(`Achievement added to dashboard for user ${userId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.studentDashboard = new StudentDashboard();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentDashboard;
}
