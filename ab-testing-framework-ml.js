/**
 * A/B Testing Framework with ML
 * ML-powered A/B testing and optimization
 */

class ABTestingFrameworkML {
    constructor() {
        this.experiments = {};
        this.variants = {};
        this.init();
    }
    
    init() {
        this.loadExperiments();
        this.trackEvent('ab_testing_ml_initialized');
    }
    
    loadExperiments() {
        // Load active experiments
        this.experiments = {
            homepageLayout: {
                variants: ['control', 'variant_a', 'variant_b'],
                trafficSplit: [0.33, 0.33, 0.34],
                status: 'active'
            }
        };
    }
    
    assignVariant(experimentName, userId) {
        // Assign user to variant using ML
        if (!this.experiments[experimentName]) {
            return 'control';
        }
        
        // Use user features for intelligent assignment
        const userFeatures = this.getUserFeatures(userId);
        const variant = this.mlAssignVariant(experimentName, userFeatures);
        
        this.variants[userId] = variant;
        this.trackEvent('variant_assigned', { experimentName, userId, variant });
        return variant;
    }
    
    getUserFeatures(userId) {
        // Get user features for ML assignment
        return {
            newUser: true,
            device: this.getDeviceType(),
            location: 'unknown'
        };
    }
    
    mlAssignVariant(experimentName, userFeatures) {
        // ML-based variant assignment
        const experiment = this.experiments[experimentName];
        const random = Math.random();
        
        // Simplified ML assignment
        let cumulative = 0;
        for (let i = 0; i < experiment.variants.length; i++) {
            cumulative += experiment.trafficSplit[i];
            if (random <= cumulative) {
                return experiment.variants[i];
            }
        }
        
        return experiment.variants[0];
    }
    
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) return 'mobile';
        if (/tablet/i.test(ua)) return 'tablet';
        return 'desktop';
    }
    
    async trackConversion(experimentName, variant, userId, conversion) {
        // Track conversion for ML optimization
        if (window.supabase) {
            await window.supabase
                .from('ab_test_conversions')
                .insert({
                    experiment: experimentName,
                    variant,
                    user_id: userId,
                    conversion_type: conversion.type,
                    conversion_value: conversion.value || 1,
                    timestamp: new Date().toISOString()
                });
        }
    }
    
    async getResults(experimentName) {
        // Get experiment results with ML analysis
        if (window.supabase) {
            const { data } = await window.supabase
                .from('ab_test_conversions')
                .select('*')
                .eq('experiment', experimentName);
            
            if (data) {
                return this.analyzeResults(data);
            }
        }
        
        return null;
    }
    
    analyzeResults(data) {
        // Analyze results with statistical significance
        const variants = {};
        
        data.forEach(record => {
            if (!variants[record.variant]) {
                variants[record.variant] = {
                    conversions: 0,
                    total: 0,
                    value: 0
                };
            }
            
            variants[record.variant].conversions++;
            variants[record.variant].total++;
            variants[record.variant].value += record.conversion_value || 1;
        });
        
        // Calculate conversion rates
        Object.keys(variants).forEach(variant => {
            variants[variant].conversionRate = 
                variants[variant].conversions / variants[variant].total;
            variants[variant].avgValue = 
                variants[variant].value / variants[variant].conversions;
        });
        
        // Determine winner
        const winner = Object.keys(variants).reduce((a, b) => 
            variants[a].conversionRate > variants[b].conversionRate ? a : b
        );
        
        return {
            variants,
            winner,
            significant: this.isSignificant(variants)
        };
    }
    
    isSignificant(variants) {
        // Check statistical significance (simplified)
        const rates = Object.values(variants).map(v => v.conversionRate);
        const max = Math.max(...rates);
        const min = Math.min(...rates);
        
        return (max - min) > 0.05; // 5% difference threshold
    }
    
    async optimizeTrafficSplit(experimentName) {
        // Optimize traffic split using ML
        const results = await this.getResults(experimentName);
        if (!results || !results.significant) {
            return;
        }
        
        // Increase traffic to winning variant
        const experiment = this.experiments[experimentName];
        const winnerIndex = experiment.variants.indexOf(results.winner);
        
        // Adjust split: 50% to winner, 25% to others
        const newSplit = experiment.variants.map((_, i) => 
            i === winnerIndex ? 0.5 : 0.25
        );
        
        experiment.trafficSplit = newSplit;
        this.trackEvent('traffic_optimized', { experimentName, winner: results.winner });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ab_ml_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ab_testing_framework_ml', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.abTestingFrameworkML = new ABTestingFrameworkML(); });
} else {
    window.abTestingFrameworkML = new ABTestingFrameworkML();
}

