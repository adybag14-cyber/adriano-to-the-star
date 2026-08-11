/**
 * Hybrid Recommendation
 * Combines collaborative and content-based filtering
 */

class HybridRecommendation {
    constructor() {
        this.collaborativeWeight = 0.6;
        this.contentWeight = 0.4;
        this.init();
    }
    
    init() {
        // Initialize hybrid recommendation system
    }
    
    async getRecommendations(userId, limit = 10) {
        // Get recommendations using hybrid approach
        const collaborative = await this.getCollaborativeRecommendations(userId, limit * 2);
        const contentBased = await this.getContentBasedRecommendations(userId, limit * 2);
        
        // Combine and rank
        const combined = this.combineRecommendations(collaborative, contentBased);
        
        return combined.slice(0, limit);
    }
    
    async getCollaborativeRecommendations(userId, limit) {
        // Get collaborative filtering recommendations
        if (window.collaborativeFilteringAdvanced) {
            return await window.collaborativeFilteringAdvanced.getRecommendations(userId, limit);
        }
        return [];
    }
    
    async getContentBasedRecommendations(userId, limit) {
        // Get content-based recommendations
        if (window.contentBasedFilteringAdvanced) {
            return await window.contentBasedFilteringAdvanced.getRecommendations(userId, limit);
        }
        return [];
    }
    
    combineRecommendations(collaborative, contentBased) {
        // Combine recommendations with weighted scores
        const scores = new Map();
        
        // Add collaborative scores
        collaborative.forEach((itemId, index) => {
            const score = scores.get(itemId) || 0;
            scores.set(itemId, score + (this.collaborativeWeight * (collaborative.length - index) / collaborative.length));
        });
        
        // Add content-based scores
        contentBased.forEach((itemId, index) => {
            const score = scores.get(itemId) || 0;
            scores.set(itemId, score + (this.contentWeight * (contentBased.length - index) / contentBased.length));
        });
        
        // Sort by combined score
        return Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([itemId]) => itemId);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.hybridRecommendation = new HybridRecommendation(); });
} else {
    window.hybridRecommendation = new HybridRecommendation();
}

