/**
 * Planet Discovery User Profiles
 * User profile system with achievements and statistics
 */

class PlanetDiscoveryUserProfiles {
    constructor() {
        this.profiles = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        console.log('👤 User profiles initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_us_er_pr_of_il_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async loadCurrentUser() {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    this.currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || 'User'
                    };
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        }
    }

    renderUserProfiles(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        if (!this.currentUser) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px;">
                    <p style="opacity: 0.8;">Please log in to view your profile</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="user-profiles-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">👤 User Profile</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="width: 120px; height: 120px; background: linear-gradient(135deg, rgba(186, 148, 79, 0.3), rgba(74, 222, 128, 0.3)); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                            👤
                        </div>
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${this.currentUser.name}</h4>
                        <p style="opacity: 0.7; font-size: 0.9rem;">${this.currentUser.email}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                        <div style="text-align: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                            <div style="font-size: 2rem; color: #ba944f; font-weight: bold;" id="planets-claimed">0</div>
                            <div style="opacity: 0.7; font-size: 0.85rem;">Planets Claimed</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                            <div style="font-size: 2rem; color: #4ade80; font-weight: bold;" id="achievements-count">0</div>
                            <div style="opacity: 0.7; font-size: 0.85rem;">Achievements</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                            <div style="font-size: 2rem; color: #3b82f6; font-weight: bold;" id="rank-position">-</div>
                            <div style="opacity: 0.7; font-size: 0.85rem;">Rank</div>
                        </div>
                    </div>
                    
                    <button id="edit-profile-btn" style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        ✏️ Edit Profile
                    </button>
                </div>
            </div>
        `;

        this.loadUserStats();

        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            this.showEditProfileForm();
        });
    }

    async loadUserStats() {
        if (!this.currentUser) return;

        try {
            // Load user statistics
            const claims = await this.getUserClaims();
            const achievements = await this.getUserAchievements();
            const rank = await this.getUserRank();

            document.getElementById('planets-claimed').textContent = claims.length;
            document.getElementById('achievements-count').textContent = achievements.length;
            document.getElementById('rank-position').textContent = rank || '-';
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async getUserClaims() {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data } = await supabase
                    .from('planet_claims')
                    .select('*')
                    .eq('user_id', this.currentUser.id);
                return data || [];
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    async getUserAchievements() {
        // Would load from achievements system
        return [];
    }

    async getUserRank() {
        // Would load from leaderboard
        return null;
    }

    showEditProfileForm() {
        alert('Edit profile form coming soon!');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryUserProfiles = new PlanetDiscoveryUserProfiles();
}

