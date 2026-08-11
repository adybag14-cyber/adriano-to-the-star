/**
 * Recommendation Diversity
 * Ensures diverse recommendations
 */

class RecommendationDiversity {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialize diversity system
    }
    
    async diversifyRecommendations(recommendations, diversityFactor = 0.3) {
        // Add diversity to recommendations
        const diversified = [];
        const usedCategories = new Set();
        
        for (const itemId of recommendations) {
            const item = await this.getItem(itemId);
            
            if (item) {
                const category = item.category || item.type;
                
                // Ensure diversity
                if (!usedCategories.has(category) || Math.random() > diversityFactor) {
                    diversified.push(itemId);
                    usedCategories.add(category);
                }
            }
        }
        
        // Fill remaining slots with diverse items
        while (diversified.length < recommendations.length) {
            const diverseItem = await this.getDiverseItem(usedCategories);
            if (diverseItem) {
                diversified.push(diverseItem);
                usedCategories.add(diverseItem.category);
            } else {
                break;
            }
        }
        
        return diversified;
    }
    
    async getItem(itemId) {
        // Get item details
        if (window.supabase) {
            const { data } = await window.supabase
                .from('planets')
                .select('*')
                .eq('id', itemId)
                .single();
            
            return data;
        }
        return null;
    }
    
    async getDiverseItem(excludedCategories) {
        // Get item from different category
        if (window.supabase) {
            const { data } = await window.supabase
                .from('planets')
                .select('*')
                .not('category', 'in', Array.from(excludedCategories))
                .limit(1)
                .single();
            
            return data;
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.recommendationDiversity = new RecommendationDiversity(); });
} else {
    window.recommendationDiversity = new RecommendationDiversity();
}

