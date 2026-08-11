/**
 * Data Sampling and Preview Tools
 * Sample and preview data
 */
(function() {
    'use strict';

    class DataSamplingPreview {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_sampling_preview_initialized');
        }

        setupUI() {
            if (!document.getElementById('sampling-tool')) {
                const tool = document.createElement('div');
                tool.id = 'sampling-tool';
                tool.className = 'sampling-tool';
                tool.innerHTML = `<h2>Data Sampling</h2>`;
                document.body.appendChild(tool);
            }
        }

        sample(data, size) {
            const shuffled = [...data].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, size);
        }

        preview(data, limit = 10) {
            return data.slice(0, limit);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_sampling_preview_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataSampling = new DataSamplingPreview();
        });
    } else {
        window.dataSampling = new DataSamplingPreview();
    }
})();

