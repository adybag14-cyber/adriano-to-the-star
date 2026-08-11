/**
 * Feature Usage Analytics
 * Tracks usage of different features
 */

class FeatureUsageAnalytics {
    constructor() {
        this.featureUsage = [];
        this.features = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ea_tu_re_us_ag_ea_na_ly_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ea_tu_re_us_ag_ea_na_ly_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerFeature(featureId, name, category) {
        this.features.set(featureId, {
            id: featureId,
            name,
            category,
            usageCount: 0,
            lastUsed: null
        });
    }

    trackFeatureUsage(featureId, userId, metadata = {}) {
        const usage = {
            featureId,
            userId,
            metadata,
            timestamp: new Date()
        };
        
        this.featureUsage.push(usage);
        
        const feature = this.features.get(featureId);
        if (feature) {
            feature.usageCount++;
            feature.lastUsed = new Date();
        }
    }

    getFeatureStats(featureId) {
        const feature = this.features.get(featureId);
        if (!feature) return null;
        
        const usage = this.featureUsage.filter(u => u.featureId === featureId);
        const uniqueUsers = new Set(usage.map(u => u.userId)).size;
        
        return {
            featureName: feature.name,
            category: feature.category,
            totalUsage: feature.usageCount,
            uniqueUsers,
            averageUsagePerUser: uniqueUsers > 0 ? feature.usageCount / uniqueUsers : 0,
            lastUsed: feature.lastUsed
        };
    }

    getMostUsedFeatures(limit = 10) {
        return Array.from(this.features.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit)
            .map(f => ({
                name: f.name,
                category: f.category,
                usageCount: f.usageCount
            }));
    }

    getCategoryStats() {
        const categoryStats = {};
        
        this.features.forEach(feature => {
            if (!categoryStats[feature.category]) {
                categoryStats[feature.category] = {
                    totalFeatures: 0,
                    totalUsage: 0
                };
            }
            categoryStats[feature.category].totalFeatures++;
            categoryStats[feature.category].totalUsage += feature.usageCount;
        });
        
        return categoryStats;
    }
}

// Auto-initialize
const featureUsageAnalytics = new FeatureUsageAnalytics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureUsageAnalytics;
}
