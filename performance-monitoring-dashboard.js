/**
 * Performance Monitoring Dashboard
 * Monitor application performance
 */
(function() {
    'use strict';

    class PerformanceMonitoringDashboard {
        constructor() {
            this.metrics = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.startMonitoring();
        }

        setupUI() {
            if (!document.getElementById('performance-dashboard')) {
                const dashboard = document.createElement('div');
                dashboard.id = 'performance-dashboard';
                dashboard.className = 'performance-dashboard';
                dashboard.innerHTML = `
                    <div class="dashboard-header">
                        <h2>Performance Monitoring</h2>
                    </div>
                    <div class="metrics-grid" id="metrics-grid"></div>
                `;
                document.body.appendChild(dashboard);
            }
        }

        startMonitoring() {
            this.monitorPageLoad();
            this.monitorResourceTiming();
            this.monitorUserTiming();
        }

        monitorPageLoad() {
            window.addEventListener('load', () => {
                const perfData = performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                this.recordMetric('pageLoad', pageLoadTime);
            });
        }

        monitorResourceTiming() {
            const resources = performance.getEntriesByType('resource');
            resources.forEach(resource => {
                this.recordMetric(`resource_${resource.name}`, resource.duration);
            });
        }

        monitorUserTiming() {
            const marks = performance.getEntriesByType('mark');
            marks.forEach(mark => {
                this.recordMetric(`mark_${mark.name}`, mark.startTime);
            });
        }

        recordMetric(name, value) {
            this.metrics.push({
                name: name,
                value: value,
                timestamp: new Date().toISOString()
            });
            this.renderMetrics();
        }

        renderMetrics() {
            const grid = document.getElementById('metrics-grid');
            if (!grid) return;
            
            const latest = {};
            this.metrics.slice(-100).forEach(metric => {
                latest[metric.name] = metric.value;
            });

            grid.innerHTML = Object.entries(latest).map(([name, value]) => `
                <div class="metric-card">
                    <div class="metric-name">${name}</div>
                    <div class="metric-value">${value.toFixed(2)}ms</div>
                </div>
            `).join('');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.performanceMonitoring = new PerformanceMonitoringDashboard();
        });
    } else {
        window.performanceMonitoring = new PerformanceMonitoringDashboard();
    }
})();

