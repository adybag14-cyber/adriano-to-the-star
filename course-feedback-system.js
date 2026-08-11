/**
 * Course Feedback System
 * @class CourseFeedbackSystem
 * @description Manages course feedback and reviews.
 */
class CourseFeedbackSystem {
    constructor() {
        this.feedback = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_feedback_initialized');
    }

    /**
     * Submit feedback.
     * @param {string} courseId - Course identifier.
     * @param {string} userId - User identifier.
     * @param {object} feedbackData - Feedback data.
     */
    submitFeedback(courseId, userId, feedbackData) {
        const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.feedback.set(feedbackId, {
            id: feedbackId,
            courseId,
            userId,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            categories: feedbackData.categories || {},
            submittedAt: new Date()
        });
        console.log(`Feedback submitted: ${feedbackId}`);
    }

    /**
     * Get course feedback.
     * @param {string} courseId - Course identifier.
     * @returns {Array<object>} Feedback entries.
     */
    getCourseFeedback(courseId) {
        return Array.from(this.feedback.values())
            .filter(f => f.courseId === courseId)
            .sort((a, b) => b.submittedAt - a.submittedAt);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_feedback_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseFeedbackSystem = new CourseFeedbackSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseFeedbackSystem;
}

