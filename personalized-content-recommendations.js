/**
 * Personalized Content Recommendations
 * AI-powered content recommendation system
 */

class PersonalizedContentRecommendations {
    constructor() {
        this.userProfile = null;
        this.recommendations = [];
        this.init();
    }
    
    init() {
        this.loadUserProfile();
    }
    
    async loadUserProfile() {
        // Load user preferences and behavior
        if (window.supabase && window.supabase.auth.getUser) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.userProfile = await this.buildUserProfile(user.id);
            }
        }
    }
    
    async buildUserProfile(userId) {
        // Build user profile from behavior data
        const profile = {
            userId,
            interests: [],
            viewingHistory: [],
            preferences: {},
            interactions: []
        };
        
        // Fetch user data
        if (window.supabase) {
            const { data } = await window.supabase
                .from('user_interactions')
                .select('*')
                .eq('user_id', userId)
                .limit(100);
            
            if (data) {
                profile.interactions = data;
                profile.interests = this.extractInterests(data);
            }
        }
        
        return profile;
    }
    
    extractInterests(interactions) {
        // Extract interests from interactions
        const interests = {};
        
        interactions.forEach(interaction => {
            const category = interaction.category || 'general';
            interests[category] = (interests[category] || 0) + 1;
        });
        
        return Object.keys(interests)
            .sort((a, b) => interests[b] - interests[a])
            .slice(0, 5);
    }
    
    async getRecommendations(contentType = 'all', limit = 10) {
        if (!this.userProfile) {
            await this.loadUserProfile();
        }
        
        // Generate recommendations based on user profile
        const recommendations = await this.generateRecommendations(contentType, limit);
        this.recommendations = recommendations;
        
        return recommendations;
    }
    
    async generateRecommendations(contentType, limit) {
        // Collaborative filtering + content-based filtering
        const recommendations = [];
        
        // Content-based: similar to user's interests
        if (this.userProfile.interests.length > 0) {
            const contentBased = await this.getContentBasedRecommendations(
                this.userProfile.interests,
                contentType,
                limit / 2
            );
            recommendations.push(...contentBased);
        }
        
        // Collaborative: similar users' preferences
        const collaborative = await this.getCollaborativeRecommendations(
            this.userProfile.userId,
            contentType,
            limit / 2
        );
        recommendations.push(...collaborative);
        
        // Remove duplicates and rank
        return this.rankRecommendations(recommendations).slice(0, limit);
    }
    
    async getContentBasedRecommendations(interests, contentType, limit) {
        // Get content matching user interests
        if (window.supabase) {
            const { data } = await window.supabase
                .from('content')
                .select('*')
                .in('category', interests)
                .eq('type', contentType)
                .limit(limit * 2);
            
            return data || [];
        }
        return [];
    }
    
    async getCollaborativeRecommendations(userId, contentType, limit) {
        // Find similar users and get their preferences
        // Simplified implementation
        if (window.supabase) {
            const { data } = await window.supabase
                .from('content')
                .select('*')
                .eq('type', contentType)
                .order('popularity', { ascending: false })
                .limit(limit);
            
            return data || [];
        }
        return [];
    }
    
    rankRecommendations(recommendations) {
        // Rank by relevance score
        return recommendations.map(rec => ({
            ...rec,
            score: this.calculateRelevanceScore(rec)
        })).sort((a, b) => b.score - a.score);
    }
    
    calculateRelevanceScore(item) {
        let score = 0;
        
        // Interest match
        if (this.userProfile.interests.includes(item.category)) {
            score += 10;
        }
        
        // Popularity
        score += (item.popularity || 0) * 0.1;
        
        // Recency
        if (item.created_at) {
            const daysSince = (Date.now() - new Date(item.created_at)) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 10 - daysSince * 0.1);
        }
        
        return score;
    }
    
    async recordInteraction(itemId, interactionType) {
        // Record user interaction for learning
        if (window.supabase && this.userProfile) {
            await window.supabase
                .from('user_interactions')
                .insert({
                    user_id: this.userProfile.userId,
                    item_id: itemId,
                    interaction_type: interactionType,
                    timestamp: new Date().toISOString()
                });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.personalizedContentRecommendations = new PersonalizedContentRecommendations(); });
} else {
    window.personalizedContentRecommendations = new PersonalizedContentRecommendations();
}

