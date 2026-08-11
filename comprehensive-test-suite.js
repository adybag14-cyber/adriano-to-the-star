/**
 * Comprehensive Test Suite (Unit, Integration, E2E)
 * Test framework setup
 */
(function() {
    'use strict';

    class ComprehensiveTestSuite {
        constructor() {
            this.tests = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('test_suite_initialized');
        }

        setupUI() {
            if (!document.getElementById('test-suite')) {
                const suite = document.createElement('div');
                suite.id = 'test-suite';
                suite.className = 'test-suite';
                suite.innerHTML = `<h2>Test Suite</h2>`;
                document.body.appendChild(suite);
            }
        }

        addTest(name, fn) {
            this.tests.push({ name, fn });
        }

        async runTests() {
            const results = [];
            for (const test of this.tests) {
                try {
                    await test.fn();
                    results.push({ name: test.name, status: 'passed' });
                } catch (error) {
                    results.push({ name: test.name, status: 'failed', error: error.message });
                }
            }
            return results;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`test_suite_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.testSuite = new ComprehensiveTestSuite();
        });
    } else {
        window.testSuite = new ComprehensiveTestSuite();
    }
})();

