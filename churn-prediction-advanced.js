/**
 * Churn Prediction (Advanced)
 * Advanced churn prediction system
 */

class ChurnPredictionAdvanced {
    constructor() {
        this.model = null;
        this.init();
    }
    
    init() {
        this.loadModel();
        this.trackEvent('churn_adv_initialized');
    }
    
    loadModel() {
        // Load churn prediction model
        this.model = { ready: true };
    }
    
    async predictChurn(userId) {
        // Predict user churn
        const features = await this.extractChurnFeatures(userId);
        const churnScore = this.calculateChurnScore(features);
        
        return {
            probability: churnScore,
            willChurn: churnScore > 0.7,
            riskLevel: churnScore > 0.7 ? 'high' : churnScore > 0.4 ? 'medium' : 'low',
            reasons: this.getChurnReasons(features)
        };
    }
    
    async extractChurnFeatures(userId) {
        // Extract features for churn prediction
        const activity = await this.getUserActivity(userId);
        const daysSinceLastActivity = await this.getDaysSinceLastActivity(userId);
        const engagement = await this.getEngagementLevel(userId);
        
        return {
            activity,
            daysSinceLastActivity,
            engagement
        };
    }
    
    async getUserActivity(userId) {
        // Get user activity
        if (window.supabase) {
            const { data } = await window.supabase
                .from('user_activity')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(30);
            
            return {
                totalActions: data?.length || 0,
                recentActions: data?.filter(a => {
                    const days = (Date.now() - new Date(a.timestamp)) / (1000 * 60 * 60 * 24);
                    return days < 7;
                }).length || 0
            };
        }
        return { totalActions: 0, recentActions: 0 };
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
        return 999;
    }
    
    async getEngagementLevel(userId) {
        // Get user engagement level
        const activity = await this.getUserActivity(userId);
        return activity.recentActions > 5 ? 'high' : activity.recentActions > 2 ? 'medium' : 'low';
    }
    
    calculateChurnScore(features) {
        // Calculate churn probability
        let score = 0;
        
        // Days since activity
        if (features.daysSinceLastActivity > 30) score += 0.5;
        else if (features.daysSinceLastActivity > 14) score += 0.3;
        else if (features.daysSinceLastActivity > 7) score += 0.1;
        
        // Engagement level
        if (features.engagement === 'low') score += 0.3;
        if (features.engagement === 'medium') score += 0.1;
        
        // Recent activity
        if (features.activity.recentActions === 0) score += 0.2;
        
        return Math.min(1, score);
    }
    
    getChurnReasons(features) {
        // Get reasons for churn risk
        const reasons = [];
        
        if (features.daysSinceLastActivity > 30) {
            reasons.push('No activity for over 30 days');
        }
        
        if (features.engagement === 'low') {
            reasons.push('Low engagement level');
        }
        
        return reasons;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`churn_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.churnPredictionAdvanced = new ChurnPredictionAdvanced(); });
} else {
    window.churnPredictionAdvanced = new ChurnPredictionAdvanced();
}

