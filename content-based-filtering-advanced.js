/**
 * Content-Based Filtering (Advanced)
 * Advanced content-based filtering for recommendations
 */

class ContentBasedFilteringAdvanced {
    constructor() {
        this.itemFeatures = new Map();
        this.init();
    }
    
    init() {
        this.loadItemFeatures();
        this.trackEvent('content_filter_adv_initialized');
    }
    
    async loadItemFeatures() {
        // Load item features for content-based filtering
        if (window.supabase) {
            const { data: items } = await window.supabase
                .from('planets')
                .select('id, type, size, temperature, category');
            
            if (items) {
                items.forEach(item => {
                    this.itemFeatures.set(item.id, {
                        type: item.type,
                        size: item.size,
                        temperature: item.temperature,
                        category: item.category
                    });
                });
            }
        }
    }
    
    async getRecommendations(userId, limit = 10) {
        // Get recommendations based on user's liked items
        const userPreferences = await this.getUserPreferences(userId);
        return await this.findSimilarItems(userPreferences, limit);
    }
    
    async getUserPreferences(userId) {
        // Get user's preferences from liked items
        if (window.supabase) {
            const { data: likedItems } = await window.supabase
                .from('user_interactions')
                .select('item_id')
                .eq('user_id', userId)
                .eq('interaction_type', 'like');
            
            if (likedItems && likedItems.length > 0) {
                const features = likedItems.map(item => this.itemFeatures.get(item.item_id)).filter(f => f);
                return this.aggregateFeatures(features);
            }
        }
        
        return {};
    }
    
    aggregateFeatures(features) {
        // Aggregate features from liked items
        const aggregated = {
            types: {},
            avgSize: 0,
            avgTemperature: 0,
            categories: {}
        };
        
        features.forEach(feature => {
            if (feature.type) {
                aggregated.types[feature.type] = (aggregated.types[feature.type] || 0) + 1;
            }
            if (feature.size) {
                aggregated.avgSize += feature.size;
            }
            if (feature.temperature) {
                aggregated.avgTemperature += feature.temperature;
            }
            if (feature.category) {
                aggregated.categories[feature.category] = (aggregated.categories[feature.category] || 0) + 1;
            }
        });
        
        if (features.length > 0) {
            aggregated.avgSize /= features.length;
            aggregated.avgTemperature /= features.length;
        }
        
        return aggregated;
    }
    
    async findSimilarItems(preferences, limit) {
        // Find items similar to user preferences
        const scores = [];
        
        this.itemFeatures.forEach((features, itemId) => {
            const score = this.calculateSimilarity(features, preferences);
            scores.push({ itemId, score });
        });
        
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => s.itemId);
    }
    
    calculateSimilarity(features, preferences) {
        // Calculate similarity score
        let score = 0;
        
        // Type match
        if (preferences.types[features.type]) {
            score += preferences.types[features.type] * 10;
        }
        
        // Size similarity
        if (preferences.avgSize && features.size) {
            const sizeDiff = Math.abs(features.size - preferences.avgSize) / preferences.avgSize;
            score += (1 - sizeDiff) * 5;
        }
        
        // Temperature similarity
        if (preferences.avgTemperature && features.temperature) {
            const tempDiff = Math.abs(features.temperature - preferences.avgTemperature) / Math.abs(preferences.avgTemperature);
            score += (1 - tempDiff) * 5;
        }
        
        return score;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_filter_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.contentBasedFilteringAdvanced = new ContentBasedFilteringAdvanced(); });
} else {
    window.contentBasedFilteringAdvanced = new ContentBasedFilteringAdvanced();
}

