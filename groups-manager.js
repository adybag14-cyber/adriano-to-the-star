/**
 * Groups Manager - Interactive Groups & Posts System
 * 
 * Handles fetching groups, posts, creating content, and real-time updates.
 * Supports both backend API (localhost) and client-side storage (GitLab Pages).
 * 
 * @class GroupsManager
 * @author Adriano To The Star
 * @version 1.0.0
 * @since 2025-01
 * 
 * @example
 * // Initialize groups manager
 * const groupsManager = new GroupsManager();
 */
class GroupsManager {
    /**
     * Create a new GroupsManager instance
     * 
     * Auto-detects environment (GitLab Pages vs localhost) and configures
     * storage accordingly. Initializes default groups if using client storage.
     * 
     * @constructor
     */
    constructor() {
        // Auto-detect environment (GitLab Pages vs localhost)
        const isGitLabPages = window.location.hostname.includes('gitlab.io') || 
                             window.location.hostname.includes('gitlab-pages') ||
                             (window.location.hostname !== 'localhost' && 
                              window.location.hostname !== '127.0.0.1');
        const isLocalBackend = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
                               window.location.port === '3000';
        
        if (isGitLabPages || !isLocalBackend) {
            if (isGitLabPages) {
                console.log('🌐 GitLab Pages detected - Using client-side storage for groups');
            } else {
                console.log('💾 Local static site detected - Using client-side storage for groups');
            }
            this.API_URL = null;
            this.useClientSideStorage = true;
            this.groupsStorageKey = 'adriano_groups';
            this.postsStorageKey = 'adriano_posts';
            this.initClientStorage();
        } else {
            console.log('💻 Localhost detected - Using backend API for groups');
            this.API_URL = 'http://localhost:3000/api';
            this.useClientSideStorage = false;
        }
        
        this.groups = [];
        this.posts = [];
        this.currentGroupFilter = null;
        this.init();
    }

    /**
     * Robust JSON fetcher with proxy fallback for external domains.
     * 
     * @param {string} url - Target URL
     * @param {Object} [options={}] - Fetch options
     * @returns {Promise<Object>} JSON response
     */
    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`Direct fetch failed for ${url}, trying proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Initialize client-side storage for groups and posts
     * 
     * Creates default groups and empty posts storage if not exists.
     * 
     * @private
     * @returns {void}
     */
    initClientStorage() {
        // Initialize default groups if not exists
        if (!localStorage.getItem(this.groupsStorageKey)) {
            const defaultGroups = [
                {
                    id: 1,
                    name: 'Cosmic Explorers',
                    description: 'Main community for all space enthusiasts',
                    members: [],
                    posts: []
                }
            ];
            localStorage.setItem(this.groupsStorageKey, JSON.stringify(defaultGroups));
        }
        
        // Initialize posts storage if not exists
        if (!localStorage.getItem(this.postsStorageKey)) {
            localStorage.setItem(this.postsStorageKey, JSON.stringify([]));
        }
    }

    /**
     * Get groups from localStorage
     * 
     * @private
     * @returns {Array<Object>} Array of group objects
     */
    getGroupsFromStorage() {
        const groupsJson = localStorage.getItem(this.groupsStorageKey);
        return JSON.parse(groupsJson || '[]');
    }

    /**
     * Save groups to localStorage
     * 
     * @private
     * @param {Array<Object>} groups - Array of group objects to save
     * @returns {void}
     */
    saveGroupsToStorage(groups) {
        localStorage.setItem(this.groupsStorageKey, JSON.stringify(groups));
    }

    /**
     * Get posts from localStorage
     * 
     * @private
     * @returns {Array<Object>} Array of post objects
     */
    getPostsFromStorage() {
        const postsJson = localStorage.getItem(this.postsStorageKey);
        return JSON.parse(postsJson || '[]');
    }

    /**
     * Save posts to localStorage
     * 
     * @private
     * @param {Array<Object>} posts - Array of post objects to save
     * @returns {void}
     */
    savePostsToStorage(posts) {
        localStorage.setItem(this.postsStorageKey, JSON.stringify(posts));
    }

    /**
     * Initialize the groups manager
     * 
     * Loads groups and posts, renders UI, sets up event listeners,
     * and starts auto-refresh interval (30 seconds).
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        this.trackEvent('g_ro_up_sm_an_ag_er_initialized');
        await this.loadGroups();
        await this.loadPosts();
        this.render();
        this.setupEventListeners();
        
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => this.refresh(), 30000);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_ro_up_sm_an_ag_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    enableClientSideStorageFallback() {
        if (this.useClientSideStorage) {
            return;
        }

        console.log('📦 Backend API unavailable - Using client-side storage for groups');
        this.API_URL = null;
        this.useClientSideStorage = true;
        this.groupsStorageKey = 'adriano_groups';
        this.postsStorageKey = 'adriano_posts';
        this.initClientStorage();
    }

    /**
     * Cleanup resources
     * 
     * Clears refresh interval to prevent memory leaks.
     * 
     * @public
     * @returns {void}
     */
    cleanup() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Load groups from storage or API
     * 
     * Loads from localStorage if on GitLab Pages, otherwise from backend API.
     * Creates default group if none exist.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async loadGroups() {
        try {
            console.log('📋 Loading groups...');
            
            if (this.useClientSideStorage) {
                // Load from localStorage
                this.groups = this.getGroupsFromStorage();
                console.log(`✓ Loaded ${this.groups.length} groups from localStorage`);
            } else {
                // Load from backend
                this.groups = await this.fetchJSON(`${this.API_URL}/groups`);
                console.log(`✓ Loaded ${this.groups.length} groups from backend`);
            }
        } catch (error) {
            if (!this.useClientSideStorage) {
                try {
                    this.enableClientSideStorageFallback();
                    this.groups = this.getGroupsFromStorage();
                    console.log(`✓ Loaded ${this.groups.length} groups from localStorage`);
                    return;
                } catch (fallbackError) {
                    console.warn('✗ Backend unavailable and fallback failed:', fallbackError);
                }
            }

            console.warn('✗ Error loading groups:', error);
            // Fallback to default group
            if (this.groups.length === 0) {
                this.groups = [{
                    id: 1,
                    name: 'Cosmic Explorers',
                    description: 'Main community for all space enthusiasts',
                    members: [],
                    posts: []
                }];
            }
            this.showError('Failed to load groups');
        }
    }

    /**
     * Load posts from storage or API
     * 
     * Loads all posts or posts for a specific group.
     * Note: Currently only supports backend API, needs client-side storage support.
     * 
     * @private
     * @async
     * @param {number|null} [groupId=null] - Optional group ID to filter posts
     * @returns {Promise<void>}
     */
    async loadPosts(groupId = null) {
        try {
            console.log(`📰 Loading posts${groupId ? ` for group ${groupId}` : ''}...`);

            if (this.useClientSideStorage) {
                const allPosts = this.getPostsFromStorage();
                this.posts = groupId ? allPosts.filter(p => p.groupId === groupId) : allPosts;
                console.log(`✓ Loaded ${this.posts.length} posts from localStorage`);
                return;
            }

            const url = groupId
                ? `${this.API_URL}/posts?groupId=${groupId}`
                : `${this.API_URL}/posts`;

            this.posts = await this.fetchJSON(url);
            console.log(`✓ Loaded ${this.posts.length} posts`);
        } catch (error) {
            if (!this.useClientSideStorage) {
                try {
                    this.enableClientSideStorageFallback();
                    const allPosts = this.getPostsFromStorage();
                    this.posts = groupId ? allPosts.filter(p => p.groupId === groupId) : allPosts;
                    console.log(`✓ Loaded ${this.posts.length} posts from localStorage`);
                    return;
                } catch (fallbackError) {
                    console.warn('✗ Backend unavailable and fallback failed:', fallbackError);
                }
            }

            console.warn('✗ Error loading posts:', error);
            this.showError('Failed to load posts');
        }
    }

    /**
     * Refresh groups and posts data
     * 
     * Reloads data and re-renders posts. Called automatically every 30 seconds.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async refresh() {
        console.log('🔄 Refreshing data...');
        await this.loadGroups();
        await this.loadPosts(this.currentGroupFilter);
        this.renderPosts();
    }

    /**
     * Join a group
     * 
     * Adds current user to group members. Requires authentication.
     * Works with both client-side storage and backend API.
     * 
     * @public
     * @async
     * @param {number} groupId - ID of group to join
     * @returns {Promise<void>}
     */
    async joinGroup(groupId) {
        if (!authManager || !authManager.isAuthenticated()) {
            if (typeof showModal === 'function') {
                showModal('login-modal');
            }
            return;
        }

        try {
            console.log(`👥 Joining group ${groupId}...`);
            
            if (this.useClientSideStorage) {
                // Client-side: Add user to group
                const groups = this.getGroupsFromStorage();
                const group = groups.find(g => g.id === groupId);
                if (group) {
                    const currentUser = authManager.getCurrentUser();
                    if (currentUser && !group.members.includes(currentUser.id)) {
                        group.members.push(currentUser.id);
                        this.saveGroupsToStorage(groups);
                        this.groups = groups;
                        console.log('✓ Successfully joined group');
                        this.showSuccess('Successfully joined group!');
                        this.render();
                    }
                }
            } else {
                // Backend: Use API
                const data = await this.fetchJSON(`${this.API_URL}/groups/${groupId}/join`, {
                    method: 'POST',
                    headers: authManager.getHeaders(),
                });

                console.log('✓ Successfully joined group');
                await this.refresh();
                this.showSuccess('Successfully joined group!');
            }
            
        } catch (error) {
            console.error('✗ Error joining group:', error);
            this.showError(error.message || 'Failed to join group');
        }
    }

    /**
     * Create a new post in a group
     * 
     * Creates a post with author info, timestamp, and initial stats.
     * Requires authentication. Works with both client-side storage and backend API.
     * 
     * @public
     * @async
     * @param {number} groupId - ID of group to post in
     * @param {string} content - Post content text
     * @returns {Promise<void>}
     */
    async createPost(groupId, content) {
        if (!authManager || !authManager.isAuthenticated()) {
            if (typeof showModal === 'function') {
                showModal('login-modal');
            }
            return;
        }

        try {
            console.log(`✍ Creating post in group ${groupId}...`);
            
            if (this.useClientSideStorage) {
                // Client-side: Create post in localStorage
                const posts = this.getPostsFromStorage();
                const currentUser = authManager.getCurrentUser();
                
                if (!currentUser) {
                    throw new Error('You must be logged in to create a post');
                }
                
                const newPost = {
                    id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
                    groupId: parseInt(groupId, 10),
                    authorId: currentUser.id,
                    authorName: currentUser.username || currentUser.fullName || 'Anonymous',
                    content: content.trim(),
                    likes: 0,
                    comments: [],
                    views: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                posts.push(newPost);
                this.savePostsToStorage(posts);
                this.posts = posts;
                console.log('✓ Post created successfully');
                this.showSuccess('Post created!');
                this.render();
            } else {
                // Backend: Use API
                const data = await this.fetchJSON(`${this.API_URL}/posts`, {
                    method: 'POST',
                    headers: authManager.getHeaders(),
                    body: JSON.stringify({ groupId, content }),
                });

                console.log('✓ Post created successfully');
                await this.refresh();
                this.showSuccess('Post created!');
            }
            
        } catch (error) {
            console.error('✗ Error creating post:', error);
            this.showError(error.message || 'Failed to create post');
        }
    }

    /**
     * Like a post
     * 
     * Increments post like count. Requires authentication.
     * Currently only supports backend API.
     * 
     * @public
     * @async
     * @param {number} postId - ID of post to like
     * @returns {Promise<void>}
     */
    async likePost(postId) {
        if (!authManager.isAuthenticated()) {
            showModal('login-modal');
            return;
        }

        try {
            const data = await this.fetchJSON(`${this.API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: authManager.getHeaders(),
            });

            console.log(`👍 Post ${postId} liked`);
            
            // Update UI
            const likeButton = document.querySelector(`[data-post-id="${postId}"] .like-count`);
            if (likeButton) {
                likeButton.textContent = `${data.likes} Likes`;
            }
            
        } catch (error) {
            console.error('✗ Error liking post:', error);
        }
    }

    /**
     * Add a comment to a post
     * 
     * Creates a comment with author info and timestamp.
     * Requires authentication. Works with both client-side storage and backend API.
     * 
     * @public
     * @async
     * @param {number} postId - ID of post to comment on
     * @param {string} content - Comment content text
     * @returns {Promise<void>}
     */
    async addComment(postId, content) {
        if (!authManager || !authManager.isAuthenticated()) {
            if (typeof showModal === 'function') {
                showModal('login-modal');
            }
            return;
        }

        try {
            if (this.useClientSideStorage) {
                // Client-side: Add comment in localStorage
                const posts = this.getPostsFromStorage();
                const post = posts.find(p => p.id === postId);
                const currentUser = authManager.getCurrentUser();
                
                if (!currentUser) {
                    throw new Error('You must be logged in to add a comment');
                }
                
                if (post) {
                    if (!post.comments) {
                        post.comments = [];
                    }
                    
                    const newComment = {
                        id: post.comments.length > 0 ? Math.max(...post.comments.map(c => c.id)) + 1 : 1,
                        authorId: currentUser.id,
                        authorName: currentUser.username || currentUser.fullName || 'Anonymous',
                        content: content.trim(),
                        createdAt: new Date().toISOString()
                    };
                    
                    post.comments.push(newComment);
                    this.savePostsToStorage(posts);
                    this.posts = posts;
                    console.log(`💬 Comment added to post ${postId}`);
                    this.render();
                }
            } else {
                // Backend: Use API
                const data = await this.fetchJSON(`${this.API_URL}/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: authManager.getHeaders(),
                    body: JSON.stringify({ content }),
                });

                console.log(`💬 Comment added to post ${postId}`);
                await this.refresh();
            }
            
        } catch (error) {
            console.error('✗ Error adding comment:', error);
            this.showError(error.message || 'Failed to add comment');
        }
    }

    /**
     * Filter posts by group
     * 
     * Sets current group filter and reloads posts for that group.
     * 
     * @public
     * @param {number|null} groupId - Group ID to filter by, or null for all posts
     * @returns {void}
     */
    filterByGroup(groupId) {
        this.currentGroupFilter = groupId;
        this.loadPosts(groupId);
        setTimeout(() => this.renderPosts(), 100);
    }

    /**
     * Setup event listeners for UI interactions
     * 
     * Handles create post button, submit post form, and group filter buttons.
     * 
     * @private
     * @returns {void}
     */
    setupEventListeners() {
        // Create post button
        const createPostBtn = document.getElementById('create-post-btn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                if (!authManager.isAuthenticated()) {
                    showModal('login-modal');
                } else {
                    showModal('create-post-modal');
                }
            });
        }

        // Submit post form
        const submitPostBtn = document.getElementById('submit-post-btn');
        if (submitPostBtn) {
            submitPostBtn.addEventListener('click', async () => {
                const groupSelect = document.getElementById('post-group-select');
                const contentInput = document.getElementById('post-content');
                
                if (groupSelect && contentInput) {
                    const groupId = parseInt(groupSelect.value, 10);
                    const content = contentInput.value.trim();
                    
                    if (!content) {
                        this.showError('Please enter post content');
                        return;
                    }
                    
                    await this.createPost(groupId, content);
                    contentInput.value = '';
                    hideModal('create-post-modal');
                }
            });
        }

        // Group filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-group-btn')) {
                const groupId = e.target.dataset.groupId;
                this.filterByGroup(groupId ? parseInt(groupId, 10) : null);
                
                // Update active state
                document.querySelectorAll('.filter-group-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    }

    /**
     * Render all groups and posts
     * 
     * @private
     * @returns {void}
     */
    render() {
        this.renderGroups();
        this.renderPosts();
    }

    /**
     * Render groups list
     * 
     * Creates HTML for all groups with stats and join buttons.
     * 
     * @private
     * @returns {void}
     */
    renderGroups() {
        const container = document.getElementById('groups-list');
        if (!container) return;

        container.innerHTML = this.groups.map(group => `
            <div class="group-card" data-entrance="slideUp">
                <h3>${group.name}</h3>
                <p>${group.description}</p>
                <div class="group-stats">
                    <span>👥 ${group.members.length} members</span>
                    <span>📝 ${group.posts || 0} posts</span>
                </div>
                ${authManager.isAuthenticated() && !authManager.user.groups?.includes(group.id) ? `
                    <button class="join-group-btn" onclick="groupsManager.joinGroup(${group.id})">
                        Join Group
                    </button>
                ` : authManager.user?.groups?.includes(group.id) ? `
                    <span class="member-badge">✓ Member</span>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Render posts list
     * 
     * Creates HTML for all posts with author, content, likes, comments, and actions.
     * Shows empty state if no posts exist.
     * 
     * @private
     * @returns {void}
     */
    renderPosts() {
        const container = document.getElementById('posts-container');
        if (!container) return;

        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>No posts yet. ${authManager.isAuthenticated() ? 'Be the first to post!' : 'Login to create posts.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => {
            const group = this.groups.find(g => g.id === post.groupId);
            const date = new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <div class="post-card" data-post-id="${post.id}" data-entrance="slideUp">
                    ${this.currentGroupFilter ? '' : `
                        <p class="post-group-tag">Posted in <a href="#" onclick="groupsManager.filterByGroup(${post.groupId}); return false;">${group?.name || 'Unknown Group'}</a></p>
                    `}
                    
                    <div class="post-header">
                        <div class="post-author">
                            <span class="author-avatar">👤</span>
                            <div>
                                <strong>${post.authorName}</strong>
                                <span class="post-date">${date}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="post-content">
                        <p>${post.content}</p>
                    </div>
                    
                    <div class="post-actions">
                        <button class="like-btn" onclick="groupsManager.likePost(${post.id})">
                            ❤️ <span class="like-count">${post.likes || 0} Likes</span>
                        </button>
                        <span class="comment-count">💬 ${post.comments?.length || 0} Comments</span>
                        <span class="view-count">👁️ ${post.views || 0} Views</span>
                    </div>
                    
                    ${post.comments && post.comments.length > 0 ? `
                        <div class="comments-section">
                            <h4>Comments</h4>
                            ${post.comments.map(comment => `
                                <div class="comment">
                                    <strong>${comment.authorName}</strong>
                                    <p>${comment.content}</p>
                                    <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${authManager.isAuthenticated() ? `
                        <div class="add-comment">
                            <input type="text" placeholder="Add a comment..." id="comment-input-${post.id}">
                            <button onclick="groupsManager.handleCommentSubmit(${post.id})">Post</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Trigger entrance animations
        setTimeout(() => {
            const cards = container.querySelectorAll('[data-entrance]');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
            });
        }, 100);
    }

    /**
     * Handle comment form submission
     * 
     * Extracts comment text from input and calls addComment.
     * 
     * @public
     * @param {number} postId - ID of post to comment on
     * @returns {void}
     */
    handleCommentSubmit(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        if (input && input.value.trim()) {
            this.addComment(postId, input.value.trim());
            input.value = '';
        }
    }

    /**
     * Show success notification
     * 
     * @private
     * @param {string} message - Success message
     * @returns {void}
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error notification
     * 
     * @private
     * @param {string} message - Error message
     * @returns {void}
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification to user
     * 
     * Creates a temporary notification that auto-dismisses after 3 seconds.
     * 
     * @private
     * @param {string} message - Notification message
     * @param {string} [type='info'] - Notification type: 'info', 'success', 'error'
     * @returns {void}
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize groups manager when DOM is ready
let groupsManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        groupsManager = new GroupsManager();
    });
} else {
    const _groupsManager = new GroupsManager();
    window.groupsManager = _groupsManager;
}
