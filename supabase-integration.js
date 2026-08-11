/**
 * Supabase Integration for Exoplanet Pioneer
 * Handles Authentication, Cloud Saves, and Leaderboards
 */

class SupabaseService {
    constructor() {
        this.client = null;
        this.user = null;
        this.isEnabled = false;
        this.unavailableReason = null;
        this.lastError = null;

        // Initialize
        this.init();
    }

    init() {
        if (typeof supabase === 'undefined') {
            this.unavailableReason = 'library-missing';
            return;
        }

        if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.enabled) {
            this.unavailableReason = 'config-disabled';
            return;
        }

        try {
            // Check if window.supabase is already an initialized client (from supabase-config.js)
            // or the library itself (from CDN)
            if (supabase.createClient) {
                // It's the library, create a new client
                this.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            } else if (supabase.auth && supabase.from) {
                // It's already an initialized client instance
                this.client = supabase;
            } else {
                console.error('Supabase global object is unidentified:', supabase);
                return;
            }

            this.isEnabled = true;

            // Check session
            this.checkSession().catch((error) => { this.lastError = error; });
        } catch (e) {
            this.lastError = e;
            this.isEnabled = false;
            this.unavailableReason = 'initialization-failed';
        }
    }

    async checkSession() {
        if (!this.client) return;
        const { data: { session } } = await this.client.auth.getSession();
        if (session) {
            this.user = session.user;
        }
    }

    async signUp(email, password, username) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: username }
            }
        });

        if (data.user) {
            this.user = data.user;
        }
        return { data, error };
    }

    async signIn(email, password) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (data.user) {
            this.user = data.user;
        }
        return { data, error };
    }

    async signOut() {
        if (!this.client) return;
        await this.client.auth.signOut();
        this.user = null;
    }

    // --- Cloud Saves ---

    async saveGame(gameId, slotId, saveData) {
        if (!this.client || !this.user) return { error: 'Not logged in' };

        // Check if save exists
        const { data: existing } = await this.client
            .from('game_saves')
            .select('id')
            .eq('user_id', this.user.id)
            .eq('game_id', gameId)
            .eq('slot_id', slotId)
            .single();

        let result;
        if (existing) {
            // Update
            result = await this.client
                .from('game_saves')
                .update({
                    save_data: saveData,
                    updated_at: new Date()
                })
                .eq('id', existing.id);
        } else {
            // Insert
            result = await this.client
                .from('game_saves')
                .insert({
                    user_id: this.user.id,
                    game_id: gameId,
                    slot_id: slotId,
                    save_data: saveData
                });
        }

        return result;
    }

    async loadGame(gameId, slotId) {
        if (!this.client || !this.user) return { error: 'Not logged in' };

        const { data, error } = await this.client
            .from('game_saves')
            .select('save_data')
            .eq('user_id', this.user.id)
            .eq('game_id', gameId)
            .eq('slot_id', slotId)
            .single();

        return { data: data ? data.save_data : null, error };
    }

    // --- Leaderboards ---

    async submitScore(gameId, score, details) {
        if (!this.client || !this.user) return { error: 'Not logged in' };

        const { error } = await this.client
            .from('leaderboards')
            .insert({
                user_id: this.user.id,
                game_id: gameId,
                score: score,
                details: details
            });

        return { error };
    }

    async getLeaderboard(gameId, limit = 10) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client
            .from('leaderboards')
            .select('score, details, submitted_at, profiles(username)')
            .eq('game_id', gameId)
            .order('score', { ascending: false })
            .limit(limit);

        return { data, error };
    }

    // --- System Claims (Meta-Galaxy) ---

    async claimSystem(systemId, systemName, coordinates) {
        if (!this.client || !this.user) return { error: 'Not logged in' };

        const { data, error } = await this.client
            .from('claimed_systems')
            .upsert({
                system_id: systemId,
                user_id: this.user.id,
                system_name: systemName,
                coordinates: coordinates,
                claimed_at: new Date()
            }, { onConflict: 'system_id' })
            .select();

        return { data, error };
    }

    async getClaimedSystems() {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client
            .from('claimed_systems')
            .select('system_id, system_name, coordinates, profiles(username)')
            .limit(1000);

        return { data, error };
    }
}
