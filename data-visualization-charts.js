/**
 * Data Visualization with Interactive Charts
 * 
 * Adds comprehensive data visualization with interactive charts.
 * 
 * @module DataVisualizationCharts
 * @version 1.0.0
 * @author Adriano To The Star
 */

class DataVisualizationCharts {
    constructor() {
        this.charts = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize data visualization system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('DataVisualizationCharts already initialized');
            return;
        }

        this.injectChartLibrary();
        this.injectStyles();
        
        this.isInitialized = true;
        this.trackEvent('data_viz_charts_initialized');
    }

    /**
     * Inject chart library (using Chart.js CDN)
     * @private
     */
    injectChartLibrary() {
        if (window.Chart) {
            return; // Already loaded
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.async = true;
        document.head.appendChild(script);
    }

    /**
     * Create chart
     * @public
     * @param {HTMLElement} container - Container element
     * @param {string} type - Chart type (line, bar, pie, etc.)
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     * @returns {Object} Chart instance
     */
    createChart(container, type, data, options = {}) {
        // Wait for Chart.js to load
        if (!window.Chart) {
            setTimeout(() => this.createChart(container, type, data, options), 100);
            return null;
        }

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        const chart = new Chart(canvas, {
            type,
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: options.legendPosition || 'top'
                    },
                    tooltip: {
                        enabled: options.showTooltips !== false
                    }
                },
                ...options
            }
        });

        this.charts.set(container, chart);
        return chart;
    }

    /**
     * Create line chart
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} labels - X-axis labels
     * @param {Array} datasets - Datasets array
     * @param {Object} options - Chart options
     * @returns {Object} Chart instance
     */
    createLineChart(container, labels, datasets, options = {}) {
        return this.createChart(container, 'line', {
            labels,
            datasets: datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                borderColor: ds.color || '#ba944f',
                backgroundColor: ds.backgroundColor || 'rgba(186, 148, 79, 0.1)',
                tension: 0.4,
                ...ds
            }))
        }, options);
    }

    /**
     * Create bar chart
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} labels - X-axis labels
     * @param {Array} datasets - Datasets array
     * @param {Object} options - Chart options
     * @returns {Object} Chart instance
     */
    createBarChart(container, labels, datasets, options = {}) {
        return this.createChart(container, 'bar', {
            labels,
            datasets: datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.color || '#ba944f',
                ...ds
            }))
        }, options);
    }

    /**
     * Create pie chart
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} labels - Label array
     * @param {Array} data - Data array
     * @param {Object} options - Chart options
     * @returns {Object} Chart instance
     */
    createPieChart(container, labels, data, options = {}) {
        const colors = options.colors || this.generateColors(data.length);
        return this.createChart(container, 'pie', {
            labels,
            datasets: [{
                data,
                backgroundColor: colors
            }]
        }, options);
    }

    /**
     * Generate colors
     * @private
     * @param {number} count - Number of colors
     * @returns {Array} Color array
     */
    generateColors(count) {
        const colors = [
            '#ba944f', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
        ];
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    /**
     * Update chart
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Object} data - New chart data
     */
    updateChart(container, data) {
        const chart = this.charts.get(container);
        if (chart) {
            chart.data = data;
            chart.update();
        }
    }

    /**
     * Destroy chart
     * @public
     * @param {HTMLElement} container - Container element
     */
    destroyChart(container) {
        const chart = this.charts.get(container);
        if (chart) {
            chart.destroy();
            this.charts.delete(container);
        }
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('chart-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'chart-styles';
        style.textContent = `
            .chart-container {
                position: relative;
                width: 100%;
                height: 400px;
                margin: 1rem 0;
            }

            .chart-container canvas {
                max-height: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_viz_charts_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.DataVisualizationCharts = DataVisualizationCharts;
window.dataVisualization = new DataVisualizationCharts();
window.dataVisualization.init();
