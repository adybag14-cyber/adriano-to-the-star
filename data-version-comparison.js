/**
 * Data Version Comparison Tool
 * Compare different versions of data
 */
(function() {
    'use strict';

    class DataVersionComparison {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_version_comparison_initialized');
        }

        setupUI() {
            if (!document.getElementById('version-comparison')) {
                const comparison = document.createElement('div');
                comparison.id = 'version-comparison';
                comparison.className = 'version-comparison';
                comparison.innerHTML = `<h2>Version Comparison</h2>`;
                document.body.appendChild(comparison);
            }
        }

        compareVersions(version1, version2) {
            const diff = {};
            const allKeys = new Set([...Object.keys(version1), ...Object.keys(version2)]);
            allKeys.forEach(key => {
                if (version1[key] !== version2[key]) {
                    diff[key] = {
                        old: version1[key],
                        new: version2[key]
                    };
                }
            });
            return diff;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_version_comparison_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.versionComparison = new DataVersionComparison();
        });
    } else {
        window.versionComparison = new DataVersionComparison();
    }
})();

