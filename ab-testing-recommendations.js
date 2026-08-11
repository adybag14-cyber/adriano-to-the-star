/**
 * A/B Testing for Recommendations
 * A/B tests different recommendation algorithms
 */

class ABTestingRecommendations {
    constructor() {
        this.experiments = {};
        this.init();
    }
    
    init() {
        this.setupExperiments();
        this.trackEvent('ab_recommendations_initialized');
    }
    
    setupExperiments() {
        // Setup A/B tests for recommendations
        this.experiments = {
            algorithm: {
                variants: ['collaborative', 'content-based', 'hybrid'],
                trafficSplit: [0.33, 0.33, 0.34]
            }
        };
    }
    
    assignVariant(userId, experimentName) {
        // Assign user to variant
        const experiment = this.experiments[experimentName];
        if (!experiment) return experiment.variants[0];
        
        const hash = this.hashUserId(userId);
        const variantIndex = hash % experiment.variants.length;
        return experiment.variants[variantIndex];
    }
    
    hashUserId(userId) {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    async getRecommendationsWithABTest(userId) {
        // Get recommendations using A/B test
        const variant = this.assignVariant(userId, 'algorithm');
        
        let recommendations = [];
        
        switch (variant) {
            case 'collaborative':
                if (window.collaborativeFilteringAdvanced) {
                    recommendations = await window.collaborativeFilteringAdvanced.getRecommendations(userId);
                }
                break;
            case 'content-based':
                if (window.contentBasedFilteringAdvanced) {
                    recommendations = await window.contentBasedFilteringAdvanced.getRecommendations(userId);
                }
                break;
            case 'hybrid':
                if (window.hybridRecommendation) {
                    recommendations = await window.hybridRecommendation.getRecommendations(userId);
                }
                break;
        }
        
        // Track which variant was used
        this.trackVariantUsage(userId, variant);
        
        return recommendations;
    }
    
    trackVariantUsage(userId, variant) {
        this.trackEvent('variant_used', { userId, variant });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ab_recommendations_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ab_testing_recommendations', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.abTestingRecommendations = new ABTestingRecommendations(); });
} else {
    window.abTestingRecommendations = new ABTestingRecommendations();
}

