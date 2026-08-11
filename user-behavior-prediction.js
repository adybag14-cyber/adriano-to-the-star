/**
 * User Behavior Prediction
 * Predicts user behavior and actions
 */

class UserBehaviorPrediction {
    constructor() {
        this.models = {};
        this.predictions = {};
        this.init();
    }
    
    init() {
        this.loadModels();
    }
    
    loadModels() {
        // Load behavior prediction models
        this.models = {
            clickPrediction: { ready: true },
            churnPrediction: { ready: true },
            engagementPrediction: { ready: true }
        };
    }
    
    async predictClick(userId, itemId, context) {
        // Predict if user will click on item
        const features = await this.extractFeatures(userId, itemId, context);
        const score = this.calculateClickProbability(features);
        
        return {
            probability: score,
            willClick: score > 0.5,
            confidence: Math.abs(score - 0.5) * 2
        };
    }
    
    async extractFeatures(userId, itemId, context) {
        // Extract features for prediction
        return {
            userActivity: await this.getUserActivity(userId),
            itemPopularity: await this.getItemPopularity(itemId),
            similarity: await this.getSimilarity(userId, itemId),
            context: context
        };
    }
    
    async getUserActivity(userId) {
        // Get user activity level
        if (window.supabase) {
            const { data } = await window.supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(10);
            
            return {
                recentActions: data?.length || 0,
                active: (data?.length || 0) > 5
            };
        }
        
        return { recentActions: 0, active: false };
    }
    
    async getItemPopularity(itemId) {
        // Get item popularity
        if (window.supabase) {
            const { data } = await window.supabase
                .from('items')
                .select('views, likes, clicks')
                .eq('id', itemId)
                .single();
            
            if (data) {
                return {
                    views: data.views || 0,
                    likes: data.likes || 0,
                    clicks: data.clicks || 0,
                    popularity: ((data.views || 0) + (data.likes || 0) * 2) / 1000
                };
            }
        }
        
        return { views: 0, likes: 0, clicks: 0, popularity: 0 };
    }
    
    async getSimilarity(userId, itemId) {
        // Get similarity between user and item
        // Simplified - would use collaborative filtering
        return 0.5;
    }
    
    calculateClickProbability(features) {
        // Calculate click probability
        let score = 0.5; // Base probability
        
        // User activity boost
        if (features.userActivity.active) {
            score += 0.2;
        }
        
        // Popularity boost
        score += features.itemPopularity.popularity * 0.2;
        
        // Similarity boost
        score += features.similarity * 0.1;
        
        return Math.min(1, Math.max(0, score));
    }
    
    async predictChurn(userId) {
        // Predict user churn
        const activity = await this.getUserActivity(userId);
        const daysSinceLastActivity = await this.getDaysSinceLastActivity(userId);
        
        const churnScore = this.calculateChurnProbability(activity, daysSinceLastActivity);
        
        return {
            probability: churnScore,
            willChurn: churnScore > 0.7,
            riskLevel: churnScore > 0.7 ? 'high' : churnScore > 0.4 ? 'medium' : 'low'
        };
    }
    
    async getDaysSinceLastActivity(userId) {
        // Get days since last activity
        if (window.supabase) {
            const { data } = await window.supabase
                .from('user_activity')
                .select('timestamp')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();
            
            if (data) {
                return (Date.now() - new Date(data.timestamp)) / (1000 * 60 * 60 * 24);
            }
        }
        
        return 999; // No activity
    }
    
    calculateChurnProbability(activity, daysSince) {
        let score = 0;
        
        // Days since activity
        if (daysSince > 30) score += 0.5;
        else if (daysSince > 14) score += 0.3;
        else if (daysSince > 7) score += 0.1;
        
        // Activity level
        if (!activity.active) score += 0.3;
        if (activity.recentActions < 3) score += 0.2;
        
        return Math.min(1, score);
    }
    
    async predictEngagement(userId, timeWindow = 'day') {
        // Predict user engagement
        const activity = await this.getUserActivity(userId);
        const historical = await this.getHistoricalEngagement(userId);
        
        return this.calculateEngagementPrediction(activity, historical, timeWindow);
    }
    
    async getHistoricalEngagement(userId) {
        // Get historical engagement data
        if (window.supabase) {
            const { data } = await window.supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(30);
            
            return {
                totalActions: data?.length || 0,
                avgPerDay: (data?.length || 0) / 30
            };
        }
        
        return { totalActions: 0, avgPerDay: 0 };
    }
    
    calculateEngagementPrediction(activity, historical, timeWindow) {
        // Predict engagement
        const baseEngagement = historical.avgPerDay;
        const currentActivity = activity.recentActions;
        
        // Trend analysis
        const trend = currentActivity > baseEngagement ? 'increasing' : 'decreasing';
        
        return {
            predictedActions: Math.round(baseEngagement * (timeWindow === 'day' ? 1 : 7)),
            trend,
            confidence: 0.7
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.userBehaviorPrediction = new UserBehaviorPrediction(); });
} else {
    window.userBehaviorPrediction = new UserBehaviorPrediction();
}

