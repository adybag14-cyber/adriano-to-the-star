/**
 * Planet Discovery GDPR Compliance Tools
 * Tools for GDPR compliance including data export and deletion
 */

class PlanetDiscoveryGDPRCompliance {
    constructor() {
        this.init();
    }

    init() {
        this.trackEvent('p_la_ne_td_is_co_ve_ry_gd_pr_co_mp_li_an_ce_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_gd_pr_co_mp_li_an_ce_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async exportUserData(userId) {
        return {
            profile: await this.getUserProfile(userId),
            claims: await this.getUserClaims(userId),
            favorites: await this.getUserFavorites(userId),
            bookmarks: await this.getUserBookmarks(userId),
            wishlist: await this.getUserWishlist(userId),
            feedback: await this.getUserFeedback(userId),
            analytics: await this.getUserAnalytics(userId),
            timestamp: new Date().toISOString()
        };
    }

    async getUserProfile(userId) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                return data;
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    async getUserClaims(userId) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data } = await supabase
                    .from('planet_claims')
                    .select('*')
                    .eq('user_id', userId);
                return data || [];
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    async getUserFavorites(userId) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data } = await supabase
                    .from('planet_favorites')
                    .select('*')
                    .eq('user_id', userId);
                return data || [];
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    async getUserBookmarks(userId) {
        // Similar to favorites
        return [];
    }

    async getUserWishlist(userId) {
        // Similar to favorites
        return [];
    }

    async getUserFeedback(userId) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data } = await supabase
                    .from('user_feedback')
                    .select('*')
                    .eq('user_id', userId);
                return data || [];
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    async getUserAnalytics(userId) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data } = await supabase
                    .from('analytics_events')
                    .select('*')
                    .eq('user_id', userId);
                return data || [];
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    async deleteUserData(userId) {
        const deletions = [];

        // Delete from all tables
        const tables = [
            'user_profiles',
            'planet_claims',
            'planet_favorites',
            'user_feedback',
            'analytics_events'
        ];

        if (typeof supabase !== 'undefined' && supabase) {
            for (const table of tables) {
                try {
                    const { error } = await supabase
                        .from(table)
                        .delete()
                        .eq('user_id', userId);
                    
                    if (error) {
                        deletions.push({ table, error: error.message });
                    } else {
                        deletions.push({ table, success: true });
                    }
                } catch (error) {
                    deletions.push({ table, error: error.message });
                }
            }
        }

        // Clear localStorage
        try {
            localStorage.clear();
        } catch (error) {
            deletions.push({ table: 'localStorage', error: error.message });
        }

        return deletions;
    }

    downloadUserData(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    renderGDPRPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="gdpr-panel" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">⚖️ GDPR Compliance</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button id="export-data-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        📥 Export My Data
                    </button>
                    <button id="delete-data-btn" style="padding: 0.75rem 1.5rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 10px; color: #ef4444; cursor: pointer; font-weight: 600;">
                        🗑️ Delete My Data
                    </button>
                </div>
            </div>
        `;

        document.getElementById('export-data-btn')?.addEventListener('click', async () => {
            if (typeof supabase !== 'undefined' && supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const userData = await this.exportUserData(user.id);
                    this.downloadUserData(userData);
                } else {
                    alert('Please log in to export your data');
                }
            }
        });

        document.getElementById('delete-data-btn')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                if (typeof supabase !== 'undefined' && supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const result = await this.deleteUserData(user.id);
                        alert('Data deletion completed. Check console for details.');
                        console.log('Deletion results:', result);
                    } else {
                        alert('Please log in to delete your data');
                    }
                }
            }
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryGDPRCompliance = new PlanetDiscoveryGDPRCompliance();
}

