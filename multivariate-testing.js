/**
 * Multivariate Testing
 * Implements multivariate testing (MVT)
 */

class MultivariateTesting {
    constructor() {
        this.tests = new Map();
        this.combinations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_ul_ti_va_ri_at_et_es_ti_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_ul_ti_va_ri_at_et_es_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createTest(testId, name, factors) {
        // Generate all combinations
        const combinations = this.generateCombinations(factors);
        
        const test = {
            id: testId,
            name,
            factors,
            combinations: combinations.map((combo, index) => ({
                id: `combo_${index}`,
                factors: combo,
                participants: 0,
                conversions: 0
            })),
            status: 'draft',
            createdAt: new Date()
        };
        
        this.tests.set(testId, test);
        return test;
    }

    generateCombinations(factors) {
        if (factors.length === 0) return [[]];
        
        const [firstFactor, ...restFactors] = factors;
        const restCombinations = this.generateCombinations(restFactors);
        const combinations = [];
        
        firstFactor.values.forEach(value => {
            restCombinations.forEach(restCombo => {
                combinations.push([{ factor: firstFactor.name, value }, ...restCombo]);
            });
        });
        
        return combinations;
    }

    startTest(testId) {
        const test = this.tests.get(testId);
        if (!test) return null;
        
        test.status = 'active';
        test.startDate = new Date();
        return test;
    }

    assignCombination(testId, userId) {
        const test = this.tests.get(testId);
        if (!test || test.status !== 'active') return null;
        
        // Random assignment
        const combination = test.combinations[
            Math.floor(Math.random() * test.combinations.length)
        ];
        combination.participants++;
        
        return combination.id;
    }

    trackConversion(testId, combinationId, userId) {
        const test = this.tests.get(testId);
        if (!test) return;
        
        const combination = test.combinations.find(c => c.id === combinationId);
        if (combination) {
            combination.conversions++;
        }
    }

    getTestResults(testId) {
        const test = this.tests.get(testId);
        if (!test) return null;
        
        const results = test.combinations.map(combo => {
            const conversionRate = combo.participants > 0 ? 
                (combo.conversions / combo.participants) * 100 : 0;
            
            return {
                combinationId: combo.id,
                factors: combo.factors,
                participants: combo.participants,
                conversions: combo.conversions,
                conversionRate: Math.round(conversionRate * 100) / 100
            };
        });
        
        return {
            testName: test.name,
            results: results.sort((a, b) => b.conversionRate - a.conversionRate)
        };
    }
}

// Auto-initialize
const multivariateTesting = new MultivariateTesting();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultivariateTesting;
}


