/**
 * Comment System with Threading
 * 
 * Implements comprehensive comment system with threading.
 * 
 * @module CommentSystemThreading
 * @version 1.0.0
 * @author Adriano To The Star
 */

class CommentSystemThreading {
    constructor() {
        this.comments = new Map();
        this.threads = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize comment system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('CommentSystemThreading already initialized');
            return;
        }

        this.loadComments();
        
        this.isInitialized = true;
    }

    /**
     * Add comment
     * @public
     * @param {string} content - Comment content
     * @param {string} parentId - Parent comment ID (for threading)
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Comment object
     */
    addComment(content, parentId = null, metadata = {}) {
        const comment = {
            id: Date.now() + Math.random(),
            content,
            parentId,
            authorId: this.getUserId(),
            authorName: this.getUserName(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            replies: [],
            ...metadata
        };

        this.comments.set(comment.id, comment);

        // Add to parent's replies if threaded
        if (parentId) {
            const parent = this.comments.get(parentId);
            if (parent) {
                parent.replies.push(comment.id);
            }
        }

        this.saveComments();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('comment-added', {
            detail: { comment }
        }));

        this.trackEvent('comment_added', { commentId: comment.id, isReply: !!parentId });
        return comment;
    }

    /**
     * Get comment
     * @public
     * @param {string} commentId - Comment ID
     * @returns {Object|null} Comment object
     */
    getComment(commentId) {
        return this.comments.get(commentId) || null;
    }

    /**
     * Get thread
     * @public
     * @param {string} rootCommentId - Root comment ID
     * @returns {Array} Thread array
     */
    getThread(rootCommentId) {
        const thread = [];
        const root = this.comments.get(rootCommentId);
        if (!root) {
            return thread;
        }

        thread.push(root);

        const addReplies = (comment) => {
            comment.replies.forEach(replyId => {
                const reply = this.comments.get(replyId);
                if (reply) {
                    thread.push(reply);
                    addReplies(reply);
                }
            });
        };

        addReplies(root);
        return thread;
    }

    /**
     * Get all top-level comments
     * @public
     * @param {string} entityId - Entity ID (optional)
     * @returns {Array} Top-level comments
     */
    getTopLevelComments(entityId = null) {
        return Array.from(this.comments.values())
            .filter(comment => !comment.parentId && (!entityId || comment.entityId === entityId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Like comment
     * @public
     * @param {string} commentId - Comment ID
     * @returns {Object} Updated comment
     */
    likeComment(commentId) {
        const comment = this.comments.get(commentId);
        if (!comment) {
            return null;
        }

        comment.likes++;
        comment.updatedAt = new Date().toISOString();
        this.saveComments();
        this.trackEvent('comment_liked', { commentId });

        return comment;
    }

    /**
     * Dislike comment
     * @public
     * @param {string} commentId - Comment ID
     * @returns {Object} Updated comment
     */
    dislikeComment(commentId) {
        const comment = this.comments.get(commentId);
        if (!comment) {
            return null;
        }

        comment.dislikes++;
        comment.updatedAt = new Date().toISOString();
        this.saveComments();

        return comment;
    }

    /**
     * Edit comment
     * @public
     * @param {string} commentId - Comment ID
     * @param {string} newContent - New content
     * @returns {Object} Updated comment
     */
    editComment(commentId, newContent) {
        const comment = this.comments.get(commentId);
        if (!comment || comment.authorId !== this.getUserId()) {
            return null;
        }

        comment.content = newContent;
        comment.updatedAt = new Date().toISOString();
        comment.edited = true;
        this.saveComments();

        return comment;
    }

    /**
     * Delete comment
     * @public
     * @param {string} commentId - Comment ID
     * @returns {boolean} True if deleted
     */
    deleteComment(commentId) {
        const comment = this.comments.get(commentId);
        if (!comment || comment.authorId !== this.getUserId()) {
            return false;
        }

        // Delete replies recursively
        comment.replies.forEach(replyId => {
            this.deleteComment(replyId);
        });

        // Remove from parent's replies
        if (comment.parentId) {
            const parent = this.comments.get(comment.parentId);
            if (parent) {
                parent.replies = parent.replies.filter(id => id !== commentId);
            }
        }

        this.comments.delete(commentId);
        this.saveComments();
        this.trackEvent('comment_deleted', { commentId });

        return true;
    }

    /**
     * Get user ID
     * @private
     * @returns {string|null} User ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch {
            return null;
        }
    }

    /**
     * Get user name
     * @private
     * @returns {string} User name
     */
    getUserName() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.name || user?.email || 'Guest';
        } catch {
            return 'Guest';
        }
    }

    /**
     * Save comments
     * @private
     */
    saveComments() {
        try {
            const comments = Object.fromEntries(this.comments);
            localStorage.setItem('comments', JSON.stringify(comments));
        } catch (e) {
            console.warn('Failed to save comments:', e);
        }
    }

    /**
     * Load comments
     * @private
     */
    loadComments() {
        try {
            const saved = localStorage.getItem('comments');
            if (saved) {
                const comments = JSON.parse(saved);
                Object.entries(comments).forEach(([key, value]) => {
                    this.comments.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load comments:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`comments:${eventName}`, 1, {
                    source: 'comment-system-threading',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record comment event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Comment Event', { event: eventName, ...data });
        }
    }
}

// Create global instance
window.CommentSystemThreading = CommentSystemThreading;
window.commentSystem = new CommentSystemThreading();
window.commentSystem.init();

