/**
 * Data Pipeline Monitoring Dashboard
 * Monitor data pipelines
 */
(function() {
    'use strict';

    class DataPipelineMonitoring {
        constructor() {
            this.pipelines = [];
            this.metrics = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.startMonitoring();
            this.trackEvent('data_pipeline_mon_initialized');
        }

        setupUI() {
            if (!document.getElementById('pipeline-monitoring')) {
                const monitoring = document.createElement('div');
                monitoring.id = 'pipeline-monitoring';
                monitoring.className = 'pipeline-monitoring';
                monitoring.innerHTML = `
                    <div class="monitoring-header">
                        <h2>Pipeline Monitoring</h2>
                    </div>
                    <div class="pipelines-grid" id="pipelines-grid"></div>
                `;
                document.body.appendChild(monitoring);
            }
        }

        registerPipeline(pipeline) {
            this.pipelines.push({
                id: pipeline.id,
                name: pipeline.name,
                status: 'running',
                metrics: {
                    throughput: 0,
                    latency: 0,
                    errorRate: 0
                }
            });
            this.renderPipelines();
        }

        updateMetrics(pipelineId, metrics) {
            const pipeline = this.pipelines.find(p => p.id === pipelineId);
            if (pipeline) {
                Object.assign(pipeline.metrics, metrics);
                this.renderPipelines();
            }
        }

        renderPipelines() {
            const grid = document.getElementById('pipelines-grid');
            if (!grid) return;

            grid.innerHTML = this.pipelines.map(pipeline => `
                <div class="pipeline-card ${pipeline.status}">
                    <div class="pipeline-name">${pipeline.name}</div>
                    <div class="pipeline-status">${pipeline.status}</div>
                    <div class="pipeline-metrics">
                        <div>Throughput: ${pipeline.metrics.throughput}/s</div>
                        <div>Latency: ${pipeline.metrics.latency}ms</div>
                        <div>Error Rate: ${pipeline.metrics.errorRate}%</div>
                    </div>
                </div>
            `).join('');
        }

        startMonitoring() {
            setInterval(() => {
                this.collectMetrics();
            }, 5000);
        }

        collectMetrics() {
            // Collect metrics from pipelines
            this.pipelines.forEach(pipeline => {
                // Simulate metrics collection
                pipeline.metrics.throughput = Math.floor(Math.random() * 1000);
                pipeline.metrics.latency = Math.floor(Math.random() * 100);
                pipeline.metrics.errorRate = Math.random() * 5;
            });
            this.renderPipelines();
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_pipeline_mon_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.pipelineMonitoring = new DataPipelineMonitoring();
        });
    } else {
        window.pipelineMonitoring = new DataPipelineMonitoring();
    }
})();

