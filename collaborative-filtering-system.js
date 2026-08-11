/**
 * Collaborative Filtering System
 * Implements user-based and item-based collaborative filtering algorithms
 */

class CollaborativeFilteringSystem {
    constructor() {
        this.users = new Map();
        this.items = new Map();
        this.ratings = new Map(); // Map<userId, Map<itemId, rating>>
        this.similarityCache = new Map();
        this.recommendationCache = new Map();
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.trackEvent('collab_filter_sys_initialized');
    }

    setupEventListeners() {
        // Track user ratings
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-rating-input]')) {
                const userId = e.target.getAttribute('data-user-id') || this.getCurrentUserId();
                const itemId = e.target.getAttribute('data-item-id');
                const rating = parseFloat(e.target.value);
                
                if (userId && itemId && !isNaN(rating)) {
                    this.addRating(userId, itemId, rating);
                }
            }
        });

        // Load recommendations on page load
        if (document.readyState === 'complete') {
            this.loadRecommendations();
        } else {
            window.addEventListener('load', () => this.loadRecommendations());
        }
    }

    /**
     * Load data from storage or API
     */
    async loadData() {
        try {
            const stored = localStorage.getItem('collaborativeFilteringData');
            if (stored) {
                const data = JSON.parse(stored);
                this.users = new Map(data.users || []);
                this.items = new Map(data.items || []);
                this.ratings = this.deserializeRatings(data.ratings || {});
            }
        } catch (error) {
            console.error('Error loading collaborative filtering data:', error);
        }
    }

    /**
     * Deserialize ratings from JSON
     */
    deserializeRatings(ratingsObj) {
        const ratings = new Map();
        Object.keys(ratingsObj).forEach(userId => {
            ratings.set(userId, new Map(Object.entries(ratingsObj[userId])));
        });
        return ratings;
    }

    /**
     * Serialize ratings to JSON
     */
    serializeRatings() {
        const obj = {};
        this.ratings.forEach((itemRatings, userId) => {
            obj[userId] = Object.fromEntries(itemRatings);
        });
        return obj;
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        // Try to get from various sources
        return localStorage.getItem('userId') || 
               document.body.getAttribute('data-user-id') ||
               'anonymous';
    }

    /**
     * Add or update a rating
     */
    addRating(userId, itemId, rating) {
        if (!this.users.has(userId)) {
            this.users.set(userId, { id: userId, preferences: {} });
        }

        if (!this.items.has(itemId)) {
            this.items.set(itemId, { id: itemId, metadata: {} });
        }

        if (!this.ratings.has(userId)) {
            this.ratings.set(userId, new Map());
        }

        this.ratings.get(userId).set(itemId, rating);
        this.invalidateCache();
        this.saveData();

        // Trigger event
        const event = new CustomEvent('ratingAdded', {
            detail: { userId, itemId, rating },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Get user-based recommendations
     */
    getUserBasedRecommendations(userId, limit = 10) {
        const cacheKey = `user_${userId}_${limit}`;
        if (this.recommendationCache.has(cacheKey)) {
            return this.recommendationCache.get(cacheKey);
        }

        const userRatings = this.ratings.get(userId);
        if (!userRatings || userRatings.size === 0) {
            return [];
        }

        // Find similar users
        const similarUsers = this.findSimilarUsers(userId);
        
        // Calculate predicted ratings for unrated items
        const predictions = new Map();
        
        this.items.forEach((item, itemId) => {
            if (userRatings.has(itemId)) {
                return; // Skip already rated items
            }

            const predictedRating = this.predictUserRating(userId, itemId, similarUsers);
            if (predictedRating > 0) {
                predictions.set(itemId, {
                    itemId,
                    item: item,
                    predictedRating,
                    confidence: this.calculateConfidence(userId, itemId, similarUsers)
                });
            }
        });

        const recommendations = Array.from(predictions.values())
            .sort((a, b) => b.predictedRating - a.predictedRating)
            .slice(0, limit);

        this.recommendationCache.set(cacheKey, recommendations);
        return recommendations;
    }

    /**
     * Get item-based recommendations
     */
    getItemBasedRecommendations(userId, limit = 10) {
        const cacheKey = `item_${userId}_${limit}`;
        if (this.recommendationCache.has(cacheKey)) {
            return this.recommendationCache.get(cacheKey);
        }

        const userRatings = this.ratings.get(userId);
        if (!userRatings || userRatings.size === 0) {
            return [];
        }

        const predictions = new Map();

        this.items.forEach((item, itemId) => {
            if (userRatings.has(itemId)) {
                return; // Skip already rated items
            }

            const predictedRating = this.predictItemBasedRating(userId, itemId, userRatings);
            if (predictedRating > 0) {
                predictions.set(itemId, {
                    itemId,
                    item: item,
                    predictedRating,
                    confidence: this.calculateItemConfidence(itemId, userRatings)
                });
            }
        });

        const recommendations = Array.from(predictions.values())
            .sort((a, b) => b.predictedRating - a.predictedRating)
            .slice(0, limit);

        this.recommendationCache.set(cacheKey, recommendations);
        return recommendations;
    }

    /**
     * Find similar users using cosine similarity
     */
    findSimilarUsers(userId, limit = 50) {
        const cacheKey = `similar_${userId}`;
        if (this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }

        const userRatings = this.ratings.get(userId);
        if (!userRatings) {
            return [];
        }

        const similarities = [];

        this.ratings.forEach((otherRatings, otherUserId) => {
            if (otherUserId === userId) {
                return;
            }

            const similarity = this.cosineSimilarity(userRatings, otherRatings);
            if (similarity > 0) {
                similarities.push({
                    userId: otherUserId,
                    similarity
                });
            }
        });

        similarities.sort((a, b) => b.similarity - a.similarity);
        const result = similarities.slice(0, limit);
        
        this.similarityCache.set(cacheKey, result);
        return result;
    }

    /**
     * Calculate cosine similarity between two rating vectors
     */
    cosineSimilarity(ratings1, ratings2) {
        const commonItems = [];
        
        ratings1.forEach((rating1, itemId) => {
            if (ratings2.has(itemId)) {
                commonItems.push({
                    itemId,
                    rating1,
                    rating2: ratings2.get(itemId)
                });
            }
        });

        if (commonItems.length === 0) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        commonItems.forEach(({ rating1, rating2 }) => {
            dotProduct += rating1 * rating2;
            norm1 += rating1 * rating1;
            norm2 += rating2 * rating2;
        });

        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator > 0 ? dotProduct / denominator : 0;
    }

    /**
     * Predict rating using user-based approach
     */
    predictUserRating(userId, itemId, similarUsers) {
        const userRatings = this.ratings.get(userId);
        const userAvg = this.calculateAverageRating(userRatings);

        let numerator = 0;
        let denominator = 0;

        similarUsers.forEach(({ userId: similarUserId, similarity }) => {
            const similarUserRatings = this.ratings.get(similarUserId);
            if (!similarUserRatings || !similarUserRatings.has(itemId)) {
                return;
            }

            const similarUserAvg = this.calculateAverageRating(similarUserRatings);
            const rating = similarUserRatings.get(itemId);
            
            numerator += similarity * (rating - similarUserAvg);
            denominator += Math.abs(similarity);
        });

        if (denominator === 0) {
            return 0;
        }

        return userAvg + (numerator / denominator);
    }

    /**
     * Predict rating using item-based approach
     */
    predictItemBasedRating(userId, itemId, userRatings) {
        const userAvg = this.calculateAverageRating(userRatings);

        let numerator = 0;
        let denominator = 0;

        userRatings.forEach((rating, ratedItemId) => {
            if (ratedItemId === itemId) {
                return;
            }

            const similarity = this.getItemSimilarity(ratedItemId, itemId);
            if (similarity > 0) {
                numerator += similarity * (rating - userAvg);
                denominator += Math.abs(similarity);
            }
        });

        if (denominator === 0) {
            return 0;
        }

        return userAvg + (numerator / denominator);
    }

    /**
     * Calculate item similarity
     */
    getItemSimilarity(itemId1, itemId2) {
        const cacheKey = `item_sim_${itemId1}_${itemId2}`;
        if (this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }

        const item1Ratings = new Map();
        const item2Ratings = new Map();

        // Collect ratings for both items
        this.ratings.forEach((userRatings, userId) => {
            if (userRatings.has(itemId1)) {
                item1Ratings.set(userId, userRatings.get(itemId1));
            }
            if (userRatings.has(itemId2)) {
                item2Ratings.set(userId, userRatings.get(itemId2));
            }
        });

        const similarity = this.cosineSimilarity(item1Ratings, item2Ratings);
        this.similarityCache.set(cacheKey, similarity);
        return similarity;
    }

    /**
     * Calculate average rating
     */
    calculateAverageRating(ratings) {
        if (!ratings || ratings.size === 0) {
            return 0;
        }

        let sum = 0;
        ratings.forEach(rating => {
            sum += rating;
        });

        return sum / ratings.size;
    }

    /**
     * Calculate recommendation confidence
     */
    calculateConfidence(userId, itemId, similarUsers) {
        const relevantUsers = similarUsers.filter(u => {
            const ratings = this.ratings.get(u.userId);
            return ratings && ratings.has(itemId);
        });

        if (relevantUsers.length === 0) {
            return 0;
        }

        const avgSimilarity = relevantUsers.reduce((sum, u) => sum + u.similarity, 0) / relevantUsers.length;
        const coverage = relevantUsers.length / similarUsers.length;

        return avgSimilarity * coverage;
    }

    /**
     * Calculate item-based confidence
     */
    calculateItemConfidence(itemId, userRatings) {
        let totalSimilarity = 0;
        let count = 0;

        userRatings.forEach((rating, ratedItemId) => {
            const similarity = this.getItemSimilarity(ratedItemId, itemId);
            if (similarity > 0) {
                totalSimilarity += similarity;
                count++;
            }
        });

        return count > 0 ? totalSimilarity / count : 0;
    }

    /**
     * Display recommendations
     */
    displayRecommendations(containerId, userId = null, algorithm = 'user-based', limit = 10) {
        const targetUserId = userId || this.getCurrentUserId();
        const recommendations = algorithm === 'item-based' 
            ? this.getItemBasedRecommendations(targetUserId, limit)
            : this.getUserBasedRecommendations(targetUserId, limit);

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Recommendation container not found:', containerId);
            return;
        }

        container.innerHTML = '';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', `Recommendations using ${algorithm} filtering`);

        if (recommendations.length === 0) {
            container.innerHTML = '<p>No recommendations available. Rate some items to get personalized recommendations!</p>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'collaborative-recommendations';
        list.setAttribute('role', 'list');

        recommendations.forEach((rec, index) => {
            const element = this.createRecommendationElement(rec, index);
            list.appendChild(element);
        });

        container.appendChild(list);
    }

    /**
     * Create recommendation element
     */
    createRecommendationElement(rec, index) {
        const element = document.createElement('div');
        element.className = 'collaborative-recommendation-item';
        element.setAttribute('role', 'listitem');
        element.setAttribute('data-item-id', rec.itemId);
        element.setAttribute('tabindex', '0');

        element.innerHTML = `
            <div class="recommendation-content">
                <h4>${this.escapeHtml(rec.item.id)}</h4>
                <div class="recommendation-metrics">
                    <span class="predicted-rating" title="Predicted rating">
                        ${rec.predictedRating.toFixed(2)} ⭐
                    </span>
                    <span class="confidence" title="Confidence score">
                        ${(rec.confidence * 100).toFixed(0)}% confidence
                    </span>
                </div>
            </div>
        `;

        return element;
    }

    /**
     * Load and display recommendations
     */
    loadRecommendations() {
        const containers = document.querySelectorAll('[data-collaborative-recommendations]');
        containers.forEach(container => {
            const userId = container.getAttribute('data-user-id') || null;
            const algorithm = container.getAttribute('data-algorithm') || 'user-based';
            const limit = parseInt(container.getAttribute('data-limit')) || 10;
            
            this.displayRecommendations(container.id, userId, algorithm, limit);
        });
    }

    /**
     * Invalidate caches
     */
    invalidateCache() {
        this.similarityCache.clear();
        this.recommendationCache.clear();
    }

    /**
     * Save data to storage
     */
    saveData() {
        try {
            const data = {
                users: Array.from(this.users.entries()),
                items: Array.from(this.items.entries()),
                ratings: this.serializeRatings()
            };
            localStorage.setItem('collaborativeFilteringData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving collaborative filtering data:', error);
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`collab_filter_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const collaborativeFilteringSystem = new CollaborativeFilteringSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborativeFilteringSystem;
}

