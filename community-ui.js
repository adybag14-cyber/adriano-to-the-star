/**
 * Community UI Manager
 * Handles the User Interface for Auth, Profiles, and Comments
 */
class CommunityUI {
    constructor() {
        this.auth = new SupabaseAuthManager();
        this.reputation = window.getReputationSystem ? window.getReputationSystem() : null;
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.injectStyles();
        this.renderHeaderControls();
        this.setupModals();

        // Listen for auth changes to update UI
        document.addEventListener('auth:state-changed', () => this.updateUI());
        // Initial update
        setTimeout(() => this.updateUI(), 500);
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .community-btn {
                background: rgba(186, 148, 79, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.5);
                color: #ba944f;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Raleway', sans-serif;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .community-btn:hover {
                background: rgba(186, 148, 79, 0.2);
                box-shadow: 0 0 10px rgba(186, 148, 79, 0.2);
            }
            .community-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(5px);
                z-index: 20000;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .community-modal.active {
                opacity: 1;
                pointer-events: all;
            }
            .community-modal-content {
                background: rgba(10, 10, 15, 0.95);
                border: 1px solid #ba944f;
                padding: 2rem;
                border-radius: 8px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 0 30px rgba(186, 148, 79, 0.15);
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            .community-modal.active .community-modal-content {
                transform: translateY(0);
            }
            .form-group { margin-bottom: 1.5rem; }
            .form-label { display: block; color: #ba944f; margin-bottom: 0.5rem; font-size: 0.9rem; }
            .form-input { 
                width: 100%; 
                background: rgba(255,255,255,0.05); 
                border: 1px solid rgba(255,255,255,0.1); 
                padding: 0.8rem; 
                color: #fff; 
                border-radius: 4px;
                font-family: 'Raleway', sans-serif;
            }
            .form-input:focus { outline: none; border-color: #ba944f; }
            .profile-stat { text-align: center; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 4px; }
            .stat-value { font-size: 1.5rem; color: #ba944f; font-weight: bold; }
            .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
            
            /* Comment Section Styles */
            .comments-section {
                margin-top: 2rem;
                border-top: 1px solid rgba(255,255,255,0.1);
                padding-top: 2rem;
            }
            .comment-item {
                background: rgba(255,255,255,0.03);
                padding: 1rem;
                border-radius: 4px;
                margin-bottom: 1rem;
                border-left: 2px solid #ba944f;
            }
            .comment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.8rem;
                color: rgba(255,255,255,0.5);
            }
            .comment-author { color: #ba944f; font-weight: bold; }
        `;
        document.head.appendChild(style);
    }

    renderHeaderControls() {
        // Insert into header/nav
        const nav = document.querySelector('nav') || document.body;
        const container = document.createElement('div');
        container.id = 'auth-controls';
        container.style.cssText = 'position: fixed; top: 1rem; right: 4rem; z-index: 1000;';

        container.innerHTML = `
            <button id="login-btn" class="community-btn">
                <span>🔐</span> Login
            </button>
            <button id="profile-btn" class="community-btn" style="display:none">
                <span>👤</span> <span id="user-display-name">Profile</span>
            </button>
        `;

        nav.appendChild(container);

        document.getElementById('login-btn').addEventListener('click', () => this.openAuthModal());
        document.getElementById('profile-btn').addEventListener('click', () => this.openProfileModal());
    }

    setupModals() {
        // Auth Modal
        const authModal = document.createElement('div');
        authModal.id = 'auth-modal';
        authModal.className = 'community-modal';
        authModal.innerHTML = `
            <div class="community-modal-content">
                <div style="display:flex;justify-content:space-between;margin-bottom:1.5rem;">
                    <h2 style="margin:0;color:#ba944f;font-family:'Cormorant Garamond'">Join the Society</h2>
                    <button class="close-modal" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.5rem;">&times;</button>
                </div>
                <form id="auth-form">
                    <div class="form-group">
                        <label class="form-label">Username / Email</label>
                        <input type="text" class="form-input" id="auth-username" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" id="auth-password" required>
                    </div>
                    <button type="submit" class="community-btn" style="width:100%;justify-content:center;margin-bottom:1rem;">
                        Login / Register
                    </button>
                    <p style="text-align:center;font-size:0.8rem;color:rgba(255,255,255,0.5)">
                        If account doesn't exist, we'll create one automatically.
                    </p>
                </form>
            </div>
        `;
        document.body.appendChild(authModal);

        // Profile Modal
        const profileModal = document.createElement('div');
        profileModal.id = 'profile-modal';
        profileModal.className = 'community-modal';
        profileModal.innerHTML = `
            <div class="community-modal-content" style="max-width:500px">
                <div style="display:flex;justify-content:space-between;margin-bottom:1.5rem;">
                    <h2 style="margin:0;color:#ba944f;font-family:'Cormorant Garamond'">ID Card</h2>
                    <button class="close-modal" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.5rem;">&times;</button>
                </div>
                <div style="text-align:center;margin-bottom:2rem;">
                    <div style="width:80px;height:80px;background:#ba944f;border-radius:50%;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#000;">
                        👤
                    </div>
                    <h3 id="profile-username" style="margin:0;color:#fff">Explorer</h3>
                    <div id="profile-rank" style="color:rgba(255,255,255,0.6);font-size:0.9rem">Novice Astronomer</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;">
                    <div class="profile-stat">
                        <div class="stat-value" id="profile-points">0</div>
                        <div class="stat-label">Reputation Points</div>
                    </div>
                    <div class="profile-stat">
                        <div class="stat-value" id="profile-badges-count">0</div>
                        <div class="stat-label">Badges Earned</div>
                    </div>
                </div>
                <button id="logout-btn" class="community-btn" style="width:100%;justify-content:center;border-color:#ff4444;color:#ff4444;">
                    Logout
                </button>
            </div>
        `;
        document.body.appendChild(profileModal);

        // Event Listeners
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                authModal.classList.remove('active');
                profileModal.classList.remove('active');
            });
        });

        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('auth-username').value;
            const p = document.getElementById('auth-password').value;

            // Try login first
            let result = await this.auth.login(u, p);
            if (!result.success) {
                // Try register
                result = await this.auth.register(u, u + '@example.com', p);
                if (result.success) {
                    await this.auth.login(u, p); // Auto login after register
                }
            }

            if (result.success) {
                authModal.classList.remove('active');
                this.updateUI();
                this.notify(`Welcome, ${u}!`, 'success');
            } else {
                this.notify(result.error, 'error');
            }
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await this.auth.logout();
            profileModal.classList.remove('active');
            this.updateUI();
        });
    }

    openAuthModal() {
        document.getElementById('auth-modal').classList.add('active');
    }



    async updateProfileData() {
        const user = this.auth.getCurrentUser();
        if (!user) return;

        document.getElementById('profile-username').textContent = user.username;

        if (this.reputation) {
            await this.reputation.init();
            const info = this.reputation.getReputationLevelInfo();
            const points = this.reputation.reputation?.total_points || 0;
            const badges = this.reputation.badges?.length || 0;

            document.getElementById('profile-rank').textContent = info.name;
            document.getElementById('profile-points').textContent = points;
            document.getElementById('profile-badges-count').textContent = badges;
        }

        this.renderWalletSection();
    }

    renderWalletSection() {
        const container = document.getElementById('profile-wallet-container');
        if (!container) return; // Create container if missing or append to modal
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Extended Modal to include tabs
    openProfileModal() {
        document.getElementById('profile-modal').classList.add('active');

        // Re-render modal content with tabs if not already present
        const content = document.querySelector('#profile-modal .community-modal-content');
        if (!content.querySelector('.profile-tabs')) {
            content.style.maxWidth = '600px';
            content.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                    <h2 style="margin:0;color:#ba944f;font-family:'Cormorant Garamond'">Pilot Profile</h2>
                    <button class="close-modal" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.5rem;">&times;</button>
                </div>
                
                <div class="profile-tabs" style="display:flex;gap:1rem;margin-bottom:1.5rem;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <button class="tab-btn active" data-tab="id-card" style="background:none;border:none;color:#fff;padding:0.5rem 1rem;cursor:pointer;border-bottom:2px solid #ba944f;">ID Card</button>
                    <button class="tab-btn" data-tab="wallet" style="background:none;border:none;color:rgba(255,255,255,0.5);padding:0.5rem 1rem;cursor:pointer;">Wallet (Keys)</button>
                </div>

                <div id="tab-id-card" class="tab-content">
                    <div style="text-align:center;margin-bottom:2rem;">
                        <div style="width:80px;height:80px;background:#ba944f;border-radius:50%;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#000;">
                            👤
                        </div>
                        <h3 id="profile-username" style="margin:0;color:#fff">Loading...</h3>
                        <div id="profile-rank" style="color:rgba(255,255,255,0.6);font-size:0.9rem">...</div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;">
                        <div class="profile-stat">
                            <div class="stat-value" id="profile-points">-</div>
                            <div class="stat-label">Reputation Points</div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-value" id="profile-badges-count">-</div>
                            <div class="stat-label">Badges Earned</div>
                        </div>
                    </div>
                </div>

                <div id="tab-wallet" class="tab-content" style="display:none; max-height: 400px; overflow-y: auto;">
                    <div id="wallet-keys-list" style="display:grid; gap:1rem;">
                        <!-- Keys loaded here -->
                    </div>
                </div>

                <button id="logout-btn" class="community-btn" style="width:100%;justify-content:center;border-color:#ff4444;color:#ff4444;margin-top:1rem;">
                    Logout
                </button>
            `;

            // Re-bind close event
            content.querySelector('.close-modal').addEventListener('click', () => {
                document.getElementById('profile-modal').classList.remove('active');
            });

            // Re-bind logout
            document.getElementById('logout-btn').addEventListener('click', async () => {
                await this.auth.logout();
                document.getElementById('profile-modal').classList.remove('active');
                this.updateUI();
            });

            // Tab Logic
            content.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    content.querySelectorAll('.tab-btn').forEach(b => {
                        b.classList.remove('active');
                        b.style.color = 'rgba(255,255,255,0.5)';
                        b.style.borderBottom = 'none';
                    });
                    content.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

                    btn.classList.add('active');
                    btn.style.color = '#fff';
                    btn.style.borderBottom = '2px solid #ba944f';
                    document.getElementById(`tab-${btn.dataset.tab}`).style.display = 'block';
                });
            });
        }

        this.updateProfileData();
        this.updateWalletTab();
    }

    updateWalletTab() {
        if (!window.blockchainVerificationSystem) return;
        const keysList = document.getElementById('wallet-keys-list');
        const verifications = window.blockchainVerificationSystem.getMyVerifications();

        if (verifications.length === 0) {
            keysList.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:2rem;">No planetary assets found.<br>Claim a planet to mint your first key.</div>';
            return;
        }

        keysList.innerHTML = verifications.map(v => {
            const safeKepid = this.escapeHTML(v.kepid);
            const safeName = this.escapeHTML(v.metadata?.planetName || v.kepid);
            const safeId = this.escapeHTML(v.id);
            const safeEmail = this.escapeHTML(v.metadata?.owner);
            const safeDate = this.escapeHTML(v.createdAt);

            // Safer onclick handling
            const certData = encodeURIComponent(JSON.stringify({ kepid: v.kepid, name: v.metadata?.planetName }));
            const userData = encodeURIComponent(JSON.stringify({ claimedAt: v.createdAt, userEmail: v.metadata?.owner }));

            return `
            <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; border:1px solid rgba(186,148,79,0.3); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="color:#ba944f; font-weight:bold;">${safeName}</div>
                    <div style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-family:monospace;">ID: ${safeId.substring(0, 15)}...</div>
                    <div style="font-size:0.75rem; color:#4ade80;">● Verified Owner</div>
                </div>
                <button class="community-btn" 
                    onclick="const d=JSON.parse(decodeURIComponent('${certData}')); const u=JSON.parse(decodeURIComponent('${userData}')); window.nftCertificateGenerator.downloadCertificate(d, u)" 
                    style="padding:0.4rem 0.8rem; font-size:0.8rem;">
                    📄 Deed
                </button>
            </div>
            `;
        }).join('');
    }

    updateUI() {
        const isAuth = this.auth.isAuthenticated();
        const user = this.auth.getCurrentUser();

        document.getElementById('login-btn').style.display = isAuth ? 'none' : 'flex';
        document.getElementById('profile-btn').style.display = isAuth ? 'flex' : 'none';

        if (user) {
            document.getElementById('user-display-name').textContent = user.username;
        }
    }

    // Comment System Integration
    renderCommentsSection(container, planetName) {
        const safeId = this.escapeHTML(planetName).replace(/[^a-z0-9]/gi, '-').toLowerCase();

        container.innerHTML = `
            <h3 style="color:#ba944f;margin-bottom:1rem;font-family:'Cormorant Garamond'">Transmission Log (Comments)</h3>
            <div id="comments-list-${safeId}">
                <!-- Comments loaded here -->
            </div>
            <form id="comment-form-${safeId}" style="margin-top:1rem;">
                <textarea class="form-input" id="comment-text-${safeId}" placeholder="Share your theory..." style="height:80px;margin-bottom:0.5rem;" required></textarea>
                <button type="submit" class="community-btn" style="font-size:0.8rem;">Send Transmission</button>
            </form>
        `;

        this.loadComments(planetName);

        const form = document.getElementById(`comment-form-${safeId}`);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.auth.isAuthenticated()) {
                    this.openAuthModal();
                    return;
                }
                const textArea = document.getElementById(`comment-text-${safeId}`);
                const text = textArea.value;
                this.postComment(planetName, text);
                textArea.value = '';
            });
        }
    }

    loadComments(planetName) {
        const safeId = this.escapeHTML(planetName).replace(/[^a-z0-9]/gi, '-').toLowerCase();
        // Mock implementation leveraging localStorage
        const comments = JSON.parse(localStorage.getItem(`comments_${planetName}`) || '[]');
        const list = document.getElementById(`comments-list-${safeId}`);

        if (!list) return;

        if (comments.length === 0) {
            list.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-style:italic;">No transmissions received from this sector yet.</div>';
            return;
        }

        list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHTML(c.author)}</span>
                    <span>${this.escapeHTML(new Date(c.date).toLocaleDateString())}</span>
                </div>
                <div style="color:rgba(255,255,255,0.8);">${this.escapeHTML(c.text)}</div>
            </div>
        `).join('');
    }

    postComment(planetName, text) {
        const user = this.auth.getCurrentUser();
        // Simple sanitization before storage too, though escapeHTML on render is more critical
        // Not escaping here to preserve original text for potential edit features later

        const comments = JSON.parse(localStorage.getItem(`comments_${planetName}`) || '[]');
        comments.unshift({
            author: user.username,
            text: text,
            date: new Date().toISOString()
        });
        localStorage.setItem(`comments_${planetName}`, JSON.stringify(comments));

        // Reward reputation
        if (this.reputation) {
            this.reputation.updateActivity('message_sent');
        }

        this.loadComments(planetName);
        this.notify('Transmission broadcasted successfully', 'success');
    }

    notify(msg, type = 'info') {
        if (window.notifications) {
            window.notifications.show(msg, type);
        } else {
            console.log(`[${type}] ${msg}`);
            if (type === 'error') alert(msg);
        }
    }
}

// Init Global
window.communityUI = new CommunityUI();
