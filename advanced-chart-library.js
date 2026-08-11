/**
 * Advanced Chart Library Integration
 * Comprehensive data visualization with multiple chart types, animations, and interactions
 * @author Agent 3 - Adriano To The Star
 * @version 1.0.0
 */

class AdvancedChartLibrary {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: this.defaultTooltipCallbacks
                }
            }
        };
        this.themeColors = this.getThemeColors();
        this.init();
    }

    init() {
        this.setupChartStyles();
        this.createChartRegistry();
        this.setupEventListeners();
        this.trackEvent('chart_library_initialized');
    }

    getThemeColors() {
        const styles = getComputedStyle(document.documentElement);
        return {
            primary: styles.getPropertyValue('--color-primary') || '#6366f1',
            secondary: styles.getPropertyValue('--color-secondary') || '#8b5cf6',
            accent: styles.getPropertyValue('--color-accent') || '#ec4899',
            background: styles.getPropertyValue('--color-background') || '#0f172a',
            surface: styles.getPropertyValue('--color-surface') || '#1e293b',
            text: styles.getPropertyValue('--color-text') || '#f1f5f9',
            textSecondary: styles.getPropertyValue('--color-text-secondary') || '#94a3b8'
        };
    }

    setupChartStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chart-container {
                position: relative;
                width: 100%;
                height: 400px;
                background: var(--color-surface);
                border-radius: 12px;
                padding: 20px;
                box-shadow: var(--effect-shadow);
                margin: 20px 0;
            }

            .chart-container.small {
                height: 300px;
            }

            .chart-container.large {
                height: 600px;
            }

            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .chart-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--color-text);
                margin: 0;
            }

            .chart-controls {
                display: flex;
                gap: 10px;
            }

            .chart-control-btn {
                padding: 6px 12px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .chart-control-btn:hover {
                background: var(--color-accent);
                transform: translateY(-1px);
            }

            .chart-wrapper {
                position: relative;
                width: 100%;
                height: calc(100% - 50px);
            }

            .chart-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }

            .chart-loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--color-surface);
                border-top: 3px solid var(--color-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .chart-error {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: var(--color-text);
            }

            .chart-legend-custom {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid var(--color-background);
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: opacity 0.2s ease;
            }

            .legend-item:hover {
                opacity: 0.8;
            }

            .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
            }

            .legend-label {
                font-size: 12px;
                color: var(--color-text);
            }

            .chart-tooltip-custom {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 8px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .chart-tooltip-custom.visible {
                opacity: 1;
            }

            .chart-grid-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
            }

            .chart-annotation {
                position: absolute;
                background: var(--color-accent);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                z-index: 15;
            }

            .chart-zoom-controls {
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                z-index: 20;
            }

            .zoom-btn {
                width: 30px;
                height: 30px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s ease;
            }

            .zoom-btn:hover {
                background: var(--color-accent);
            }

            .chart-export-menu {
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 20;
            }

            .export-btn {
                padding: 6px 12px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .export-btn:hover {
                background: var(--color-accent);
            }
        `;
        document.head.appendChild(style);
    }

    createChartRegistry() {
        this.chartTypes = {
            line: this.createLineChart.bind(this),
            bar: this.createBarChart.bind(this),
            area: this.createAreaChart.bind(this),
            pie: this.createPieChart.bind(this),
            doughnut: this.createDoughnutChart.bind(this),
            radar: this.createRadarChart.bind(this),
            polar: this.createPolarChart.bind(this),
            scatter: this.createScatterChart.bind(this),
            bubble: this.createBubbleChart.bind(this),
            heatmap: this.createHeatmapChart.bind(this),
            candlestick: this.createCandlestickChart.bind(this),
            gauge: this.createGaugeChart.bind(this),
            progress: this.createProgressChart.bind(this),
            timeline: this.createTimelineChart.bind(this),
            sankey: this.createSankeyChart.bind(this),
            treemap: this.createTreemapChart.bind(this)
        };
    }

    setupEventListeners() {
        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.themeColors = this.getThemeColors();
            this.updateAllChartsTheme();
        });

        // Listen for window resize
        window.addEventListener('resize', () => {
            this.resizeAllCharts();
        });
    }

    // Chart creation methods
    createLineChart(container, data, options = {}) {
        const config = {
            type: 'line',
            data: this.processLineData(data),
            options: this.mergeOptions(this.getLineOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createBarChart(container, data, options = {}) {
        const config = {
            type: 'bar',
            data: this.processBarData(data),
            options: this.mergeOptions(this.getBarOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createAreaChart(container, data, options = {}) {
        const config = {
            type: 'line',
            data: this.processAreaData(data),
            options: this.mergeOptions(this.getAreaOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createPieChart(container, data, options = {}) {
        const config = {
            type: 'pie',
            data: this.processPieData(data),
            options: this.mergeOptions(this.getPieOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createDoughnutChart(container, data, options = {}) {
        const config = {
            type: 'doughnut',
            data: this.processPieData(data),
            options: this.mergeOptions(this.getDoughnutOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createRadarChart(container, data, options = {}) {
        const config = {
            type: 'radar',
            data: this.processRadarData(data),
            options: this.mergeOptions(this.getRadarOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createScatterChart(container, data, options = {}) {
        const config = {
            type: 'scatter',
            data: this.processScatterData(data),
            options: this.mergeOptions(this.getScatterOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createBubbleChart(container, data, options = {}) {
        const config = {
            type: 'bubble',
            data: this.processBubbleData(data),
            options: this.mergeOptions(this.getBubbleOptions(), options)
        };
        return this.renderChart(container, config);
    }

    createHeatmapChart(container, data, options = {}) {
        return this.renderCustomChart(container, 'heatmap', data, options);
    }

    createGaugeChart(container, data, options = {}) {
        return this.renderCustomChart(container, 'gauge', data, options);
    }

    createProgressChart(container, data, options = {}) {
        return this.renderCustomChart(container, 'progress', data, options);
    }

    createTimelineChart(container, data, options = {}) {
        return this.renderCustomChart(container, 'timeline', data, options);
    }

    createSankeyChart(container, data, options = {}) {
        return this.renderCustomChart(container, 'sankey', data, options);
    }

    createTreemapChart(container, data, options = {}) {
        return this.renderCustomChart(container, 'treemap', data, options);
    }

    // Data processing methods
    processLineData(data) {
        return {
            labels: data.labels || [],
            datasets: (data.datasets || []).map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                borderColor: dataset.color || this.getChartColor(index),
                backgroundColor: dataset.color || this.getChartColor(index, 0.1),
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: dataset.color || this.getChartColor(index),
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }))
        };
    }

    processBarData(data) {
        return {
            labels: data.labels || [],
            datasets: (data.datasets || []).map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                backgroundColor: dataset.color || this.getChartColor(index, 0.8),
                borderColor: dataset.color || this.getChartColor(index),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }))
        };
    }

    processAreaData(data) {
        const processedData = this.processLineData(data);
        processedData.datasets.forEach(dataset => {
            dataset.fill = true;
            dataset.backgroundColor = dataset.borderColor.replace('rgb', 'rgba').replace(')', ', 0.1)');
        });
        return processedData;
    }

    processPieData(data) {
        return {
            labels: data.labels || [],
            datasets: [{
                data: data.data || [],
                backgroundColor: (data.colors || []).map((color, index) => 
                    color || this.getChartColor(index, 0.8)
                ),
                borderColor: this.themeColors.surface,
                borderWidth: 2,
                hoverOffset: 4
            }]
        };
    }

    processRadarData(data) {
        return {
            labels: data.labels || [],
            datasets: (data.datasets || []).map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                borderColor: dataset.color || this.getChartColor(index),
                backgroundColor: dataset.color || this.getChartColor(index, 0.2),
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }))
        };
    }

    processScatterData(data) {
        return {
            datasets: (data.datasets || []).map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                backgroundColor: dataset.color || this.getChartColor(index, 0.8),
                borderColor: dataset.color || this.getChartColor(index),
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            }))
        };
    }

    processBubbleData(data) {
        return {
            datasets: (data.datasets || []).map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                backgroundColor: dataset.color || this.getChartColor(index, 0.6),
                borderColor: dataset.color || this.getChartColor(index),
                borderWidth: 1
            }))
        };
    }

    // Chart options
    getLineOptions() {
        return {
            scales: {
                x: {
                    grid: {
                        color: this.themeColors.background,
                        borderColor: this.themeColors.textSecondary
                    },
                    ticks: {
                        color: this.themeColors.textSecondary
                    }
                },
                y: {
                    grid: {
                        color: this.themeColors.background,
                        borderColor: this.themeColors.textSecondary
                    },
                    ticks: {
                        color: this.themeColors.textSecondary
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        };
    }

    getBarOptions() {
        return {
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: this.themeColors.textSecondary
                    }
                },
                y: {
                    grid: {
                        color: this.themeColors.background,
                        borderColor: this.themeColors.textSecondary
                    },
                    ticks: {
                        color: this.themeColors.textSecondary
                    }
                }
            }
        };
    }

    getAreaOptions() {
        return this.getLineOptions();
    }

    getPieOptions() {
        return {
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        };
    }

    getDoughnutOptions() {
        return {
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        };
    }

    getRadarOptions() {
        return {
            scales: {
                r: {
                    grid: {
                        color: this.themeColors.background
                    },
                    pointLabels: {
                        color: this.themeColors.text
                    },
                    ticks: {
                        color: this.themeColors.textSecondary,
                        backdropColor: 'transparent'
                    }
                }
            }
        };
    }

    getScatterOptions() {
        return {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: {
                        color: this.themeColors.background,
                        borderColor: this.themeColors.textSecondary
                    },
                    ticks: {
                        color: this.themeColors.textSecondary
                    }
                },
                y: {
                    grid: {
                        color: this.themeColors.background,
                        borderColor: this.themeColors.textSecondary
                    },
                    ticks: {
                        color: this.themeColors.textSecondary
                    }
                }
            }
        };
    }

    getBubbleOptions() {
        return this.getScatterOptions();
    }

    // Utility methods
    getChartColor(index, alpha = 1) {
        const colors = [
            `rgba(99, 102, 241, ${alpha})`,
            `rgba(139, 92, 246, ${alpha})`,
            `rgba(236, 72, 153, ${alpha})`,
            `rgba(245, 158, 11, ${alpha})`,
            `rgba(16, 185, 129, ${alpha})`,
            `rgba(239, 68, 68, ${alpha})`,
            `rgba(59, 130, 246, ${alpha})`,
            `rgba(14, 165, 233, ${alpha})`
        ];
        return colors[index % colors.length];
    }

    mergeOptions(defaultOptions, customOptions) {
        return this.deepMerge(defaultOptions, customOptions);
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    renderChart(container, config) {
        const containerElement = typeof container === 'string' ? 
            document.querySelector(container) : container;
        
        if (!containerElement) {
            console.error('Chart container not found');
            return null;
        }

        // Clear existing content
        containerElement.innerHTML = '';

        // Create chart structure
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        chartWrapper.appendChild(canvas);
        containerElement.appendChild(chartWrapper);

        // Create chart instance (simplified - in real implementation would use Chart.js or similar)
        const chartId = `chart_${Date.now()}`;
        const chart = {
            id: chartId,
            type: config.type,
            config: config,
            canvas: canvas,
            container: containerElement,
            data: config.data,
            options: config.options,
            update: (newData) => this.updateChart(chartId, newData),
            destroy: () => this.destroyChart(chartId),
            resize: () => this.resizeChart(chartId)
        };

        this.charts.set(chartId, chart);
        this.drawChart(chart);
        this.trackEvent('chart_rendered', { chartId, type: config.type });

        return chart;
    }

    renderCustomChart(container, type, data, options = {}) {
        // Implementation for custom chart types (heatmap, gauge, etc.)
        const containerElement = typeof container === 'string' ? 
            document.querySelector(container) : container;
        
        if (!containerElement) return null;

        const chartId = `chart_${Date.now()}`;
        const chart = {
            id: chartId,
            type: type,
            container: containerElement,
            data: data,
            options: options,
            update: (newData) => this.updateChart(chartId, newData),
            destroy: () => this.destroyChart(chartId),
            resize: () => this.resizeChart(chartId)
        };

        this.charts.set(chartId, chart);
        this.drawCustomChart(chart);

        return chart;
    }

    drawChart(chart) {
        const ctx = chart.canvas.getContext('2d');
        const { data, options } = chart.config;

        // Simplified drawing - in real implementation would use Chart.js
        this.clearCanvas(ctx, chart.canvas);
        
        switch (chart.type) {
            case 'line':
                this.drawLineChart(ctx, data, options, chart.canvas);
                break;
            case 'bar':
                this.drawBarChart(ctx, data, options, chart.canvas);
                break;
            case 'pie':
                this.drawPieChart(ctx, data, options, chart.canvas);
                break;
            // Add other chart types
        }
    }

    drawLineChart(ctx, data, options, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Draw axes
        ctx.strokeStyle = this.themeColors.textSecondary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw data
        if (data.datasets && data.datasets.length > 0) {
            const dataset = data.datasets[0];
            const points = dataset.data;
            const xStep = chartWidth / (points.length - 1);
            const yMax = Math.max(...points);
            const yScale = chartHeight / yMax;

            ctx.strokeStyle = dataset.borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();

            points.forEach((point, index) => {
                const x = padding + index * xStep;
                const y = height - padding - point * yScale;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        }
    }

    drawBarChart(ctx, data, options, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Draw axes
        ctx.strokeStyle = this.themeColors.textSecondary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw data
        if (data.datasets && data.datasets.length > 0) {
            const dataset = data.datasets[0];
            const values = dataset.data;
            const barWidth = chartWidth / values.length * 0.8;
            const barSpacing = chartWidth / values.length * 0.2;
            const yMax = Math.max(...values);
            const yScale = chartHeight / yMax;

            ctx.fillStyle = dataset.backgroundColor;

            values.forEach((value, index) => {
                const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
                const barHeight = value * yScale;
                const y = height - padding - barHeight;

                ctx.fillRect(x, y, barWidth, barHeight);
            });
        }
    }

    drawPieChart(ctx, data, options, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        if (data.datasets && data.datasets.length > 0) {
            const dataset = data.datasets[0];
            const values = dataset.data;
            const colors = dataset.backgroundColor;
            const total = values.reduce((sum, value) => sum + value, 0);
            let currentAngle = -Math.PI / 2;

            values.forEach((value, index) => {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                ctx.fillStyle = colors[index % colors.length];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();

                currentAngle += sliceAngle;
            });
        }
    }

    drawCustomChart(chart) {
        // Implementation for custom chart types
        const container = chart.container;
        
        switch (chart.type) {
            case 'heatmap':
                this.drawHeatmap(container, chart.data, chart.options);
                break;
            case 'gauge':
                this.drawGauge(container, chart.data, chart.options);
                break;
            case 'progress':
                this.drawProgress(container, chart.data, chart.options);
                break;
        }
    }

    drawHeatmap(container, data, options) {
        // Simple heatmap implementation
        container.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--color-text);">Heatmap Chart - Custom Implementation</div>';
    }

    drawGauge(container, data, options) {
        const value = data.value || 0;
        const max = data.max || 100;
        const percentage = (value / max) * 100;
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 48px; font-weight: bold; color: var(--color-primary);">${value}</div>
                <div style="font-size: 14px; color: var(--color-text-secondary);">${data.label || 'Gauge'}</div>
                <div style="width: 200px; height: 8px; background: var(--color-background); border-radius: 4px; margin-top: 20px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: var(--color-primary); transition: width 1s ease;"></div>
                </div>
            </div>
        `;
    }

    drawProgress(container, data, options) {
        container.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--color-text);">Progress Chart - Custom Implementation</div>';
    }

    clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Chart management methods
    updateChart(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        chart.data = newData;
        if (chart.canvas) {
            this.drawChart(chart);
        } else {
            this.drawCustomChart(chart);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`chart_library_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_chart_library', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }

    resizeChart(chartId) {
        const chart = this.charts.get(chartId);
        if (!chart || !chart.canvas) return;

        const container = chart.container;
        const wrapper = container.querySelector('.chart-wrapper');
        if (wrapper) {
            chart.canvas.width = wrapper.offsetWidth;
            chart.canvas.height = wrapper.offsetHeight;
            this.drawChart(chart);
        }
    }

    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        if (chart.canvas) {
            chart.canvas.remove();
        } else {
            chart.container.innerHTML = '';
        }

        this.charts.delete(chartId);
    }

    resizeAllCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }

    updateAllChartsTheme() {
        this.charts.forEach(chart => {
            if (chart.canvas) {
                this.drawChart(chart);
            } else {
                this.drawCustomChart(chart);
            }
        });
    }

    // Export and utility methods
    exportChart(chartId, format = 'png') {
        const chart = this.charts.get(chartId);
        if (!chart || !chart.canvas) return null;

        if (format === 'png') {
            return chart.canvas.toDataURL('image/png');
        } else if (format === 'jpg') {
            return chart.canvas.toDataURL('image/jpeg');
        } else if (format === 'svg') {
            // SVG export would require additional implementation
            return null;
        }

        return null;
    }

    getChartData(chartId) {
        const chart = this.charts.get(chartId);
        return chart ? chart.data : null;
    }

    setChartOption(chartId, optionPath, value) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        const path = optionPath.split('.');
        let current = chart.options;

        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]] || {};
        }

        current[path[path.length - 1]] = value;
        this.drawChart(chart);
    }

    // Default tooltip callbacks
    defaultTooltipCallbacks = {
        label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y;
            }
            return label;
        }
    };

    // Public API
    createChart(type, container, data, options = {}) {
        const chartMethod = this.chartTypes[type];
        if (chartMethod) {
            return chartMethod(container, data, options);
        } else {
            console.error(`Chart type '${type}' not supported`);
            return null;
        }
    }

    getChart(chartId) {
        return this.charts.get(chartId);
    }

    getAllCharts() {
        return Array.from(this.charts.values());
    }

    destroyAllCharts() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

// Initialize the advanced chart library
const advancedChartLibrary = new AdvancedChartLibrary();

// Export for use in other modules
window.AdvancedChartLibrary = AdvancedChartLibrary;
window.chartLibrary = advancedChartLibrary;
