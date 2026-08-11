/**
 * Course Completion Tracking
 * @class CourseCompletionTracking
 * @description Tracks course completion with detailed analytics.
 */
class CourseCompletionTracking {
    constructor() {
        this.completions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_completion_initialized');
    }

    /**
     * Track completion.
     * @param {string} courseId - Course identifier.
     * @param {string} userId - User identifier.
     * @param {object} completionData - Completion data.
     */
    trackCompletion(courseId, userId, completionData) {
        const completionKey = `${courseId}_${userId}`;
        this.completions.set(completionKey, {
            courseId,
            userId,
            completedAt: new Date(),
            score: completionData.score || null,
            timeSpent: completionData.timeSpent || 0,
            lessonsCompleted: completionData.lessonsCompleted || 0,
            totalLessons: completionData.totalLessons || 0
        });
        console.log(`Course completion tracked: ${courseId} by user ${userId}`);
    }

    /**
     * Get completion rate.
     * @param {string} courseId - Course identifier.
     * @returns {object} Completion statistics.
     */
    getCompletionRate(courseId) {
        const courseCompletions = Array.from(this.completions.values())
            .filter(completion => completion.courseId === courseId);

        return {
            courseId,
            totalCompletions: courseCompletions.length,
            averageScore: courseCompletions.reduce((sum, c) => sum + (c.score || 0), 0) / courseCompletions.length || 0,
            averageTimeSpent: courseCompletions.reduce((sum, c) => sum + c.timeSpent, 0) / courseCompletions.length || 0
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_completion_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseCompletionTracking = new CourseCompletionTracking();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseCompletionTracking;
}

