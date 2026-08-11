/**
 * Bundle Size Analyzer and Optimizer
 * Analyze and optimize bundle sizes
 */
(function() {
    'use strict';

    class BundleSizeAnalyzerOptimizer {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.analyzeBundles();
            this.trackEvent('bundle_analyzer_initialized');
        }

        setupUI() {
            if (!document.getElementById('bundle-analyzer')) {
                const analyzer = document.createElement('div');
                analyzer.id = 'bundle-analyzer';
                analyzer.className = 'bundle-analyzer';
                analyzer.innerHTML = `<h2>Bundle Analyzer</h2>`;
                document.body.appendChild(analyzer);
            }
        }

        analyzeBundles() {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            return scripts.map(script => ({
                src: script.src,
                size: this.getScriptSize(script.src)
            }));
        }

        async getScriptSize(url) {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                return response.headers.get('content-length') || 0;
            } catch {
                return 0;
            }
        }

        optimize() {
            // Suggest optimizations
            return {
                suggestions: [
                    'Use code splitting',
                    'Minify JavaScript',
                    'Remove unused code',
                    'Use tree shaking'
                ]
            };
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`bundle_analyzer_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.bundleAnalyzer = new BundleSizeAnalyzerOptimizer();
        });
    } else {
        window.bundleAnalyzer = new BundleSizeAnalyzerOptimizer();
    }
})();

