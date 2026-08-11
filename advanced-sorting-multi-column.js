/**
 * Advanced Sorting with Multiple Columns
 * Sort data by multiple columns
 */
(function() {
    'use strict';

    class AdvancedSortingMultiColumn {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('multi_sort_initialized');
        }

        setupUI() {
            if (!document.getElementById('multi-sort')) {
                const sort = document.createElement('div');
                sort.id = 'multi-sort';
                sort.className = 'multi-sort';
                sort.innerHTML = `<h2>Multi-Column Sorting</h2>`;
                document.body.appendChild(sort);
            }
        }

        sort(data, sortConfigs) {
            this.trackEvent('sort_performed', { columnCount: sortConfigs.length, rowCount: data.length });
            return [...data].sort((a, b) => {
                for (const config of sortConfigs) {
                    const aVal = a[config.field];
                    const bVal = b[config.field];
                    let comparison = 0;
                    if (aVal < bVal) comparison = -1;
                    else if (aVal > bVal) comparison = 1;
                    if (config.order === 'desc') comparison *= -1;
                    if (comparison !== 0) return comparison;
                }
                return 0;
            });
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`multi_sort_${eventName}`, 1, data);
                }
                if (window.analytics) {
                    window.analytics.track(eventName, { module: 'advanced_sorting_multi_column', ...data });
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.multiSort = new AdvancedSortingMultiColumn();
        });
    } else {
        window.multiSort = new AdvancedSortingMultiColumn();
    }
})();

