/**
 * Course Ratings and Reviews
 * @class CourseRatingsReviews
 * @description Manages course ratings and reviews with moderation.
 */
class CourseRatingsReviews {
    constructor() {
        this.reviews = new Map();
        this.ratings = new Map();
        this.init();
    }

    init() {
        this.trackEvent('course_ratings_initialized');
    }

    /**
     * Add a review.
     * @param {string} courseId - Course identifier.
     * @param {string} userId - User identifier.
     * @param {object} reviewData - Review data.
     */
    addReview(courseId, userId, reviewData) {
        const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.reviews.set(reviewId, {
            id: reviewId,
            courseId,
            userId,
            rating: reviewData.rating,
            title: reviewData.title,
            content: reviewData.content,
            helpful: 0,
            createdAt: new Date()
        });

        this.updateCourseRating(courseId);
        console.log(`Review added: ${reviewId}`);
    }

    /**
     * Update course rating.
     * @param {string} courseId - Course identifier.
     */
    updateCourseRating(courseId) {
        const courseReviews = Array.from(this.reviews.values())
            .filter(review => review.courseId === courseId);

        if (courseReviews.length === 0) return;

        const averageRating = courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length;
        this.ratings.set(courseId, {
            courseId,
            averageRating,
            reviewCount: courseReviews.length
        });
    }

    /**
     * Get course reviews.
     * @param {string} courseId - Course identifier.
     * @returns {Array<object>} Reviews.
     */
    getReviews(courseId) {
        return Array.from(this.reviews.values())
            .filter(review => review.courseId === courseId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`course_ratings_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.courseRatingsReviews = new CourseRatingsReviews();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseRatingsReviews;
}

