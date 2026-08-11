/**
 * API Request Benchmarking
 * Benchmark API request performance
 */

class APIRequestBenchmarking {
    constructor() {
        this.benchmarks = new Map();
        this.benchmarkResults = new Map();
        this.init();
    }

    init() {
        this.trackEvent('benchmarking_initialized');
    }

    createBenchmark(benchmarkId, name, config) {
        const benchmark = {
            id: benchmarkId,
            name,
            endpoint: config.endpoint,
            method: config.method || 'GET',
            iterations: config.iterations || 10,
            concurrency: config.concurrency || 1,
            timeout: config.timeout || 5000,
            status: 'pending',
            createdAt: new Date()
        };
        
        this.benchmarks.set(benchmarkId, benchmark);
        this.trackEvent('benchmark_created', { benchmarkId });
        return benchmark;
    }

    async runBenchmark(benchmarkId) {
        const benchmark = this.benchmarks.get(benchmarkId);
        if (!benchmark) {
            throw new Error('Benchmark does not exist');
        }
        
        benchmark.status = 'running';
        const results = [];
        
        for (let i = 0; i < benchmark.iterations; i++) {
            const iterationResults = await this.runIteration(benchmark);
            results.push(...iterationResults);
        }
        
        const analysis = this.analyzeResults(results);
        
        this.benchmarkResults.set(benchmarkId, {
            benchmarkId,
            results,
            analysis,
            completedAt: new Date()
        });
        
        benchmark.status = 'completed';
        console.log(`Benchmark completed: ${benchmarkId}`);
        
        return analysis;
    }

    async runIteration(benchmark) {
        const promises = [];
        for (let i = 0; i < benchmark.concurrency; i++) {
            promises.push(this.executeRequest(benchmark));
        }
        return await Promise.all(promises);
    }

    async executeRequest(benchmark) {
        const startTime = Date.now();
        try {
            // Simulate request execution
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            const duration = Date.now() - startTime;
            return {
                success: true,
                duration,
                timestamp: new Date()
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                duration,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    analyzeResults(results) {
        const durations = results.filter(r => r.success).map(r => r.duration);
        const failures = results.filter(r => !r.success).length;
        
        if (durations.length === 0) {
            return {
                totalRequests: results.length,
                successful: 0,
                failed: failures,
                successRate: '0%',
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                p50: 0,
                p95: 0,
                p99: 0
            };
        }
        
        const sorted = [...durations].sort((a, b) => a - b);
        const p50 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0;
        const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
        const p99 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0;
        
        return {
            totalRequests: results.length,
            successful: durations.length,
            failed: failures,
            successRate: results.length > 0 ? ((durations.length / results.length) * 100).toFixed(2) + '%' : '0%',
            averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            p50,
            p95,
            p99
        };
    }

    getBenchmark(benchmarkId) {
        return this.benchmarks.get(benchmarkId);
    }

    getBenchmarkResults(benchmarkId) {
        return this.benchmarkResults.get(benchmarkId);
    }

    getAllBenchmarks() {
        return Array.from(this.benchmarks.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`benchmarking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestBenchmarking = new APIRequestBenchmarking();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestBenchmarking;
}

