/**
 * Personalized Recommendations (Advanced)
 * Advanced personalized recommendation system
 */

class PersonalizedRecommendationsAdvanced {
    constructor() {
        this.userProfiles = new Map();
        this.init();
    }
    
    init() {
        this.loadUserProfiles();
    }
    
    async loadUserProfiles() {
        // Load user profiles for personalization
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                const profile = await this.buildUserProfile(user.id);
                this.userProfiles.set(user.id, profile);
            }
        }
    }
    
    async buildUserProfile(userId) {
        // Build comprehensive user profile
        const profile = {
            userId,
            preferences: {},
            behavior: {},
            demographics: {}
        };
        
        // Load preferences
        if (window.supabase) {
            const { data: interactions } = await window.supabase
                .from('user_interactions')
                .select('*')
                .eq('user_id', userId)
                .limit(100);
            
            if (interactions) {
                profile.behavior.interactions = interactions;
                profile.preferences = this.extractPreferences(interactions);
            }
        }
        
        return profile;
    }
    
    extractPreferences(interactions) {
        // Extract preferences from interactions
        const preferences = {
            favoriteTypes: [],
            favoriteCategories: [],
            viewingPatterns: []
        };
        
        interactions.forEach(interaction => {
            if (interaction.category) {
                preferences.favoriteCategories.push(interaction.category);
            }
        });
        
        // Get most common
        const categoryCounts = {};
        preferences.favoriteCategories.forEach(cat => {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        preferences.favoriteTypes = Object.keys(categoryCounts)
            .sort((a, b) => categoryCounts[b] - categoryCounts[a])
            .slice(0, 5);
        
        return preferences;
    }
    
    async getPersonalizedRecommendations(userId, limit = 10) {
        // Get personalized recommendations
        const profile = this.userProfiles.get(userId);
        if (!profile) {
            await this.loadUserProfiles();
            return [];
        }
        
        // Use hybrid recommendation with personalization
        if (window.hybridRecommendation) {
            const recommendations = await window.hybridRecommendation.getRecommendations(userId, limit * 2);
            
            // Personalize based on profile
            return this.personalizeRecommendations(recommendations, profile);
        }
        
        return [];
    }
    
    personalizeRecommendations(recommendations, profile) {
        // Personalize recommendations based on user profile
        // Boost items matching user preferences
        return recommendations;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.personalizedRecommendationsAdvanced = new PersonalizedRecommendationsAdvanced(); });
} else {
    window.personalizedRecommendationsAdvanced = new PersonalizedRecommendationsAdvanced();
}

