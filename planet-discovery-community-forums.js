/**
 * Planet Discovery Community Forums
 * Discussion forums for planet enthusiasts
 */

class PlanetDiscoveryCommunityForums {
    constructor() {
        this.forums = [];
        this.currentForum = null;
        this.posts = [];
        this.init();
    }

    init() {
        this.loadForums();
        console.log('💬 Community forums initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_co_mm_un_it_yf_or_um_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    escapeHTML(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    loadForums() {
        this.forums = [
            {
                id: 'general-discussion',
                title: 'General Discussion',
                description: 'General discussions about exoplanets and space',
                icon: '💬',
                postCount: 0,
                lastPost: null
            },
            {
                id: 'discoveries',
                title: 'New Discoveries',
                description: 'Discuss newly discovered exoplanets',
                icon: '🪐',
                postCount: 0,
                lastPost: null
            },
            {
                id: 'habitable-planets',
                title: 'Habitable Planets',
                description: 'Discussion about potentially habitable worlds',
                icon: '🌍',
                postCount: 0,
                lastPost: null
            },
            {
                id: 'trading',
                title: 'Planet Trading',
                description: 'Discuss planet trading and marketplace',
                icon: '💰',
                postCount: 0,
                lastPost: null
            },
            {
                id: 'science',
                title: 'Science & Research',
                description: 'Scientific discussions and research',
                icon: '🔬',
                postCount: 0,
                lastPost: null
            }
        ];

        // Load from Supabase if available
        this.loadForumsFromSupabase();
    }

    async loadForumsFromSupabase() {
        if (typeof supabase === 'undefined' || !supabase) {
            return;
        }

        try {
            const { data, error } = await supabase
                .from('forums')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Error loading forums from Supabase:', error);
                return;
            }

            if (data && data.length > 0) {
                this.forums = data.map(f => ({
                    id: f.id,
                    title: f.title,
                    description: f.description,
                    icon: f.icon || '💬',
                    postCount: f.post_count || 0,
                    lastPost: f.last_post
                }));
            }
        } catch (error) {
            console.error('Error loading forums:', error);
        }
    }

    renderForums(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="forums-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">💬 Community Forums</h3>
                
                <div class="forums-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.forums.forEach(forum => {
            html += this.createForumCard(forum);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Setup event listeners
        this.forums.forEach(forum => {
            const card = document.querySelector(`[data-forum-id="${forum.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.openForum(forum.id);
                });
            }
        });
    }

    createForumCard(forum) {
        const safeIcon = this.escapeHTML(forum.icon || '💬');
        const safeTitle = this.escapeHTML(forum.title || 'Forum');
        const safeDescription = this.escapeHTML(forum.description || '');
        const safePostCount = Number(forum.postCount) || 0;
        const safeLastPost = forum.lastPost
            ? this.escapeHTML(new Date(forum.lastPost).toLocaleDateString())
            : null;

        return `
            <div class="forum-card" data-forum-id="${forum.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${safeIcon}</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${safeTitle}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${safeDescription}</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7;">
                        <span>📝 ${safePostCount} posts</span>
                        ${safeLastPost ? `<span>🕐 ${safeLastPost}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async openForum(forumId) {
        const forum = this.forums.find(f => f.id === forumId);
        if (!forum) {
            console.error(`Forum ${forumId} not found`);
            return;
        }

        this.currentForum = forum;
        await this.loadPosts(forumId);
        this.showForumModal(forum);
    }

    async loadPosts(forumId) {
        if (typeof supabase === 'undefined' || !supabase) {
            // Use mock data
            this.posts = this.getMockPosts(forumId);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('forum_posts')
                .select('*')
                .eq('forum_id', forumId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('Error loading posts:', error);
                this.posts = this.getMockPosts(forumId);
                return;
            }

            this.posts = data || [];
        } catch (error) {
            console.error('Error loading posts:', error);
            this.posts = this.getMockPosts(forumId);
        }
    }

    getMockPosts(forumId) {
        return [
            {
                id: '1',
                title: 'Welcome to the Forum!',
                content: 'This is a great place to discuss exoplanets and share your discoveries.',
                author: 'Admin',
                created_at: new Date().toISOString(),
                replies: 0
            }
        ];
    }

    showForumModal(forum) {
        const modal = document.createElement('div');
        modal.id = 'forum-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        let postsHTML = this.posts.map(post => {
            const safeTitle = this.escapeHTML(post.title || '');
            const safeContent = this.escapeHTML(post.content || '');
            const safeAuthor = this.escapeHTML(post.author || 'Anonymous');
            const safeDate = this.escapeHTML(new Date(post.created_at).toLocaleDateString());
            const safeReplies = Number(post.replies) || 0;

            return `
            <div class="forum-post" style="background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem;">
                <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${safeTitle}</h4>
                <p style="opacity: 0.8; margin-bottom: 1rem;">${safeContent}</p>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7;">
                    <span>👤 ${safeAuthor}</span>
                    <span>📅 ${safeDate}</span>
                    ${safeReplies > 0 ? `<span>💬 ${safeReplies} replies</span>` : ''}
                </div>
            </div>
            `;
        }).join('');

        if (this.posts.length === 0) {
            postsHTML = `
                <div style="text-align: center; padding: 4rem; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">💬</div>
                    <p>No posts yet. Be the first to start a discussion!</p>
                </div>
            `;
        }

        modal.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${this.escapeHTML(forum.icon || '💬')} ${this.escapeHTML(forum.title || 'Forum')}</h2>
                        <p style="opacity: 0.8;">${this.escapeHTML(forum.description || '')}</p>
                    </div>
                    <button id="close-forum-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <button id="new-post-btn" style="width: 100%; padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                        ✏️ New Post
                    </button>
                </div>
                
                <div class="posts-list">
                    ${postsHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-forum-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('new-post-btn').addEventListener('click', () => {
            this.showNewPostForm(forum.id);
        });
    }

    showNewPostForm(forumId) {
        const formModal = document.createElement('div');
        formModal.id = 'new-post-modal';
        formModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        formModal.innerHTML = `
            <div style="max-width: 600px; width: 100%; background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">Create New Post</h3>
                
                <form id="new-post-form">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Title</label>
                        <input type="text" id="post-title" required style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; font-size: 1rem;">
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; font-weight: 600;">Content</label>
                        <textarea id="post-content" required rows="8" style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: white; font-size: 1rem; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            📝 Post
                        </button>
                        <button type="button" id="cancel-post-btn" style="flex: 1; padding: 0.75rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(formModal);

        document.getElementById('new-post-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            
            await this.createPost(forumId, title, content);
            formModal.remove();
            
            // Reload posts
            await this.loadPosts(forumId);
            const forumModal = document.getElementById('forum-modal');
            if (forumModal) {
                forumModal.remove();
                this.showForumModal(this.currentForum);
            }
        });

        document.getElementById('cancel-post-btn').addEventListener('click', () => {
            formModal.remove();
        });
    }

    async createPost(forumId, title, content) {
        if (typeof supabase === 'undefined' || !supabase) {
            // Mock post creation
            this.posts.unshift({
                id: Date.now().toString(),
                title,
                content,
                author: 'You',
                created_at: new Date().toISOString(),
                replies: 0
            });
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please log in to create a post');
                return;
            }

            const { data, error } = await supabase
                .from('forum_posts')
                .insert({
                    forum_id: forumId,
                    title,
                    content,
                    author_id: session.user.id,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating post:', error);
                alert('Error creating post. Please try again.');
                return;
            }

            this.posts.unshift(data);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post. Please try again.');
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryCommunityForums = new PlanetDiscoveryCommunityForums();
}

