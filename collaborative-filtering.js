/**
 * Collaborative Filtering
 * Collaborative filtering recommendations
 */
(function() {
    'use strict';

    class CollaborativeFiltering {
        constructor() {
            this.ratings = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('collab_filter_initialized');
        }

        setupUI() {
            if (!document.getElementById('collaborative-filtering')) {
                const filtering = document.createElement('div');
                filtering.id = 'collaborative-filtering';
                filtering.className = 'collaborative-filtering';
                filtering.innerHTML = `<h2>Collaborative Filtering</h2>`;
                document.body.appendChild(filtering);
            }
        }

        addRating(userId, itemId, rating) {
            if (!this.ratings.has(userId)) {
                this.ratings.set(userId, new Map());
            }
            this.ratings.get(userId).set(itemId, rating);
        }

        findSimilarUsers(userId) {
            const userRatings = this.ratings.get(userId);
            if (!userRatings) return [];

            const similarities = [];
            this.ratings.forEach((otherRatings, otherUserId) => {
                if (otherUserId !== userId) {
                    const similarity = this.calculateSimilarity(userRatings, otherRatings);
                    similarities.push({
                        userId: otherUserId,
                        similarity: similarity
                    });
                }
            });

            return similarities.sort((a, b) => b.similarity - a.similarity);
        }

        calculateSimilarity(ratings1, ratings2) {
            const commonItems = [];
            ratings1.forEach((rating, itemId) => {
                if (ratings2.has(itemId)) {
                    commonItems.push({
                        itemId: itemId,
                        rating1: rating,
                        rating2: ratings2.get(itemId)
                    });
                }
            });

            if (commonItems.length === 0) return 0;

            // Cosine similarity
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;

            commonItems.forEach(item => {
                dotProduct += item.rating1 * item.rating2;
                norm1 += item.rating1 * item.rating1;
                norm2 += item.rating2 * item.rating2;
            });

            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        }

        recommend(userId, limit = 10) {
            const similarUsers = this.findSimilarUsers(userId).slice(0, 5);
            const userRatings = this.ratings.get(userId) || new Map();
            const recommendations = new Map();

            similarUsers.forEach(similar => {
                const similarRatings = this.ratings.get(similar.userId);
                similarRatings.forEach((rating, itemId) => {
                    if (!userRatings.has(itemId)) {
                        const currentScore = recommendations.get(itemId) || 0;
                        recommendations.set(itemId, currentScore + rating * similar.similarity);
                    }
                });
            });

            return Array.from(recommendations.entries())
                .map(([itemId, score]) => ({ itemId, score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`collab_filter_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.collaborativeFiltering = new CollaborativeFiltering();
        });
    } else {
        window.collaborativeFiltering = new CollaborativeFiltering();
    }
})();

