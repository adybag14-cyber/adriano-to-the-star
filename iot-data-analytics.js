/**
 * IoT Data Analytics
 * IoT data analysis and insights
 */

class IoTDataAnalytics {
    constructor() {
        this.analyzers = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_da_ta_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_da_ta_an_al_yt_ic_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
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
        console.log(`Data analyzer created: ${analyzerId}`);
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
            statistics: this.calculateStatistics(data),
            trends: this.detectTrends(data),
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
            insight: `Insight for ${metric}`
        }));
    }

    calculateStatistics(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { count: 0, avg: 0, min: 0, max: 0 };
        }
        
        const values = data.map(d => d.value || 0);
        return {
            count: values.length,
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    detectTrends(data) {
        if (!Array.isArray(data) || data.length < 2) {
            return { trend: 'insufficient_data' };
        }
        
        const first = data[0]?.value || 0;
        const last = data[data.length - 1]?.value || 0;
        const change = last - first;
        
        if (change > 0) return { trend: 'increasing', change };
        if (change < 0) return { trend: 'decreasing', change };
        return { trend: 'stable', change: 0 };
    }

    getAnalyzer(analyzerId) {
        return this.analyzers.get(analyzerId);
    }

    getAnalysis(analysisId) {
        return this.analyses.get(analysisId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iotDataAnalytics = new IoTDataAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDataAnalytics;
}


