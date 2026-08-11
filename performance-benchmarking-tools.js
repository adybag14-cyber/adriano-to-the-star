/**
 * Performance Benchmarking Tools
 * Benchmark application performance
 */
(function() {
    'use strict';

    class PerformanceBenchmarkingTools {
        constructor() {
            this.benchmarks = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('benchmarking-tools')) {
                const tools = document.createElement('div');
                tools.id = 'benchmarking-tools';
                tools.className = 'benchmarking-tools';
                tools.innerHTML = `<h2>Performance Benchmarking</h2>`;
                document.body.appendChild(tools);
            }
        }

        async benchmark(name, fn) {
            const start = performance.now();
            await fn();
            const end = performance.now();
            const duration = end - start;
            
            const benchmark = {
                name: name,
                duration: duration,
                timestamp: new Date().toISOString()
            };
            this.benchmarks.push(benchmark);
            return benchmark;
        }

        getAverageBenchmark(name) {
            const relevant = this.benchmarks.filter(b => b.name === name);
            if (relevant.length === 0) return null;
            const sum = relevant.reduce((a, b) => a + b.duration, 0);
            return sum / relevant.length;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.performanceBenchmarking = new PerformanceBenchmarkingTools();
        });
    } else {
        window.performanceBenchmarking = new PerformanceBenchmarkingTools();
    }
})();

