/**
 * Performance Testing
 * Performance testing and benchmarking
 */

class PerformanceTesting {
    constructor() {
        this.tests = new Map();
        this.benchmarks = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_er_fo_rm_an_ce_te_st_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_er_fo_rm_an_ce_te_st_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createTest(testId, testData) {
        const test = {
            id: testId,
            ...testData,
            name: testData.name || testId,
            target: testData.target || '',
            iterations: testData.iterations || 100,
            concurrency: testData.concurrency || 1,
            status: 'created',
            createdAt: new Date()
        };
        
        this.tests.set(testId, test);
        console.log(`Performance test created: ${testId}`);
        return test;
    }

    async run(testId) {
        const test = this.tests.get(testId);
        if (!test) {
            throw new Error('Test not found');
        }
        
        test.status = 'running';
        test.startedAt = new Date();
        
        const measurements = [];
        for (let i = 0; i < test.iterations; i++) {
            const start = Date.now();
            await this.simulateRequest();
            const duration = Date.now() - start;
            measurements.push(duration);
        }
        
        const result = {
            id: `result_${Date.now()}`,
            testId,
            iterations: test.iterations,
            totalTime: measurements.reduce((a, b) => a + b, 0),
            averageTime: measurements.reduce((a, b) => a + b, 0) / measurements.length,
            minTime: Math.min(...measurements),
            maxTime: Math.max(...measurements),
            p50: this.percentile(measurements, 50),
            p95: this.percentile(measurements, 95),
            p99: this.percentile(measurements, 99),
            throughput: (test.iterations / (measurements.reduce((a, b) => a + b, 0) / 1000)).toFixed(2),
            completedAt: new Date(),
            createdAt: new Date()
        };
        
        this.results.set(result.id, result);
        
        test.status = 'completed';
        test.completedAt = new Date();
        test.resultId = result.id;
        
        return { test, result };
    }

    percentile(arr, p) {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * (p / 100));
        return sorted[index] || 0;
    }

    async simulateRequest() {
        return new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }

    getTest(testId) {
        return this.tests.get(testId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.performanceTesting = new PerformanceTesting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTesting;
}
