/**
 * Recommendation Engine for Planets
 * Specialized recommendation engine for planets
 */

class RecommendationEnginePlanets {
    constructor() {
        this.recommendations = [];
        this.userProfile = null;
        this.strategy = (window.PLANET_RECOMMENDATION_STRATEGY || 'mixed');
        this.init();
    }
    
    init() {
        this.loadUserProfile();
    }
    
    async loadUserProfile() {
        // Load user planet preferences
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                const { data: profile } = await window.supabase
                    .from('user_planet_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                
                this.userProfile = profile || {
                    userId: user.id,
                    favoriteTypes: [],
                    viewedPlanets: [],
                    savedPlanets: []
                };
            }
        }
    }
    
    async getRecommendations(limit = 10) {
        // Get planet recommendations
        if (!this.userProfile) {
            await this.loadUserProfile();
        }
        
        // Multiple recommendation strategies
        const recommendations = [];
        const hasViewed = this.userProfile && Array.isArray(this.userProfile.viewedPlanets) && this.userProfile.viewedPlanets.length > 0;
        const hasFavorites = this.userProfile && Array.isArray(this.userProfile.favoriteTypes) && this.userProfile.favoriteTypes.length > 0;
        const isColdStart = !this.userProfile || (!hasViewed && !hasFavorites);
        
        if (isColdStart) {
            const popular = await this.getPopularPlanets(Math.ceil(limit / 2));
            const trending = await this.getTrendingPlanets(Math.floor(limit / 2));
            recommendations.push(...popular, ...trending);
            return this.rankRecommendations(recommendations).slice(0, limit);
        }
        
        let viewedLimit = Math.floor(limit / 3);
        let typeLimit = Math.floor(limit / 3);
        let popularLimit = limit - viewedLimit - typeLimit;
        
        if (this.strategy === 'type-first') {
            typeLimit = Math.floor(limit / 2);
            viewedLimit = Math.floor(limit / 4);
            popularLimit = limit - viewedLimit - typeLimit;
        } else if (this.strategy === 'similar-first') {
            viewedLimit = Math.floor(limit / 2);
            typeLimit = Math.floor(limit / 4);
            popularLimit = limit - viewedLimit - typeLimit;
        }
        
        // Similar to viewed planets
        if (hasViewed && viewedLimit > 0) {
            const similar = await this.getSimilarPlanets(
                this.userProfile.viewedPlanets[0],
                viewedLimit
            );
            recommendations.push(...similar);
        }
        
        // Based on favorite types
        if (hasFavorites && typeLimit > 0) {
            const typeBased = await this.getPlanetsByType(
                this.userProfile.favoriteTypes[0],
                typeLimit
            );
            recommendations.push(...typeBased);
        }
        
        // Popular planets
        const popular = await this.getPopularPlanets(popularLimit);
        recommendations.push(...popular);
        
        // Remove duplicates and rank
        return this.rankRecommendations(recommendations).slice(0, limit);
    }
    
    async getSimilarPlanets(planetId, limit) {
        // Get similar planets
        if (window.supabase) {
            const { data: planet } = await window.supabase
                .from('planets')
                .select('*')
                .eq('id', planetId)
                .single();
            
            if (planet) {
                const { data: similar } = await window.supabase
                    .from('planets')
                    .select('*')
                    .eq('type', planet.type)
                    .neq('id', planetId)
                    .limit(limit);
                
                return similar || [];
            }
        }
        
        return [];
    }
    
    async getPlanetsByType(type, limit) {
        // Get planets by type
        if (window.supabase) {
            const { data } = await window.supabase
                .from('planets')
                .select('*')
                .eq('type', type)
                .order('popularity', { ascending: false })
                .limit(limit);
            
            return data || [];
        }
        
        return [];
    }
    
    async getTrendingPlanets(limit) {
        if (!limit || limit <= 0) {
            return [];
        }
        if (window.supabase) {
            const { data } = await window.supabase
                .from('planets')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            return data || [];
        }
        return [];
    }
    
    async getPopularPlanets(limit) {
        // Get popular planets
        if (window.supabase) {
            const { data } = await window.supabase
                .from('planets')
                .select('*')
                .order('popularity', { ascending: false })
                .limit(limit);
            
            return data || [];
        }
        
        return [];
    }
    
    rankRecommendations(planets) {
        // Rank recommendations by relevance
        return planets.map(planet => ({
            ...planet,
            relevanceScore: this.calculateRelevanceScore(planet)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    calculateRelevanceScore(planet) {
        let score = 0;
        
        // Type match
        if (this.userProfile.favoriteTypes.includes(planet.type)) {
            score += 10;
        }
        
        // Popularity
        score += (planet.popularity || 0) / 100;
        
        // Recency
        if (planet.created_at) {
            const daysSince = (Date.now() - new Date(planet.created_at)) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 10 - daysSince * 0.1);
        }
        
        // Not viewed recently
        if (!this.userProfile.viewedPlanets.includes(planet.id)) {
            score += 5;
        }
        
        return score;
    }
    
    async recordInteraction(planetId, interactionType) {
        // Record user interaction
        if (window.supabase && this.userProfile) {
            await window.supabase
                .from('planet_interactions')
                .insert({
                    user_id: this.userProfile.userId,
                    planet_id: planetId,
                    interaction_type: interactionType,
                    timestamp: new Date().toISOString()
                });
            
            // Update profile
            if (interactionType === 'view' && !this.userProfile.viewedPlanets.includes(planetId)) {
                this.userProfile.viewedPlanets.unshift(planetId);
                this.userProfile.viewedPlanets = this.userProfile.viewedPlanets.slice(0, 20);
            }
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.recommendationEnginePlanets = new RecommendationEnginePlanets(); });
} else {
    window.recommendationEnginePlanets = new RecommendationEnginePlanets();
}

