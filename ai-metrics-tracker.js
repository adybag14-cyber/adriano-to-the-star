/**
 * AI Model Performance Metrics Tracker
 * Tracks response times, accuracy, costs, and model usage
 */

class AIMetricsTracker {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            averageResponseTime: 0,
            modelUsage: {},
            errorRate: 0,
            requestsByDate: {},
            responseTimes: []
        };
        
        this.init();
    }

    init() {
        this.loadMetrics();
        this.setupInterceptors();
        this.trackEvent('metrics_tracker_initialized');
    }

    /**
     * Load metrics from localStorage
     */
    loadMetrics() {
        const saved = localStorage.getItem('ai-metrics');
        if (saved) {
            try {
                this.metrics = { ...this.metrics, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error loading AI metrics:', e);
            }
        }
    }

    /**
     * Save metrics to localStorage
     */
    saveMetrics() {
        try {
            localStorage.setItem('ai-metrics', JSON.stringify(this.metrics));
        } catch (e) {
            console.error('Error saving AI metrics:', e);
        }
    }

    /**
     * Setup interceptors for AI calls
     */
    setupInterceptors() {
        // Intercept Stellar AI calls if available
        if (window.StellarAI) {
            const originalGetAIResponse = window.StellarAI.prototype.getAIResponse;
            const self = this;
            
            window.StellarAI.prototype.getAIResponse = async function(...args) {
                const startTime = Date.now();
                const model = this.selectedModel || 'unknown';
                let success = false;
                let tokens = 0;
                let error = null;

                try {
                    const result = await originalGetAIResponse.apply(this, args);
                    success = true;
                    const responseTime = Date.now() - startTime;
                    
                    // Estimate tokens (rough: 1 token ≈ 4 characters)
                    if (result && result.content) {
                        tokens = Math.ceil(result.content.length / 4);
                    }

                    self.recordRequest({
                        model,
                        responseTime,
                        tokens,
                        success: true,
                        timestamp: new Date().toISOString()
                    });

                    return result;
                } catch (err) {
                    error = err;
                    const responseTime = Date.now() - startTime;
                    
                    self.recordRequest({
                        model,
                        responseTime,
                        tokens: 0,
                        success: false,
                        error: err.message,
                        timestamp: new Date().toISOString()
                    });

                    throw err;
                }
            };
        }
    }

    /**
     * Record an AI request
     */
    recordRequest(data) {
        const { model, responseTime, tokens, success, error } = data;
        
        // Update totals
        this.metrics.totalRequests++;
        this.metrics.totalTokens += tokens;
        
        // Update response times
        this.metrics.responseTimes.push(responseTime);
        if (this.metrics.responseTimes.length > 1000) {
            this.metrics.responseTimes.shift(); // Keep last 1000
        }
        
        // Calculate average response time
        const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
        this.metrics.averageResponseTime = Math.round(sum / this.metrics.responseTimes.length);

        // Update model usage
        if (!this.metrics.modelUsage[model]) {
            this.metrics.modelUsage[model] = {
                requests: 0,
                tokens: 0,
                averageResponseTime: 0,
                errors: 0,
                responseTimes: []
            };
        }
        
        const modelStats = this.metrics.modelUsage[model];
        modelStats.requests++;
        modelStats.tokens += tokens;
        modelStats.responseTimes.push(responseTime);
        if (modelStats.responseTimes.length > 100) {
            modelStats.responseTimes.shift();
        }
        modelStats.averageResponseTime = Math.round(
            modelStats.responseTimes.reduce((a, b) => a + b, 0) / modelStats.responseTimes.length
        );
        
        if (!success) {
            modelStats.errors++;
        }

        // Update error rate
        const totalErrors = Object.values(this.metrics.modelUsage)
            .reduce((sum, stats) => sum + stats.errors, 0);
        this.metrics.errorRate = (totalErrors / this.metrics.totalRequests) * 100;

        // Update requests by date
        const date = new Date().toISOString().split('T')[0];
        if (!this.metrics.requestsByDate[date]) {
            this.metrics.requestsByDate[date] = 0;
        }
        this.metrics.requestsByDate[date]++;

        // Estimate cost (rough estimates based on model)
        const cost = this.estimateCost(model, tokens);
        this.metrics.totalCost += cost;

        this.saveMetrics();
        this.trackEvent('request_recorded', { model, tokens, success });
    }

    /**
     * Estimate cost based on model and tokens
     */
    estimateCost(model, tokens) {
        // Rough cost estimates per 1M tokens (in USD)
        const costs = {
            'gemini-2.5-flash-live': 0, // Free/unlimited
            'gemini-2.0-flash-exp': 0.075, // $0.075 per 1M input tokens
            'claude-3-5-sonnet': 3.00,
            'gpt-4': 30.00,
            'gpt-3.5-turbo': 0.50,
            'default': 1.00
        };

        const costPerMillion = costs[model] || costs.default;
        return (tokens / 1000000) * costPerMillion;
    }

    /**
     * Get metrics summary
     */
    getMetrics() {
        return {
            ...this.metrics,
            totalCostFormatted: `$${this.metrics.totalCost.toFixed(4)}`,
            averageResponseTimeFormatted: `${this.metrics.averageResponseTime}ms`,
            errorRateFormatted: `${this.metrics.errorRate.toFixed(2)}%`
        };
    }

    /**
     * Get model-specific metrics
     */
    getModelMetrics(model) {
        return this.metrics.modelUsage[model] || null;
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            averageResponseTime: 0,
            modelUsage: {},
            errorRate: 0,
            requestsByDate: {},
            responseTimes: []
        };
        this.saveMetrics();
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics() {
        const data = {
            ...this.metrics,
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }
}

// Initialize metrics tracker
let aiMetricsTrackerInstance = null;

function initAIMetricsTracker() {
    if (!aiMetricsTrackerInstance) {
        aiMetricsTrackerInstance = new AIMetricsTracker();
    }
    return aiMetricsTrackerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIMetricsTracker);
} else {
    initAIMetricsTracker();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIMetricsTracker;
}

// Make available globally
window.AIMetricsTracker = AIMetricsTracker;
window.aiMetricsTracker = () => aiMetricsTrackerInstance;

AIMetricsTracker.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`ai_metrics_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'ai_metrics_tracker', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

