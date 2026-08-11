/**
 * Dashboard Analytics with Custom Date Ranges
 * Provides analytics dashboard with flexible date range selection
 */
(function() {
    'use strict';

    class DashboardAnalytics {
        constructor() {
            this.dateRange = {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                end: new Date()
            };
            this.metrics = {};
            this.charts = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.setupEventListeners();
            this.loadData();
            this.trackEvent('dash_analytics_custom_initialized');
        }

        setupUI() {
            if (!document.getElementById('analytics-dashboard')) {
                const dashboard = document.createElement('div');
                dashboard.id = 'analytics-dashboard';
                dashboard.className = 'analytics-dashboard';
                dashboard.innerHTML = `
                    <div class="dashboard-header">
                        <h2>Analytics Dashboard</h2>
                        <div class="date-range-selector">
                            <button class="quick-range-btn" data-range="today">Today</button>
                            <button class="quick-range-btn" data-range="week">This Week</button>
                            <button class="quick-range-btn" data-range="month">This Month</button>
                            <button class="quick-range-btn" data-range="quarter">This Quarter</button>
                            <button class="quick-range-btn" data-range="year">This Year</button>
                            <button class="quick-range-btn" data-range="custom">Custom</button>
                            <input type="date" id="date-start" />
                            <input type="date" id="date-end" />
                            <button class="apply-range-btn" id="apply-date-range">Apply</button>
                        </div>
                    </div>
                    <div class="metrics-grid" id="metrics-grid"></div>
                    <div class="charts-container" id="charts-container"></div>
                `;
                document.body.appendChild(dashboard);
            }
        }

        setupEventListeners() {
            // Quick range buttons
            document.querySelectorAll('.quick-range-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const range = e.target.dataset.range;
                    if (range === 'custom') {
                        this.showCustomDatePicker();
                    } else {
                        this.setQuickRange(range);
                    }
                });
            });

            // Apply custom date range
            document.getElementById('apply-date-range')?.addEventListener('click', () => {
                this.applyCustomRange();
            });

            // Date input changes
            document.getElementById('date-start')?.addEventListener('change', () => {
                this.updateDateRange();
            });
            document.getElementById('date-end')?.addEventListener('change', () => {
                this.updateDateRange();
            });
        }

        setQuickRange(range) {
            const now = new Date();
            let start = new Date();

            switch (range) {
                case 'today':
                    start.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'quarter':
                    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
            }

            this.dateRange = { start, end: now };
            this.updateDateInputs();
            this.loadData();
        }

        showCustomDatePicker() {
            const startInput = document.getElementById('date-start');
            const endInput = document.getElementById('date-end');
            if (startInput && endInput) {
                startInput.style.display = 'inline-block';
                endInput.style.display = 'inline-block';
                this.updateDateInputs();
            }
        }

        updateDateInputs() {
            const startInput = document.getElementById('date-start');
            const endInput = document.getElementById('date-end');
            if (startInput && endInput) {
                startInput.value = this.formatDateForInput(this.dateRange.start);
                endInput.value = this.formatDateForInput(this.dateRange.end);
            }
        }

        formatDateForInput(date) {
            return date.toISOString().split('T')[0];
        }

        updateDateRange() {
            const startInput = document.getElementById('date-start');
            const endInput = document.getElementById('date-end');
            if (startInput && endInput && startInput.value && endInput.value) {
                this.dateRange.start = new Date(startInput.value);
                this.dateRange.end = new Date(endInput.value);
            }
        }

        applyCustomRange() {
            this.updateDateRange();
            if (this.dateRange.start && this.dateRange.end) {
                this.loadData();
            }
        }

        async loadData() {
            try {
                const data = await this.fetchAnalyticsData();
                this.metrics = data.metrics || {};
                this.renderMetrics();
                this.renderCharts(data.chartData || []);
            } catch (error) {
                console.error('Failed to load analytics data:', error);
                this.showError('Failed to load analytics data');
            }
        }

        async fetchAnalyticsData() {
            const params = new URLSearchParams({
                start: this.dateRange.start.toISOString(),
                end: this.dateRange.end.toISOString()
            });

            const response = await fetch(`/api/analytics?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }
            return await response.json();
        }

        renderMetrics() {
            const grid = document.getElementById('metrics-grid');
            if (!grid) return;

            const metricCards = [
                { key: 'totalUsers', label: 'Total Users', icon: '👥', color: '#4ECDC4' },
                { key: 'activeUsers', label: 'Active Users', icon: '✓', color: '#45B7D1' },
                { key: 'totalViews', label: 'Total Views', icon: '👁️', color: '#FF6B6B' },
                { key: 'totalActions', label: 'Total Actions', icon: '⚡', color: '#FFA07A' },
                { key: 'conversionRate', label: 'Conversion Rate', icon: '📈', color: '#98D8C8' },
                { key: 'avgSessionTime', label: 'Avg Session Time', icon: '⏱️', color: '#F7DC6F' }
            ];

            grid.innerHTML = metricCards.map(metric => {
                const value = this.metrics[metric.key] || 0;
                const formattedValue = this.formatMetricValue(metric.key, value);
                const change = this.metrics[`${metric.key}Change`] || 0;
                const changeClass = change >= 0 ? 'positive' : 'negative';

                return `
                    <div class="metric-card" style="border-top-color: ${metric.color}">
                        <div class="metric-icon">${metric.icon}</div>
                        <div class="metric-content">
                            <div class="metric-label">${metric.label}</div>
                            <div class="metric-value">${formattedValue}</div>
                            ${change !== 0 ? `
                                <div class="metric-change ${changeClass}">
                                    ${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        formatMetricValue(key, value) {
            if (key === 'conversionRate') {
                return `${(value * 100).toFixed(2)}%`;
            }
            if (key === 'avgSessionTime') {
                const minutes = Math.floor(value / 60);
                const seconds = Math.floor(value % 60);
                return `${minutes}m ${seconds}s`;
            }
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            }
            if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            }
            return value.toString();
        }

        renderCharts(chartData) {
            const container = document.getElementById('charts-container');
            if (!container) return;

            container.innerHTML = `
                <div class="chart-row">
                    <div class="chart-card">
                        <h3>User Activity Over Time</h3>
                        <canvas id="activity-chart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h3>Action Distribution</h3>
                        <canvas id="distribution-chart"></canvas>
                    </div>
                </div>
                <div class="chart-row">
                    <div class="chart-card">
                        <h3>Top Pages</h3>
                        <canvas id="pages-chart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h3>Device Breakdown</h3>
                        <canvas id="devices-chart"></canvas>
                    </div>
                </div>
            `;

            // Render charts using Chart.js if available, or simple SVG
            setTimeout(() => {
                this.renderActivityChart(chartData.activity || []);
                this.renderDistributionChart(chartData.distribution || []);
                this.renderPagesChart(chartData.pages || []);
                this.renderDevicesChart(chartData.devices || []);
            }, 100);
        }

        renderActivityChart(data) {
            const canvas = document.getElementById('activity-chart');
            if (!canvas) return;

            if (window.Chart) {
                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: data.map(d => this.formatDate(d.date)),
                        datasets: [{
                            label: 'Activity',
                            data: data.map(d => d.value),
                            borderColor: '#4ECDC4',
                            backgroundColor: 'rgba(78, 205, 196, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            } else {
                this.renderSimpleLineChart(canvas, data);
            }
        }

        renderDistributionChart(data) {
            const canvas = document.getElementById('distribution-chart');
            if (!canvas) return;

            if (window.Chart) {
                new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: data.map(d => d.label),
                        datasets: [{
                            data: data.map(d => d.value),
                            backgroundColor: [
                                '#FF6B6B', '#4ECDC4', '#45B7D1', 
                                '#FFA07A', '#98D8C8', '#F7DC6F'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } else {
                this.renderSimplePieChart(canvas, data);
            }
        }

        renderPagesChart(data) {
            const canvas = document.getElementById('pages-chart');
            if (!canvas) return;

            if (window.Chart) {
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: data.map(d => d.page),
                        datasets: [{
                            label: 'Views',
                            data: data.map(d => d.views),
                            backgroundColor: '#45B7D1'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            } else {
                this.renderSimpleBarChart(canvas, data);
            }
        }

        renderDevicesChart(data) {
            const canvas = document.getElementById('devices-chart');
            if (!canvas) return;

            if (window.Chart) {
                new Chart(canvas, {
                    type: 'pie',
                    data: {
                        labels: data.map(d => d.device),
                        datasets: [{
                            data: data.map(d => d.percentage),
                            backgroundColor: [
                                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } else {
                this.renderSimplePieChart(canvas, data);
            }
        }

        renderSimpleLineChart(canvas, data) {
            // Fallback simple SVG chart
            const ctx = canvas.getContext('2d');
            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;
            const padding = 40;
            const maxValue = Math.max(...data.map(d => d.value), 1);

            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#4ECDC4';
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((point, i) => {
                const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
                const y = height - padding - (point.value / maxValue) * (height - 2 * padding);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        }

        renderSimpleBarChart(canvas, data) {
            const ctx = canvas.getContext('2d');
            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;
            const padding = 40;
            const maxValue = Math.max(...data.map(d => d.views), 1);
            const barWidth = (width - 2 * padding) / data.length - 10;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#45B7D1';

            data.forEach((item, i) => {
                const barHeight = (item.views / maxValue) * (height - 2 * padding);
                const x = padding + i * (barWidth + 10);
                const y = height - padding - barHeight;
                ctx.fillRect(x, y, barWidth, barHeight);
            });
        }

        renderSimplePieChart(canvas, data) {
            const ctx = canvas.getContext('2d');
            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 20;

            const total = data.reduce((sum, d) => sum + (d.value || d.percentage), 0);
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

            let currentAngle = -Math.PI / 2;

            data.forEach((item, i) => {
                const value = item.value || item.percentage;
                const sliceAngle = (value / total) * 2 * Math.PI;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = colors[i % colors.length];
                ctx.fill();

                currentAngle += sliceAngle;
            });
        }

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        showError(message) {
            const errorEl = document.createElement('div');
            errorEl.className = 'analytics-error';
            errorEl.textContent = message;
            document.getElementById('analytics-dashboard')?.appendChild(errorEl);
            setTimeout(() => errorEl.remove(), 5000);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`dash_analytics_custom_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dashboardAnalytics = new DashboardAnalytics();
        });
    } else {
        window.dashboardAnalytics = new DashboardAnalytics();
    }
})();


