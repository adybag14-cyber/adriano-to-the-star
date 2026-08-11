/**
 * Code Review Process
 * @class CodeReviewProcess
 * @description Manages code review workflow with approvals and comments.
 */
class CodeReviewProcess {
    constructor() {
        this.reviews = new Map();
        this.comments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('code_review_initialized');
    }

    /**
     * Create code review.
     * @param {string} reviewId - Review identifier.
     * @param {object} reviewData - Review data.
     */
    createReview(reviewId, reviewData) {
        this.reviews.set(reviewId, {
            ...reviewData,
            id: reviewId,
            pullRequestId: reviewData.pullRequestId,
            reviewers: reviewData.reviewers || [],
            status: 'pending',
            createdAt: new Date()
        });
        console.log(`Code review created: ${reviewId}`);
    }

    /**
     * Add review comment.
     * @param {string} reviewId - Review identifier.
     * @param {string} reviewerId - Reviewer identifier.
     * @param {object} commentData - Comment data.
     */
    addComment(reviewId, reviewerId, commentData) {
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.comments.set(commentId, {
            id: commentId,
            reviewId,
            reviewerId,
            ...commentData,
            createdAt: new Date()
        });

        const review = this.reviews.get(reviewId);
        if (review) {
            if (!review.comments) {
                review.comments = [];
            }
            review.comments.push(commentId);
        }

        console.log(`Review comment added: ${commentId}`);
    }

    /**
     * Approve review.
     * @param {string} reviewId - Review identifier.
     * @param {string} reviewerId - Reviewer identifier.
     */
    approveReview(reviewId, reviewerId) {
        const review = this.reviews.get(reviewId);
        if (review) {
            if (!review.approvals) {
                review.approvals = [];
            }
            review.approvals.push(reviewerId);
            
            // Check if all reviewers approved
            if (review.approvals.length >= review.reviewers.length) {
                review.status = 'approved';
            }
            console.log(`Review approved: ${reviewId} by ${reviewerId}`);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`code_review_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.codeReviewProcess = new CodeReviewProcess();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeReviewProcess;
}
