/**
 * A/B Testing Framework
 * Implements A/B testing framework
 */

class ABTestingFramework {
    constructor() {
        this.tests = new Map();
        this.variants = new Map();
        this.results = [];
        this.init();
    }

    init() {
        this.trackEvent('ab_testing_initialized');
    }

    createTest(testId, name, variants) {
        const test = {
            id: testId,
            name,
            variants: variants.map(v => ({ ...v, participants: 0, conversions: 0 })),
            status: 'draft',
            startDate: null,
            endDate: null,
            createdAt: new Date()
        };
        
        this.tests.set(testId, test);
        this.trackEvent('test_created', { testId, name, variantCount: variants.length });
        return test;
    }

    startTest(testId) {
        const test = this.tests.get(testId);
        if (!test) return null;
        
        test.status = 'active';
        test.startDate = new Date();
        this.trackEvent('test_started', { testId, name: test.name });
        return test;
    }

    assignVariant(testId, userId) {
        const test = this.tests.get(testId);
        if (!test || test.status !== 'active') return null;
        
        // Simple random assignment
        const variant = test.variants[Math.floor(Math.random() * test.variants.length)];
        variant.participants++;
        this.trackEvent('variant_assigned', { testId, variantId: variant.id, userId });
        return variant.id;
    }

    trackConversion(testId, variantId, userId) {
        const test = this.tests.get(testId);
        if (!test) return;
        
        const variant = test.variants.find(v => v.id === variantId);
        if (variant) {
            variant.conversions++;
        }
        
        this.results.push({
            testId,
            variantId,
            userId,
            timestamp: new Date()
        });
        this.trackEvent('conversion_tracked', { testId, variantId, userId });
    }

    getTestResults(testId) {
        const test = this.tests.get(testId);
        if (!test) return null;
        
        const results = test.variants.map(variant => {
            const conversionRate = variant.participants > 0 ? 
                (variant.conversions / variant.participants) * 100 : 0;
            
            return {
                variantId: variant.id,
                variantName: variant.name,
                participants: variant.participants,
                conversions: variant.conversions,
                conversionRate: Math.round(conversionRate * 100) / 100
            };
        });
        
        return {
            testName: test.name,
            status: test.status,
            results
        };
    }

    stopTest(testId) {
        const test = this.tests.get(testId);
        if (!test) return null;
        
        test.status = 'completed';
        test.endDate = new Date();
        this.trackEvent('test_completed', { testId, name: test.name });
        return test;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ab_testing_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ab_testing_framework', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const abTestingFramework = new ABTestingFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABTestingFramework;
}
