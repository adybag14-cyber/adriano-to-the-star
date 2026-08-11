/**
 * Planet Discovery Social Feed
 * Social feed of planet discovery activities and updates
 */

class PlanetDiscoverySocialFeed {
    constructor() {
        this.posts = [];
        this.filters = {
            type: 'all',
            user: null
        };
        this.init();
    }

    init() {
        this.loadPosts();
        console.log('📱 Social feed initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_so_ci_al_fe_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadPosts() {
        this.posts = [
            {
                id: 'post-1',
                user: 'Dr. Sarah Johnson',
                avatar: '👩‍🔬',
                action: 'discovered',
                planet: 'Kepler-452b',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                likes: 42,
                comments: 8,
                type: 'discovery'
            },
            {
                id: 'post-2',
                user: 'Prof. Michael Chen',
                avatar: '👨‍🔬',
                action: 'claimed',
                planet: 'HD 209458 b',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                likes: 28,
                comments: 5,
                type: 'claim'
            }
        ];
    }

    renderSocialFeed(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="social-feed-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📱 Social Feed</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button class="feed-filter-btn active" data-filter="all" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            All
                        </button>
                        <button class="feed-filter-btn" data-filter="discovery" style="padding: 0.75rem 1.5rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Discoveries
                        </button>
                        <button class="feed-filter-btn" data-filter="claim" style="padding: 0.75rem 1.5rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                            Claims
                        </button>
                    </div>
                </div>
                
                <div id="feed-posts" class="feed-posts" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${this.renderPosts()}
                </div>
            </div>
        `;

        document.querySelectorAll('.feed-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterFeed(e.target.dataset.filter);
            });
        });
    }

    renderPosts() {
        return this.posts.map(post => this.createPostCard(post)).join('');
    }

    createPostCard(post) {
        const timeAgo = this.getTimeAgo(new Date(post.timestamp));

        return `
            <div class="feed-post" data-post-id="${post.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <div style="font-size: 2.5rem;">${post.avatar}</div>
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.25rem;">${post.user}</h4>
                        <p style="opacity: 0.7; font-size: 0.85rem;">${timeAgo}</p>
                    </div>
                </div>
                <p style="opacity: 0.9; margin-bottom: 1rem; line-height: 1.6;">
                    ${post.user} ${post.action} <span style="color: #ba944f; font-weight: 600;">${post.planet}</span>
                </p>
                <div style="display: flex; gap: 2rem; padding-top: 1rem; border-top: 1px solid rgba(186, 148, 79, 0.2);">
                    <button class="like-btn" data-post-id="${post.id}" style="background: transparent; border: none; color: rgba(255, 255, 255, 0.7); cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                        ❤️ ${post.likes}
                    </button>
                    <button class="comment-btn" data-post-id="${post.id}" style="background: transparent; border: none; color: rgba(255, 255, 255, 0.7); cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                        💬 ${post.comments}
                    </button>
                    <button class="share-btn" data-post-id="${post.id}" style="background: transparent; border: none; color: rgba(255, 255, 255, 0.7); cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                        📤 Share
                    </button>
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    filterFeed(type) {
        this.filters.type = type;
        
        document.querySelectorAll('.feed-filter-btn').forEach(btn => {
            if (btn.dataset.filter === type) {
                btn.style.background = 'rgba(186, 148, 79, 0.2)';
                btn.style.borderColor = 'rgba(186, 148, 79, 0.5)';
                btn.style.color = '#ba944f';
            } else {
                btn.style.background = 'rgba(107, 114, 128, 0.2)';
                btn.style.borderColor = 'rgba(107, 114, 128, 0.5)';
                btn.style.color = 'rgba(255, 255, 255, 0.7)';
            }
        });

        const filtered = type === 'all' 
            ? this.posts 
            : this.posts.filter(p => p.type === type);

        const container = document.getElementById('feed-posts');
        if (container) {
            container.innerHTML = filtered.map(post => this.createPostCard(post)).join('');
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoverySocialFeed = new PlanetDiscoverySocialFeed();
}

