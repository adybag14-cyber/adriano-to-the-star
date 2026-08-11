/**
 * Edge Analytics
 * Edge device analytics and insights
 */

class EdgeAnalytics {
    constructor() {
        this.analyzers = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_analytics_initialized');
    }

    createAnalyzer(analyzerId, analyzerData) {
        const analyzer = {
            id: analyzerId,
            ...analyzerData,
            name: analyzerData.name || analyzerId,
            metrics: analyzerData.metrics || [],
            enabled: analyzerData.enabled !== false,
            createdAt: new Date()
        };
        
        this.analyzers.set(analyzerId, analyzer);
        console.log(`Edge analyzer created: ${analyzerId}`);
        return analyzer;
    }

    async analyze(analyzerId, data) {
        const analyzer = this.analyzers.get(analyzerId);
        if (!analyzer) {
            throw new Error('Analyzer not found');
        }
        
        const analysis = {
            id: `analysis_${Date.now()}`,
            analyzerId,
            data,
            insights: this.generateInsights(data, analyzer),
            summary: this.generateSummary(data),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.analyses.set(analysis.id, analysis);
        
        return analysis;
    }

    generateInsights(data, analyzer) {
        return analyzer.metrics.map(metric => ({
            metric,
            value: Math.random() * 100,
            insight: `Edge insight for ${metric}`
        }));
    }

    generateSummary(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { count: 0, avg: 0 };
        }
        
        const values = data.map(d => d.value || 0);
        return {
            count: values.length,
            avg: values.reduce((sum, v) => sum + v, 0) / values.length
        };
    }

    getAnalyzer(analyzerId) {
        return this.analyzers.get(analyzerId);
    }

    getAnalysis(analysisId) {
        return this.analyses.get(analysisId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_analytics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.edgeAnalytics = new EdgeAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeAnalytics;
}


