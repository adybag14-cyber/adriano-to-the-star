/**
 * Data Deduplication and Merge Tools
 * Find and merge duplicate records
 */
(function() {
    'use strict';

    class DataDeduplicationMerge {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_dedup_merge_initialized');
        }

        setupUI() {
            if (!document.getElementById('deduplication-tool')) {
                const tool = document.createElement('div');
                tool.id = 'deduplication-tool';
                tool.className = 'deduplication-tool';
                tool.innerHTML = `
                    <div class="tool-header">
                        <h2>Deduplication Tool</h2>
                        <button class="scan-btn" id="scan-duplicates">Scan for Duplicates</button>
                    </div>
                    <div class="duplicates-list" id="duplicates-list"></div>
                `;
                document.body.appendChild(tool);
            }
        }

        findDuplicates(data, key) {
            const seen = new Map();
            const duplicates = [];
            data.forEach(item => {
                const value = item[key];
                if (seen.has(value)) {
                    duplicates.push([seen.get(value), item]);
                } else {
                    seen.set(value, item);
                }
            });
            return duplicates;
        }

        mergeRecords(records, strategy) {
            const merged = {};
            records.forEach(record => {
                Object.keys(record).forEach(key => {
                    if (!merged[key] || strategy === 'latest') {
                        merged[key] = record[key];
                    }
                });
            });
            return merged;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_dedup_merge_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.deduplicationTool = new DataDeduplicationMerge();
        });
    } else {
        window.deduplicationTool = new DataDeduplicationMerge();
    }
})();


