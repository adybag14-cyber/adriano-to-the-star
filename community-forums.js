/**
 * Community Forums
 * @class CommunityForums
 * @description Provides community forum functionality with threads, posts, and moderation.
 */
class CommunityForums {
    constructor() {
        this.forums = new Map();
        this.threads = new Map();
        this.posts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('comm_forums_initialized');
    }

    /**
     * Create a forum.
     * @param {string} forumId - Forum identifier.
     * @param {object} forumData - Forum data.
     */
    createForum(forumId, forumData) {
        this.forums.set(forumId, {
            ...forumData,
            threadCount: 0,
            postCount: 0,
            createdAt: new Date()
        });
        console.log(`Forum created: ${forumId}`);
    }

    /**
     * Create a thread.
     * @param {string} forumId - Forum identifier.
     * @param {string} userId - User identifier.
     * @param {object} threadData - Thread data.
     * @returns {string} Thread identifier.
     */
    createThread(forumId, userId, threadData) {
        const forum = this.forums.get(forumId);
        if (!forum) {
            throw new Error(`Forum not found: ${forumId}`);
        }

        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.threads.set(threadId, {
            id: threadId,
            forumId,
            authorId: userId,
            title: threadData.title,
            content: threadData.content,
            views: 0,
            replies: 0,
            isPinned: false,
            isLocked: false,
            createdAt: new Date(),
            lastActivity: new Date()
        });

        forum.threadCount++;
        console.log(`Thread created: ${threadId}`);
        return threadId;
    }

    /**
     * Create a post (reply).
     * @param {string} threadId - Thread identifier.
     * @param {string} userId - User identifier.
     * @param {string} content - Post content.
     * @returns {string} Post identifier.
     */
    createPost(threadId, userId, content) {
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error(`Thread not found: ${threadId}`);
        }

        if (thread.isLocked) {
            throw new Error('Thread is locked');
        }

        const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.posts.set(postId, {
            id: postId,
            threadId,
            authorId: userId,
            content,
            createdAt: new Date(),
            editedAt: null
        });

        thread.replies++;
        thread.lastActivity = new Date();
        
        const forum = this.forums.get(thread.forumId);
        if (forum) {
            forum.postCount++;
        }

        console.log(`Post created: ${postId}`);
        return postId;
    }

    /**
     * Get threads in a forum.
     * @param {string} forumId - Forum identifier.
     * @param {object} options - Query options.
     * @returns {Array<object>} Threads.
     */
    getThreads(forumId, options = {}) {
        const threads = Array.from(this.threads.values())
            .filter(thread => thread.forumId === forumId);

        // Sort by pinned first, then by last activity
        threads.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.lastActivity - a.lastActivity;
        });

        return threads;
    }

    /**
     * Get posts in a thread.
     * @param {string} threadId - Thread identifier.
     * @returns {Array<object>} Posts.
     */
    getPosts(threadId) {
        const posts = Array.from(this.posts.values())
            .filter(post => post.threadId === threadId);
        
        posts.sort((a, b) => a.createdAt - b.createdAt);
        return posts;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`comm_forums_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.communityForums = new CommunityForums();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunityForums;
}
