/**
 * Content Recommendation Engine
 * Provides personalized content recommendations based on user behavior and preferences
 */

class ContentRecommendationEngine {
    constructor() {
        this.userProfile = null;
        this.contentItems = [];
        this.interactions = [];
        this.recommendationCache = new Map();
        this.similarityCache = new Map();
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.loadContentItems();
        this.loadInteractions();
        this.setupEventListeners();
        this.trackEvent('content_rec_initialized');
    }

    setupEventListeners() {
        // Track user interactions
        document.addEventListener('click', (e) => {
            const item = e.target.closest('[data-content-id]');
            if (item) {
                this.recordInteraction(item.getAttribute('data-content-id'), 'view');
            }
        });

        // Track scroll depth
        let lastScrollTime = Date.now();
        document.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 1000) {
                this.recordScrollDepth();
                lastScrollTime = now;
            }
        });

        // Track time spent
        this.trackTimeSpent();
    }

    /**
     * Load user profile from storage or API
     */
    async loadUserProfile() {
        try {
            const stored = localStorage.getItem('userRecommendationProfile');
            if (stored) {
                this.userProfile = JSON.parse(stored);
            } else {
                this.userProfile = this.createDefaultProfile();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.userProfile = this.createDefaultProfile();
        }
    }

    /**
     * Create default user profile
     */
    createDefaultProfile() {
        return {
            preferences: {},
            interests: [],
            viewedItems: [],
            likedItems: [],
            dislikedItems: [],
            searchHistory: [],
            demographics: {}
        };
    }

    /**
     * Load content items
     */
    async loadContentItems() {
        // This would typically load from an API
        const items = document.querySelectorAll('[data-content-item]');
        this.contentItems = Array.from(items).map(item => ({
            id: item.getAttribute('data-content-id'),
            title: item.getAttribute('data-content-title') || item.textContent,
            category: item.getAttribute('data-content-category'),
            tags: (item.getAttribute('data-content-tags') || '').split(',').filter(t => t),
            metadata: this.extractMetadata(item)
        }));
    }

    /**
     * Extract metadata from content element
     */
    extractMetadata(element) {
        return {
            author: element.getAttribute('data-content-author'),
            date: element.getAttribute('data-content-date'),
            views: parseInt(element.getAttribute('data-content-views')) || 0,
            likes: parseInt(element.getAttribute('data-content-likes')) || 0,
            type: element.getAttribute('data-content-type')
        };
    }

    /**
     * Load user interactions
     */
    async loadInteractions() {
        try {
            const stored = localStorage.getItem('userInteractions');
            if (stored) {
                this.interactions = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading interactions:', error);
            this.interactions = [];
        }
    }

    /**
     * Record user interaction
     */
    recordInteraction(contentId, type, metadata = {}) {
        const interaction = {
            contentId,
            type, // 'view', 'like', 'share', 'comment', 'purchase'
            timestamp: Date.now(),
            ...metadata
        };

        this.interactions.push(interaction);
        this.updateUserProfile(interaction);
        this.saveInteractions();
        this.invalidateCache();
    }

    /**
     * Update user profile based on interaction
     */
    updateUserProfile(interaction) {
        if (interaction.type === 'view') {
            if (!this.userProfile.viewedItems.includes(interaction.contentId)) {
                this.userProfile.viewedItems.push(interaction.contentId);
            }
        } else if (interaction.type === 'like') {
            if (!this.userProfile.likedItems.includes(interaction.contentId)) {
                this.userProfile.likedItems.push(interaction.contentId);
            }
        } else if (interaction.type === 'dislike') {
            if (!this.userProfile.dislikedItems.includes(interaction.contentId)) {
                this.userProfile.dislikedItems.push(interaction.contentId);
            }
        }
    }

    /**
     * Track scroll depth
     */
    recordScrollDepth() {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        this.recordInteraction('page', 'scroll', { depth: scrollPercent });
    }

    /**
     * Track time spent on page
     */
    trackTimeSpent() {
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - startTime;
            this.recordInteraction('page', 'time_spent', { duration: timeSpent });
        });
    }

    /**
     * Get recommendations for user
     */
    getRecommendations(options = {}) {
        const {
            limit = 10,
            algorithm = 'hybrid',
            excludeViewed = true,
            categories = null
        } = options;

        const cacheKey = JSON.stringify({ algorithm, limit, excludeViewed, categories });
        if (this.recommendationCache.has(cacheKey)) {
            return this.recommendationCache.get(cacheKey);
        }

        let recommendations = [];

        switch (algorithm) {
            case 'collaborative':
                recommendations = this.collaborativeFiltering(limit, excludeViewed);
                break;
            case 'content-based':
                recommendations = this.contentBasedFiltering(limit, excludeViewed);
                break;
            case 'popularity':
                recommendations = this.popularityBased(limit, excludeViewed);
                break;
            case 'hybrid':
            default:
                recommendations = this.hybridRecommendation(limit, excludeViewed);
                break;
        }

        // Filter by categories if specified
        if (categories && categories.length > 0) {
            recommendations = recommendations.filter(rec => 
                categories.includes(rec.item.category)
            );
        }

        this.recommendationCache.set(cacheKey, recommendations);
        return recommendations;
    }

    /**
     * Collaborative filtering recommendation
     */
    collaborativeFiltering(limit, excludeViewed) {
        // Find similar users based on interaction patterns
        const userVector = this.buildUserVector();
        const itemScores = new Map();

        this.contentItems.forEach(item => {
            if (excludeViewed && this.userProfile.viewedItems.includes(item.id)) {
                return;
            }

            // Calculate score based on similar users' preferences
            const score = this.calculateCollaborativeScore(item, userVector);
            itemScores.set(item.id, { item, score, algorithm: 'collaborative' });
        });

        return Array.from(itemScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Content-based filtering
     */
    contentBasedFiltering(limit, excludeViewed) {
        const likedItems = this.userProfile.likedItems
            .map(id => this.contentItems.find(item => item.id === id))
            .filter(Boolean);

        if (likedItems.length === 0) {
            return this.popularityBased(limit, excludeViewed);
        }

        const itemScores = new Map();

        this.contentItems.forEach(item => {
            if (excludeViewed && this.userProfile.viewedItems.includes(item.id)) {
                return;
            }

            // Calculate similarity to liked items
            const score = this.calculateContentSimilarity(item, likedItems);
            itemScores.set(item.id, { item, score, algorithm: 'content-based' });
        });

        return Array.from(itemScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Popularity-based recommendation
     */
    popularityBased(limit, excludeViewed) {
        return this.contentItems
            .filter(item => !excludeViewed || !this.userProfile.viewedItems.includes(item.id))
            .map(item => ({
                item,
                score: this.calculatePopularityScore(item),
                algorithm: 'popularity'
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Hybrid recommendation combining multiple approaches
     */
    hybridRecommendation(limit, excludeViewed) {
        const collaborative = this.collaborativeFiltering(limit * 2, excludeViewed);
        const contentBased = this.contentBasedFiltering(limit * 2, excludeViewed);
        const popularity = this.popularityBased(limit * 2, excludeViewed);

        // Combine and re-score
        const combined = new Map();

        [collaborative, contentBased, popularity].forEach((recs, index) => {
            const weight = [0.4, 0.4, 0.2][index]; // Weights for each algorithm
            recs.forEach((rec, rank) => {
                const normalizedScore = 1 / (rank + 1); // Normalize by rank
                const weightedScore = normalizedScore * weight;

                if (!combined.has(rec.item.id)) {
                    combined.set(rec.item.id, {
                        item: rec.item,
                        score: 0,
                        algorithms: []
                    });
                }

                const entry = combined.get(rec.item.id);
                entry.score += weightedScore;
                entry.algorithms.push(rec.algorithm);
            });
        });

        return Array.from(combined.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(rec => ({
                ...rec,
                algorithm: 'hybrid'
            }));
    }

    /**
     * Build user preference vector
     */
    buildUserVector() {
        const vector = {};
        this.userProfile.likedItems.forEach(id => {
            const item = this.contentItems.find(i => i.id === id);
            if (item) {
                item.tags.forEach(tag => {
                    vector[tag] = (vector[tag] || 0) + 1;
                });
            }
        });
        return vector;
    }

    /**
     * Calculate collaborative filtering score
     */
    calculateCollaborativeScore(item, userVector) {
        let score = 0;
        item.tags.forEach(tag => {
            score += userVector[tag] || 0;
        });
        return score / (item.tags.length || 1);
    }

    /**
     * Calculate content similarity
     */
    calculateContentSimilarity(item, likedItems) {
        if (likedItems.length === 0) return 0;

        let totalSimilarity = 0;
        likedItems.forEach(likedItem => {
            totalSimilarity += this.cosineSimilarity(item, likedItem);
        });

        return totalSimilarity / likedItems.length;
    }

    /**
     * Calculate cosine similarity between two items
     */
    cosineSimilarity(item1, item2) {
        const tags1 = new Set(item1.tags);
        const tags2 = new Set(item2.tags);

        const intersection = new Set([...tags1].filter(t => tags2.has(t)));
        const union = new Set([...tags1, ...tags2]);

        return union.size > 0 ? intersection.size / union.size : 0;
    }

    /**
     * Calculate popularity score
     */
    calculatePopularityScore(item) {
        const views = item.metadata.views || 0;
        const likes = item.metadata.likes || 0;
        const recency = this.calculateRecency(item.metadata.date);

        // Weighted score
        return (views * 0.3) + (likes * 0.5) + (recency * 0.2);
    }

    /**
     * Calculate recency score (newer = higher)
     */
    calculateRecency(dateString) {
        if (!dateString) return 0.5;
        const date = new Date(dateString);
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - (daysSince / 365)); // Decay over 1 year
    }

    /**
     * Display recommendations
     */
    displayRecommendations(containerId, options = {}) {
        const recommendations = this.getRecommendations(options);
        const container = document.getElementById(containerId);

        if (!container) {
            console.error('Recommendation container not found:', containerId);
            return;
        }

        container.innerHTML = '';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Recommended content');

        if (recommendations.length === 0) {
            container.innerHTML = '<p>No recommendations available</p>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'recommendations-list';
        list.setAttribute('role', 'list');

        recommendations.forEach((rec, index) => {
            const item = this.createRecommendationElement(rec, index);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    /**
     * Create recommendation element
     */
    createRecommendationElement(rec, index) {
        const element = document.createElement('div');
        element.className = 'recommendation-item';
        element.setAttribute('role', 'listitem');
        element.setAttribute('data-content-id', rec.item.id);
        element.setAttribute('data-recommendation-score', rec.score.toFixed(3));
        element.setAttribute('tabindex', '0');

        element.innerHTML = `
            <div class="recommendation-header">
                <h3>${this.escapeHtml(rec.item.title)}</h3>
                <span class="recommendation-badge" title="Recommendation score: ${rec.score.toFixed(3)}">
                    ${rec.algorithm}
                </span>
            </div>
            ${rec.item.category ? `<div class="recommendation-category">${this.escapeHtml(rec.item.category)}</div>` : ''}
            ${rec.item.tags.length > 0 ? `<div class="recommendation-tags">${rec.item.tags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')}</div>` : ''}
        `;

        // Add click handler
        element.addEventListener('click', () => {
            this.recordInteraction(rec.item.id, 'view', { source: 'recommendation' });
        });

        return element;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Invalidate recommendation cache
     */
    invalidateCache() {
        this.recommendationCache.clear();
    }

    /**
     * Save interactions to storage
     */
    saveInteractions() {
        try {
            localStorage.setItem('userInteractions', JSON.stringify(this.interactions));
            localStorage.setItem('userRecommendationProfile', JSON.stringify(this.userProfile));
        } catch (error) {
            console.error('Error saving interactions:', error);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_rec_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const contentRecommendationEngine = new ContentRecommendationEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentRecommendationEngine;
}
