/**
 * Data Comparison and Diff Viewer
 * Compare and view differences between datasets
 */
(function() {
    'use strict';

    class DataComparisonDiffViewer {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_comparison_initialized');
        }

        setupUI() {
            if (!document.getElementById('diff-viewer')) {
                const viewer = document.createElement('div');
                viewer.id = 'diff-viewer';
                viewer.className = 'diff-viewer';
                viewer.innerHTML = `<h2>Data Comparison</h2>`;
                document.body.appendChild(viewer);
            }
        }

        compare(data1, data2, key) {
            const diff = {
                added: [],
                removed: [],
                modified: []
            };
            const map1 = new Map(data1.map(d => [d[key], d]));
            const map2 = new Map(data2.map(d => [d[key], d]));
            
            map2.forEach((value, k) => {
                if (!map1.has(k)) {
                    diff.added.push(value);
                } else if (JSON.stringify(value) !== JSON.stringify(map1.get(k))) {
                    diff.modified.push({ old: map1.get(k), new: value });
                }
            });
            
            map1.forEach((value, k) => {
                if (!map2.has(k)) {
                    diff.removed.push(value);
                }
            });
            
            return diff;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_comparison_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataComparison = new DataComparisonDiffViewer();
        });
    } else {
        window.dataComparison = new DataComparisonDiffViewer();
    }
})();

