/**
 * Learning Analytics
 * @class LearningAnalytics
 * @description Analyzes learning patterns, performance, and provides insights.
 */
class LearningAnalytics {
    constructor() {
        this.analytics = new Map();
        this.insights = [];
        this.init();
    }

    init() {
        this.trackEvent('l_ea_rn_in_ga_na_ly_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ea_rn_in_ga_na_ly_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Analyze learning data.
     * @param {string} userId - User identifier.
     * @param {object} learningData - Learning data.
     */
    analyzeLearning(userId, learningData) {
        const analytics = this.analytics.get(userId) || {
            userId,
            totalTimeSpent: 0,
            coursesCompleted: 0,
            averageScore: 0,
            learningStreak: 0
        };

        analytics.totalTimeSpent += learningData.timeSpent || 0;
        if (learningData.courseCompleted) {
            analytics.coursesCompleted++;
        }

        this.analytics.set(userId, analytics);
        this.generateInsights(userId, analytics);
    }

    /**
     * Generate insights.
     * @param {string} userId - User identifier.
     * @param {object} analytics - Analytics data.
     */
    generateInsights(userId, analytics) {
        const insights = [];

        if (analytics.learningStreak > 7) {
            insights.push({
                type: 'achievement',
                message: `Great job! You have a ${analytics.learningStreak}-day learning streak!`
            });
        }

        if (analytics.coursesCompleted > 0) {
            insights.push({
                type: 'progress',
                message: `You've completed ${analytics.coursesCompleted} courses!`
            });
        }

        this.insights.push(...insights.map(insight => ({
            ...insight,
            userId,
            timestamp: new Date()
        })));
    }

    /**
     * Get user analytics.
     * @param {string} userId - User identifier.
     * @returns {object} Analytics data.
     */
    getUserAnalytics(userId) {
        return this.analytics.get(userId) || {
            userId,
            totalTimeSpent: 0,
            coursesCompleted: 0,
            averageScore: 0
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.learningAnalytics = new LearningAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningAnalytics;
}

