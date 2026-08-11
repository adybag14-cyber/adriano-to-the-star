class ProductReviewsRatings {
    constructor() {
        this.reviews = new Map();
        this.ratings = new Map();
    }
    init() {
        // Product Reviews and Ratings initialized.
    }

    /**
     * Add a review.
     * @param {string} productId - Product identifier.
     * @param {string} userId - User identifier.
     * @param {object} reviewData - Review data.
     * @returns {string} Review identifier.
     */
    addReview(productId, userId, reviewData) {
        const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.reviews.set(reviewId, {
            id: reviewId,
            productId,
            userId,
            rating: reviewData.rating,
            title: reviewData.title,
            content: reviewData.content,
            helpful: 0,
            notHelpful: 0,
            verified: reviewData.verified || false,
            createdAt: new Date()
        });

        this.updateProductRating(productId);
        this.trackEvent('review_added', { reviewId, productId, rating: reviewData.rating });
        return reviewId;
    }

    /**
     * Update product rating.
     * @param {string} productId - Product identifier.
     */
    updateProductRating(productId) {
        const productReviews = Array.from(this.reviews.values())
            .filter(review => review.productId === productId);

        if (productReviews.length === 0) return;

        const averageRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length;
        const ratingCount = productReviews.length;

        this.ratings.set(productId, {
            productId,
            averageRating,
            ratingCount,
            distribution: this.calculateRatingDistribution(productReviews)
        });
    }

    /**
     * Calculate rating distribution.
     * @param {Array<object>} reviews - Reviews array.
     * @returns {object} Rating distribution.
     */
    calculateRatingDistribution(reviews) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(review => {
            distribution[review.rating]++;
        });
        return distribution;
    }

    /**
     * Get reviews for a product.
     * @param {string} productId - Product identifier.
     * @param {object} options - Query options.
     * @returns {Array<object>} Reviews.
     */
    getReviews(productId, options = {}) {
        const reviews = Array.from(this.reviews.values())
            .filter(review => review.productId === productId);

        // Sort by helpful or date
        if (options.sortBy === 'helpful') {
            reviews.sort((a, b) => b.helpful - a.helpful);
        } else {
            reviews.sort((a, b) => b.createdAt - a.createdAt);
        }

        return reviews;
    }

    /**
     * Get product rating.
     * @param {string} productId - Product identifier.
     * @returns {object} Rating data.
     */
    getRating(productId) {
        return this.ratings.get(productId) || {
            productId,
            averageRating: 0,
            ratingCount: 0
        };
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`reviews:${eventName}`, 1, {
                    source: 'product-reviews-ratings',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record review event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Review Event', { event: eventName, ...data });
        }
    }
}
const productReviewsRatings = new ProductReviewsRatings();
if (typeof window !== 'undefined') {
    window.productReviewsRatings = productReviewsRatings;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductReviewsRatings;
}
