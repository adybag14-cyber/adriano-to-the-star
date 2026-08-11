/**
 * Recommendation Explanations
 * Explains why items are recommended
 */

class RecommendationExplanations {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialize explanation system
    }
    
    async explainRecommendation(itemId, userId) {
        // Explain why an item is recommended
        const reasons = [];
        
        // Check collaborative reasons
        if (window.collaborativeFilteringAdvanced) {
            const similarUsers = await window.collaborativeFilteringAdvanced.findSimilarUsers(userId);
            if (similarUsers.length > 0) {
                reasons.push(`Users with similar interests also liked this`);
            }
        }
        
        // Check content-based reasons
        if (window.contentBasedFilteringAdvanced) {
            const userPreferences = await window.contentBasedFilteringAdvanced.getUserPreferences(userId);
            if (userPreferences.types) {
                reasons.push(`Matches your interest in ${Object.keys(userPreferences.types)[0]}`);
            }
        }
        
        return {
            itemId,
            reasons: reasons.length > 0 ? reasons : ['Recommended for you'],
            confidence: reasons.length > 0 ? 0.8 : 0.5
        };
    }
    
    formatExplanation(explanation) {
        // Format explanation for display
        return explanation.reasons.join('. ') + '.';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.recommendationExplanations = new RecommendationExplanations(); });
} else {
    window.recommendationExplanations = new RecommendationExplanations();
}

