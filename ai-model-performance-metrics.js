/**
 * AI Model Performance Metrics
 * Track performance, accuracy, and usage statistics for AI models
 */

class AIModelPerformanceMetrics {
    constructor() {
        this.metrics = {
            models: new Map(),
            requests: [],
            errors: [],
            responseTimes: [],
            tokenUsage: []
        };
        this.currentRequest = null;
        this.init();
    }

    init() {
        // Intercept AI API calls if possible
        this.setupInterceptors();
        
        // Track model selection
        this.trackModelSelection();
        
        this.trackEvent('performance_metrics_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ai_model_metrics_${eventName}`, 1, data);
            }
        } catch (e) {}
    }

    /**
     * Setup interceptors for AI calls
     */
    setupInterceptors() {
        // Hook into Stellar AI when available
        if (window.stellarAI) {
            const stellarAI = window.stellarAI;
            
            // Intercept getAIResponse method
            if (stellarAI.getAIResponse && typeof stellarAI.getAIResponse === 'function') {
                const originalGetAIResponse = stellarAI.getAIResponse.bind(stellarAI);
                
                stellarAI.getAIResponse = async function(chat) {
                    const model = stellarAI.selectedModel || 'unknown';
                    const prompt = chat.messages[chat.messages.length - 1]?.content || '';
                    const requestId = aiModelMetricsInstance.startRequest(model, prompt);
                    
                    try {
                        const startTime = Date.now();
                        const response = await originalGetAIResponse(chat);
                        const endTime = Date.now();
                        
                        // Complete tracking
                        aiModelMetricsInstance.completeRequest(requestId, response, null);
                        
                        // Update dashboard if visible
                        if (document.querySelector('.ai-metrics-dashboard')) {
                            aiModelMetricsInstance.refresh();
                        }
                        
                        return response;
                    } catch (error) {
                        aiModelMetricsInstance.completeRequest(requestId, null, error);
                        throw error;
                    }
                };
            }
        }
        
        // Also set up polling to check for Stellar AI
        setTimeout(() => {
            if (!window.stellarAI && document.getElementById('stellar-ai-container')) {
                this.setupInterceptors(); // Retry
            }
        }, 2000);
    }

    /**
     * Track model selection
     */
    trackModelSelection() {
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', (event) => {
                this.recordModelSelection(event.target.value);
            });
        }

        // Also listen for programmatic changes
        const observer = new MutationObserver(() => {
            const selector = document.getElementById('model-selector');
            if (selector) {
                this.recordModelSelection(selector.value);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Start tracking a request
     */
    startRequest(model, prompt, options = {}) {
        this.currentRequest = {
            id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            model,
            prompt: prompt.substring(0, 100), // Store first 100 chars
            promptLength: prompt.length,
            startTime: Date.now(),
            options,
            timestamp: new Date().toISOString()
        };
        return this.currentRequest.id;
    }

    /**
     * Complete tracking a request
     */
    completeRequest(requestId, response, error = null) {
        if (!this.currentRequest || this.currentRequest.id !== requestId) {
            console.warn('Request ID mismatch');
            return;
        }

        const request = this.currentRequest;
        const endTime = Date.now();
        const responseTime = endTime - request.startTime;

        const metric = {
            ...request,
            endTime,
            responseTime,
            success: !error,
            error: error ? error.message : null,
            responseLength: response ? response.length : 0,
            tokens: this.estimateTokens(request.promptLength, response ? response.length : 0)
        };

        // Update model statistics
        this.updateModelStats(request.model, metric);

        // Store request
        this.metrics.requests.push(metric);

        // Keep only last 1000 requests
        if (this.metrics.requests.length > 1000) {
            this.metrics.requests.shift();
        }

        // Track response time
        this.metrics.responseTimes.push({
            model: request.model,
            time: responseTime,
            timestamp: request.timestamp
        });

        // Track errors
        if (error) {
            this.metrics.errors.push({
                model: request.model,
                error: error.message,
                timestamp: request.timestamp
            });
        }

        this.currentRequest = null;
        return metric;
    }

    /**
     * Record model selection
     */
    recordModelSelection(model) {
        if (!this.metrics.models.has(model)) {
            this.metrics.models.set(model, {
                name: model,
                requests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalResponseTime: 0,
                averageResponseTime: 0,
                totalTokens: 0,
                firstUsed: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            });
        }

        const modelStats = this.metrics.models.get(model);
        modelStats.lastUsed = new Date().toISOString();
    }

    /**
     * Update model statistics
     */
    updateModelStats(model, metric) {
        if (!this.metrics.models.has(model)) {
            this.recordModelSelection(model);
        }

        const stats = this.metrics.models.get(model);
        stats.requests++;
        
        if (metric.success) {
            stats.successfulRequests++;
        } else {
            stats.failedRequests++;
        }

        stats.totalResponseTime += metric.responseTime;
        stats.averageResponseTime = stats.totalResponseTime / stats.requests;
        stats.totalTokens += metric.tokens;
    }

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(inputLength, outputLength) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil((inputLength + outputLength) / 4);
    }

    /**
     * Get model statistics
     */
    getModelStats(model) {
        return this.metrics.models.get(model) || null;
    }

    /**
     * Get all model statistics
     */
    getAllModelStats() {
        return Array.from(this.metrics.models.values());
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const models = this.getAllModelStats();
        const totalRequests = this.metrics.requests.length;
        const successfulRequests = this.metrics.requests.filter(r => r.success).length;
        const averageResponseTime = this.metrics.responseTimes.length > 0
            ? this.metrics.responseTimes.reduce((sum, r) => sum + r.time, 0) / this.metrics.responseTimes.length
            : 0;

        return {
            totalRequests,
            successfulRequests,
            failedRequests: totalRequests - successfulRequests,
            successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
            averageResponseTime: Math.round(averageResponseTime),
            models: models.map(m => ({
                name: m.name,
                requests: m.requests,
                successRate: m.requests > 0 ? (m.successfulRequests / m.requests) * 100 : 0,
                averageResponseTime: Math.round(m.averageResponseTime),
                totalTokens: m.totalTokens
            })),
            errors: this.metrics.errors.length
        };
    }

    /**
     * Display performance dashboard
     */
    displayDashboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        const summary = this.getPerformanceSummary();
        const models = summary.models.sort((a, b) => b.requests - a.requests);
        const recentRequests = this.metrics.requests.slice(-10).reverse();
        const responseTimeChart = this.generateResponseTimeChart();
        const modelUsageChart = this.generateModelUsageChart();

        const html = `
            <div class="ai-metrics-dashboard">
                <div class="metrics-header">
                    <h2>🤖 AI Model Performance Metrics</h2>
                    <div class="metrics-summary">
                        <div class="summary-card">
                            <div class="summary-value">${summary.totalRequests}</div>
                            <div class="summary-label">Total Requests</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-value" style="color: #44ff44;">${summary.successRate.toFixed(1)}%</div>
                            <div class="summary-label">Success Rate</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-value">${summary.averageResponseTime}ms</div>
                            <div class="summary-label">Avg Response Time</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-value">${this.formatNumber(this.getTotalTokens())}</div>
                            <div class="summary-label">Total Tokens</div>
                        </div>
                    </div>
                </div>

                <div class="charts-section">
                    <div class="chart-container">
                        <h3>Response Time Trend</h3>
                        <div class="chart-response-time">${responseTimeChart}</div>
                    </div>
                    <div class="chart-container">
                        <h3>Model Usage Distribution</h3>
                        <div class="chart-model-usage">${modelUsageChart}</div>
                    </div>
                </div>

                <div class="recent-requests-section">
                    <h3>Recent Requests</h3>
                    <div class="requests-list">
                        ${recentRequests.map(req => `
                            <div class="request-item ${req.success ? 'success' : 'error'}">
                                <div class="request-header">
                                    <span class="request-model">${this.escapeHtml(req.model)}</span>
                                    <span class="request-time">${new Date(req.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div class="request-prompt">${this.escapeHtml(req.prompt)}</div>
                                <div class="request-meta">
                                    <span>${req.responseTime}ms</span>
                                    <span>${this.formatNumber(req.tokens)} tokens</span>
                                    ${req.success ? '<span class="status-success">✓ Success</span>' : '<span class="status-error">✗ Failed</span>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="models-grid">
                    ${models.map(model => `
                        <div class="model-card">
                            <div class="model-header">
                                <h3>${this.escapeHtml(model.name)}</h3>
                                <div class="model-badge">${model.requests} requests</div>
                            </div>
                            <div class="model-stats">
                                <div class="stat-row">
                                    <span class="stat-label">Success Rate:</span>
                                    <span class="stat-value" style="color: ${model.successRate >= 90 ? '#44ff44' : model.successRate >= 70 ? '#ffd700' : '#ff4444'};">
                                        ${model.successRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Avg Response:</span>
                                    <span class="stat-value">${model.averageResponseTime}ms</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label">Total Tokens:</span>
                                    <span class="stat-value">${this.formatNumber(model.totalTokens)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${summary.errors > 0 ? `
                <div class="errors-section">
                    <h3>Recent Errors (${summary.errors})</h3>
                    <div class="errors-list">
                        ${this.metrics.errors.slice(-5).map(error => `
                            <div class="error-item">
                                <div class="error-model">${this.escapeHtml(error.model)}</div>
                                <div class="error-message">${this.escapeHtml(error.error)}</div>
                                <div class="error-time">${new Date(error.timestamp).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="dashboard-actions">
                    <button class="btn-refresh" onclick="window.aiModelMetrics().refresh()">
                        🔄 Refresh
                    </button>
                    <button class="btn-export" onclick="window.aiModelMetrics().exportMetrics()">
                        📥 Export JSON
                    </button>
                    <button class="btn-export" onclick="window.aiModelMetrics().exportMetricsCSV()">
                        📊 Export CSV
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.injectStyles();
    }

    /**
     * Refresh dashboard
     */
    refresh() {
        const container = document.querySelector('.ai-metrics-dashboard')?.parentElement;
        if (container) {
            this.displayDashboard(container.id);
        }
    }

    /**
     * Get total tokens across all models
     */
    getTotalTokens() {
        return Array.from(this.metrics.models.values())
            .reduce((sum, model) => sum + model.totalTokens, 0);
    }

    /**
     * Generate response time chart (simple bar chart)
     */
    generateResponseTimeChart() {
        const recentTimes = this.metrics.responseTimes.slice(-20);
        if (recentTimes.length === 0) {
            return '<div class="chart-empty">No data available</div>';
        }

        const maxTime = Math.max(...recentTimes.map(r => r.time));
        const chartBars = recentTimes.map((rt, index) => {
            const height = maxTime > 0 ? (rt.time / maxTime) * 100 : 0;
            return `
                <div class="chart-bar" style="height: ${height}%;" title="${rt.time}ms - ${rt.model}">
                    <div class="bar-value">${rt.time}ms</div>
                </div>
            `;
        }).join('');

        return `<div class="chart-bars">${chartBars}</div>`;
    }

    /**
     * Generate model usage chart (pie chart representation)
     */
    generateModelUsageChart() {
        const models = this.getAllModelStats();
        if (models.length === 0) {
            return '<div class="chart-empty">No data available</div>';
        }

        const total = models.reduce((sum, m) => sum + m.requests, 0);
        if (total === 0) {
            return '<div class="chart-empty">No requests yet</div>';
        }

        const chartItems = models.map(model => {
            const percentage = (model.requests / total) * 100;
            return `
                <div class="usage-item">
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <div class="usage-label">
                        <span class="usage-name">${this.escapeHtml(model.name)}</span>
                        <span class="usage-value">${model.requests} (${percentage.toFixed(1)}%)</span>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="usage-chart">${chartItems}</div>`;
    }

    /**
     * Export metrics
     */
    exportMetrics() {
        const data = {
            exported: new Date().toISOString(),
            summary: this.getPerformanceSummary(),
            models: this.getAllModelStats(),
            recentRequests: this.metrics.requests.slice(-100),
            errors: this.metrics.errors.slice(-50),
            totalTokens: this.getTotalTokens()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-metrics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export as CSV
     */
    exportMetricsCSV() {
        const headers = ['Timestamp', 'Model', 'Prompt', 'Response Time (ms)', 'Tokens', 'Success', 'Error'];
        const rows = this.metrics.requests.slice(-100).map(req => [
            req.timestamp,
            req.model,
            `"${req.prompt.replace(/"/g, '""')}"`,
            req.responseTime,
            req.tokens,
            req.success ? 'Yes' : 'No',
            req.error ? `"${req.error.replace(/"/g, '""')}"` : ''
        ]);

        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-metrics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Format number
     */
    formatNumber(num) {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('ai-metrics-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-metrics-styles';
        style.textContent = `
            .ai-metrics-dashboard {
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            .metrics-header {
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid rgba(186, 148, 79, 0.3);
            }

            .metrics-header h2 {
                color: #ba944f;
                font-family: 'Cormorant Garamond', serif;
                font-size: 2.5rem;
                margin-bottom: 1.5rem;
            }

            .metrics-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .summary-card {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9));
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                text-align: center;
            }

            .summary-value {
                font-size: 2rem;
                color: #ba944f;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }

            .summary-label {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
            }

            .models-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .model-card {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9));
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
            }

            .model-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.2);
            }

            .model-header h3 {
                color: #ba944f;
                margin: 0;
                font-size: 1.3rem;
            }

            .model-badge {
                background: rgba(186, 148, 79, 0.2);
                color: #ba944f;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
            }

            .model-stats {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .stat-label {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
            }

            .stat-value {
                color: #ba944f;
                font-weight: 600;
            }

            .errors-section {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9));
                border: 2px solid rgba(220, 53, 69, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }

            .errors-section h3 {
                color: #ff4444;
                margin-bottom: 1rem;
            }

            .errors-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .error-item {
                padding: 0.75rem;
                background: rgba(220, 53, 69, 0.1);
                border-left: 3px solid #ff4444;
                border-radius: 4px;
            }

            .error-model {
                font-weight: 600;
                color: #ff4444;
                margin-bottom: 0.25rem;
            }

            .error-message {
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 0.25rem;
            }

            .error-time {
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.5);
            }

            .dashboard-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }

            .btn-refresh,
            .btn-export {
                padding: 0.75rem 1.5rem;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.5);
                color: #ba944f;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            }

            .btn-refresh:hover,
            .btn-export:hover {
                background: rgba(186, 148, 79, 0.4);
                transform: translateY(-2px);
            }

            .charts-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .chart-container {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9));
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
            }

            .chart-container h3 {
                color: #ba944f;
                margin-bottom: 1rem;
                font-size: 1.2rem;
            }

            .chart-empty {
                color: rgba(255, 255, 255, 0.5);
                text-align: center;
                padding: 2rem;
            }

            .chart-bars {
                display: flex;
                align-items: flex-end;
                gap: 0.5rem;
                height: 200px;
                padding: 1rem 0;
            }

            .chart-bar {
                flex: 1;
                background: linear-gradient(to top, rgba(186, 148, 79, 0.6), rgba(186, 148, 79, 0.3));
                border-radius: 4px 4px 0 0;
                min-height: 20px;
                position: relative;
                transition: all 0.3s;
            }

            .chart-bar:hover {
                background: linear-gradient(to top, rgba(186, 148, 79, 0.8), rgba(186, 148, 79, 0.5));
                transform: scaleY(1.05);
            }

            .bar-value {
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.7rem;
                color: rgba(255, 255, 255, 0.6);
                white-space: nowrap;
            }

            .usage-chart {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .usage-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .usage-bar {
                height: 24px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                overflow: hidden;
                position: relative;
            }

            .usage-fill {
                height: 100%;
                background: linear-gradient(90deg, rgba(186, 148, 79, 0.6), rgba(186, 148, 79, 0.3));
                border-radius: 12px;
                transition: width 0.5s ease;
            }

            .usage-label {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
            }

            .usage-name {
                color: rgba(255, 255, 255, 0.8);
            }

            .usage-value {
                color: #ba944f;
                font-weight: 600;
            }

            .recent-requests-section {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9));
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }

            .recent-requests-section h3 {
                color: #ba944f;
                margin-bottom: 1rem;
            }

            .requests-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                max-height: 400px;
                overflow-y: auto;
            }

            .request-item {
                padding: 1rem;
                background: rgba(255, 255, 255, 0.05);
                border-left: 3px solid;
                border-radius: 4px;
                transition: all 0.3s;
            }

            .request-item.success {
                border-left-color: #44ff44;
            }

            .request-item.error {
                border-left-color: #ff4444;
            }

            .request-item:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateX(5px);
            }

            .request-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            .request-model {
                color: #ba944f;
                font-weight: 600;
                font-size: 0.9rem;
            }

            .request-time {
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.85rem;
            }

            .request-prompt {
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .request-meta {
                display: flex;
                gap: 1rem;
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.6);
            }

            .status-success {
                color: #44ff44;
            }

            .status-error {
                color: #ff4444;
            }

            @media (max-width: 768px) {
                .ai-metrics-dashboard {
                    padding: 1rem;
                }

                .models-grid {
                    grid-template-columns: 1fr;
                }

                .charts-section {
                    grid-template-columns: 1fr;
                }

                .chart-bars {
                    height: 150px;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let aiModelMetricsInstance = null;

function initAIModelMetrics() {
    if (!aiModelMetricsInstance) {
        aiModelMetricsInstance = new AIModelPerformanceMetrics();
    }
    return aiModelMetricsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIModelMetrics);
} else {
    initAIModelMetrics();
}

// Export globally
window.AIModelPerformanceMetrics = AIModelPerformanceMetrics;
window.aiModelMetrics = () => aiModelMetricsInstance;

