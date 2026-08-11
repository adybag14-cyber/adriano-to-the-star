/**
 * Collaborative Filtering (Advanced)
 * Advanced collaborative filtering for recommendations
 */

class CollaborativeFilteringAdvanced {
    constructor() {
        this.userSimilarity = new Map();
        this.init();
    }
    
    init() {
        this.calculateUserSimilarity();
        this.trackEvent('collab_filter_adv_initialized');
    }
    
    async calculateUserSimilarity() {
        // Calculate similarity between users
        if (window.supabase) {
            const { data: users } = await window.supabase
                .from('users')
                .select('id');
            
            if (users) {
                // Calculate pairwise similarity
                for (let i = 0; i < users.length; i++) {
                    for (let j = i + 1; j < users.length; j++) {
                        const similarity = await this.calculateSimilarity(users[i].id, users[j].id);
                        this.userSimilarity.set(`${users[i].id}_${users[j].id}`, similarity);
                    }
                }
            }
        }
    }
    
    async calculateSimilarity(userId1, userId2) {
        // Calculate cosine similarity between users
        // Based on their interaction history
        if (window.supabase) {
            const { data: interactions1 } = await window.supabase
                .from('user_interactions')
                .select('item_id')
                .eq('user_id', userId1);
            
            const { data: interactions2 } = await window.supabase
                .from('user_interactions')
                .select('item_id')
                .eq('user_id', userId2);
            
            if (interactions1 && interactions2) {
                const set1 = new Set(interactions1.map(i => i.item_id));
                const set2 = new Set(interactions2.map(i => i.item_id));
                
                const intersection = new Set([...set1].filter(x => set2.has(x)));
                const union = new Set([...set1, ...set2]);
                
                // Jaccard similarity
                return intersection.size / union.size;
            }
        }
        
        return 0;
    }
    
    async getRecommendations(userId, limit = 10) {
        // Get recommendations based on similar users
        const similarUsers = await this.findSimilarUsers(userId);
        return await this.getItemsFromSimilarUsers(similarUsers, userId, limit);
    }
    
    async findSimilarUsers(userId, limit = 5) {
        // Find most similar users
        const similarities = [];
        
        this.userSimilarity.forEach((similarity, key) => {
            const [id1, id2] = key.split('_');
            if (id1 === userId || id2 === userId) {
                const otherId = id1 === userId ? id2 : id1;
                similarities.push({ userId: otherId, similarity });
            }
        });
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }
    
    async getItemsFromSimilarUsers(similarUsers, userId, limit) {
        // Get items liked by similar users
        const itemScores = new Map();
        
        for (const similar of similarUsers) {
            if (window.supabase) {
                const { data: interactions } = await window.supabase
                    .from('user_interactions')
                    .select('item_id')
                    .eq('user_id', similar.userId)
                    .eq('interaction_type', 'like');
                
                if (interactions) {
                    interactions.forEach(interaction => {
                        const score = itemScores.get(interaction.item_id) || 0;
                        itemScores.set(interaction.item_id, score + similar.similarity);
                    });
                }
            }
        }
        
        // Sort by score and return top items
        return Array.from(itemScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([itemId]) => itemId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`collab_filter_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.collaborativeFilteringAdvanced = new CollaborativeFilteringAdvanced(); });
} else {
    window.collaborativeFilteringAdvanced = new CollaborativeFilteringAdvanced();
}

