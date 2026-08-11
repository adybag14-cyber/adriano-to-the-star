/**
 * Real-time Data Visualization
 * Live updating charts and dashboards with WebSocket support
 * @author Agent 3 - Adriano To The Star
 */

class RealtimeDataViz {
    constructor() {
        this.sockets = new Map();
        this.charts = new Map();
        this.updateIntervals = new Map();
        this.dataBuffers = new Map();
        this.init();
    }

    init() {
        this.setupWebSocketHandling();
        this.setupRealtimeCharts();
    }

    setupWebSocketHandling() {
        // WebSocket connection for real-time data
        this.connectWebSocket = (url, chartId) => {
            const ws = new WebSocket(url);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.updateChart(chartId, data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                setTimeout(() => this.connectWebSocket(url, chartId), 5000);
            };

            this.sockets.set(chartId, ws);
            return ws;
        };
    }

    setupRealtimeCharts() {
        // Create real-time line chart
        this.createRealtimeLineChart = (container, config) => {
            const chartId = `rt_${Date.now()}`;
            const maxDataPoints = config.maxPoints || 50;
            
            this.dataBuffers.set(chartId, {
                labels: [],
                datasets: config.datasets.map(ds => ({ ...ds, data: [] }))
            });

            const chart = window.chartLibrary.createChart('line', container, {
                labels: [],
                datasets: config.datasets.map(ds => ({ ...ds, data: [] }))
            });

            this.charts.set(chartId, chart);

            // Set up real-time updates
            if (config.updateInterval) {
                const interval = setInterval(() => {
                    this.simulateDataUpdate(chartId);
                }, config.updateInterval);
                this.updateIntervals.set(chartId, interval);
            }

            return chartId;
        };
    }

    updateChart(chartId, newData) {
        const buffer = this.dataBuffers.get(chartId);
        const chart = this.charts.get(chartId);
        
        if (!buffer || !chart) return;

        // Add new data point
        buffer.labels.push(newData.label || new Date().toLocaleTimeString());
        
        newData.datasets?.forEach((dataset, index) => {
            if (buffer.datasets[index]) {
                buffer.datasets[index].data.push(dataset.value);
            }
        });

        // Limit data points
        const maxPoints = 50;
        if (buffer.labels.length > maxPoints) {
            buffer.labels.shift();
            buffer.datasets.forEach(ds => ds.data.shift());
        }

        // Update chart
        chart.update(buffer);
    }

    simulateDataUpdate(chartId) {
        const buffer = this.dataBuffers.get(chartId);
        if (!buffer) return;

        const newData = {
            label: new Date().toLocaleTimeString(),
            datasets: buffer.datasets.map(ds => ({
                value: Math.random() * 100
            }))
        };

        this.updateChart(chartId, newData);
    }
}

// Initialize
window.realtimeViz = new RealtimeDataViz();
