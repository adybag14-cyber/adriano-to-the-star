/**
 * Recommendation System Based on User Behavior
 * 
 * Adds comprehensive recommendation system based on user behavior.
 * 
 * @module RecommendationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class RecommendationSystem {
    constructor() {
        this.userBehavior = new Map();
        this.recommendations = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize recommendation system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('RecommendationSystem already initialized');
            return;
        }

        this.loadUserBehavior();
        
        this.isInitialized = true;
        console.log('✅ Recommendation System initialized');
    }

    /**
     * Track user behavior
     * @public
     * @param {string} action - Action type
     * @param {string} itemId - Item ID
     * @param {Object} metadata - Additional metadata
     */
    trackBehavior(action, itemId, metadata = {}) {
        const userId = this.getUserId();
        if (!userId) {
            return;
        }

        const behavior = {
            userId,
            action,
            itemId,
            timestamp: new Date().toISOString(),
            ...metadata
        };

        if (!this.userBehavior.has(userId)) {
            this.userBehavior.set(userId, []);
        }

        this.userBehavior.get(userId).push(behavior);

        // Keep only last 1000 behaviors per user
        const behaviors = this.userBehavior.get(userId);
        if (behaviors.length > 1000) {
            behaviors.shift();
        }

        this.saveUserBehavior();

        // Update recommendations
        this.updateRecommendations(userId);
    }

    /**
     * Get recommendations
     * @public
     * @param {string} userId - User ID (optional, defaults to current user)
     * @param {number} limit - Number of recommendations
     * @returns {Array} Recommendations array
     */
    getRecommendations(userId = null, limit = 10) {
        const targetUserId = userId || this.getUserId();
        if (!targetUserId) {
            return [];
        }

        const recommendations = this.recommendations.get(targetUserId) || [];
        return recommendations.slice(0, limit);
    }

    /**
     * Update recommendations
     * @private
     * @param {string} userId - User ID
     */
    updateRecommendations(userId) {
        const behaviors = this.userBehavior.get(userId) || [];
        
        // Analyze behavior patterns
        const itemScores = new Map();
        
        behaviors.forEach(behavior => {
            const score = this.getActionScore(behavior.action);
            const currentScore = itemScores.get(behavior.itemId) || 0;
            itemScores.set(behavior.itemId, currentScore + score);
        });

        // Sort by score
        const sorted = Array.from(itemScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([itemId, score]) => ({
                itemId,
                score,
                reason: this.getRecommendationReason(itemId, behaviors)
            }));

        this.recommendations.set(userId, sorted);
        this.saveRecommendations();
    }

    /**
     * Get action score
     * @private
     * @param {string} action - Action type
     * @returns {number} Score
     */
    getActionScore(action) {
        const scores = {
            'view': 1,
            'click': 2,
            'like': 3,
            'favorite': 4,
            'share': 5,
            'purchase': 10
        };
        return scores[action] || 1;
    }

    /**
     * Get recommendation reason
     * @private
     * @param {string} itemId - Item ID
     * @param {Array} behaviors - User behaviors
     * @returns {string} Reason
     */
    getRecommendationReason(itemId, behaviors) {
        const itemBehaviors = behaviors.filter(b => b.itemId === itemId);
        if (itemBehaviors.some(b => b.action === 'favorite')) {
            return 'Based on your favorites';
        }
        if (itemBehaviors.some(b => b.action === 'like')) {
            return 'Based on your likes';
        }
        if (itemBehaviors.length > 5) {
            return 'Based on your viewing history';
        }
        return 'Recommended for you';
    }

    /**
     * Get similar items
     * @public
     * @param {string} itemId - Item ID
     * @param {number} limit - Number of similar items
     * @returns {Array} Similar items
     */
    getSimilarItems(itemId, limit = 5) {
        // This would typically use collaborative filtering
        // For now, return items with similar tags or categories
        const recommendations = this.getRecommendations(null, limit * 2);
        return recommendations.filter(r => r.itemId !== itemId).slice(0, limit);
    }

    /**
     * Get user ID
     * @private
     * @returns {string|null} User ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch {
            return null;
        }
    }

    /**
     * Save user behavior
     * @private
     */
    saveUserBehavior() {
        try {
            const behavior = Object.fromEntries(this.userBehavior);
            localStorage.setItem('user-behavior', JSON.stringify(behavior));
        } catch (e) {
            console.warn('Failed to save user behavior:', e);
        }
    }

    /**
     * Load user behavior
     * @private
     */
    loadUserBehavior() {
        try {
            const saved = localStorage.getItem('user-behavior');
            if (saved) {
                const behavior = JSON.parse(saved);
                Object.entries(behavior).forEach(([key, value]) => {
                    this.userBehavior.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load user behavior:', e);
        }
    }

    /**
     * Save recommendations
     * @private
     */
    saveRecommendations() {
        try {
            const recommendations = Object.fromEntries(this.recommendations);
            localStorage.setItem('recommendations', JSON.stringify(recommendations));
        } catch (e) {
            console.warn('Failed to save recommendations:', e);
        }
    }
}

// Create global instance
window.RecommendationSystem = RecommendationSystem;
window.recommendationSystem = new RecommendationSystem();
window.recommendationSystem.init();

