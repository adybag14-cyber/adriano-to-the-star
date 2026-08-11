/**
 * Planet Favorites/Watchlist System
 * Allows users to save and manage favorite planets
 */

class PlanetFavoritesSystem {
    constructor() {
        this.favorites = [];
        this.supabase = this.resolveSupabaseClient();
        this.lastCloudError = null;
        this.init();
    }

    async init() {
        this.trackEvent('p_la_ne_tf_av_or_it_es_sy_st_em_initialized');
        await this.loadFavorites();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tf_av_or_it_es_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    resolveSupabaseClient() {
        if (typeof window === 'undefined') return null;
        const candidates = [window.supabaseClient, window.supabase];
        return candidates.find((candidate) =>
            candidate &&
            candidate.auth &&
            typeof candidate.auth.getUser === 'function' &&
            typeof candidate.from === 'function'
        ) || null;
    }


    /**
     * Load favorites from storage
     */
    async loadFavorites() {
        try {
            // Cloud sync is optional. Resolve only a fully initialized Supabase client.
            this.supabase = this.resolveSupabaseClient();
            if (this.supabase) {
                const { data: { user } } = await this.supabase.auth.getUser();
                if (user) {
                    const { data, error } = await this.supabase
                        .from('planet_favorites')
                        .select('*')
                        .eq('user_id', user.id);
                    
                    if (!error && data) {
                        this.favorites = data.map(fav => fav.kepid);
                        return;
                    }
                }
            }

            // Fallback to localStorage
            const stored = localStorage.getItem('planet-favorites');
            if (stored) {
                this.favorites = JSON.parse(stored);
            }
        } catch (error) {
            this.lastCloudError = error;
            const stored = localStorage.getItem('planet-favorites');
            if (stored) {
                this.favorites = JSON.parse(stored);
            }
        }
    }

    /**
     * Save favorites to storage
     */
    async saveFavorites() {
        try {
            // Cloud sync is optional. Resolve only a fully initialized Supabase client.
            this.supabase = this.resolveSupabaseClient();
            if (this.supabase) {
                const { data: { user } } = await this.supabase.auth.getUser();
                if (user) {
                    // Delete existing favorites
                    await this.supabase
                        .from('planet_favorites')
                        .delete()
                        .eq('user_id', user.id);

                    // Insert new favorites
                    if (this.favorites.length > 0) {
                        await this.supabase
                            .from('planet_favorites')
                            .insert(this.favorites.map(kepid => ({
                                user_id: user.id,
                                kepid: kepid
                            })));
                    }
                    return;
                }
            }

            // Fallback to localStorage
            localStorage.setItem('planet-favorites', JSON.stringify(this.favorites));
        } catch (error) {
            this.lastCloudError = error;
            localStorage.setItem('planet-favorites', JSON.stringify(this.favorites));
        }
    }

    /**
     * Check if planet is favorited
     */
    isFavorite(kepid) {
        return this.favorites.includes(String(kepid));
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite(kepid) {
        const kepidStr = String(kepid);
        const index = this.favorites.indexOf(kepidStr);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(kepidStr);
        }

        await this.saveFavorites();
        return this.isFavorite(kepid);
    }

    /**
     * Get all favorites
     */
    getFavorites() {
        return this.favorites;
    }

    /**
     * Clear all favorites
     */
    async clearFavorites() {
        this.favorites = [];
        await this.saveFavorites();
    }

    /**
     * Display favorites list
     */
    displayFavorites(container, planetDatabase = []) {
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = `
                <div class="favorites-empty" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 3rem; text-align: center;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">⭐ My Favorite Planets</h3>
                    <p style="color: rgba(255, 255, 255, 0.7);">You haven't favorited any planets yet.</p>
                    <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-top: 0.5rem;">Click the star icon on any planet to add it to your favorites.</p>
                </div>
            `;
            return;
        }

        // Find planet data for favorites
        const favoritePlanets = this.favorites.map(kepid => {
            return planetDatabase.find(p => String(p.kepid) === String(kepid));
        }).filter(p => p !== undefined);

        container.innerHTML = `
            <div class="favorites-container" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="favorites-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">⭐ My Favorite Planets (${favoritePlanets.length})</h3>
                    <button class="clear-favorites-btn" onclick="planetFavoritesSystem.clearFavorites().then(() => planetFavoritesSystem.displayFavorites(document.getElementById('favorites-container'), window.planetDatabase || []))" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #ef4444; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Clear All</button>
                </div>

                <div class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${favoritePlanets.map(planet => `
                        <div class="favorite-planet-card" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div>
                                    <h4 style="color: #ba944f; margin: 0 0 0.25rem 0;">${planet.kepler_name || planet.kepoi_name || 'Unknown'}</h4>
                                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">KEPID: ${planet.kepid}</div>
                                </div>
                                <button onclick="planetFavoritesSystem.toggleFavorite('${planet.kepid}').then(() => planetFavoritesSystem.displayFavorites(document.getElementById('favorites-container'), window.planetDatabase || []))" style="background: transparent; border: none; color: #ffd700; font-size: 1.5rem; cursor: pointer; padding: 0;">⭐</button>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.9rem;">
                                <div>
                                    <div style="color: rgba(255, 255, 255, 0.7);">Radius</div>
                                    <div style="color: #e0e0e0; font-weight: 600;">${planet.radius || 'Unknown'} R⊕</div>
                                </div>
                                <div>
                                    <div style="color: rgba(255, 255, 255, 0.7);">Period</div>
                                    <div style="color: #e0e0e0; font-weight: 600;">${planet.koi_period || 'Unknown'} days</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize planet favorites system
if (typeof window !== 'undefined') {
    window.PlanetFavoritesSystem = PlanetFavoritesSystem;
    window.planetFavoritesSystem = new PlanetFavoritesSystem();
}

