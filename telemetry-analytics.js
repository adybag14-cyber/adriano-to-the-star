/**
 * Telemetry Analytics
 * Telemetry data analytics and insights
 */

class TelemetryAnalytics {
    constructor() {
        this.analyzers = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_el_em_et_ry_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_el_em_et_ry_an_al_yt_ic_s_" + eventName, 1, data);
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
        console.log(`Telemetry analyzer created: ${analyzerId}`);
        return analyzer;
    }

    async analyze(analyzerId, telemetryData) {
        const analyzer = this.analyzers.get(analyzerId);
        if (!analyzer) {
            throw new Error('Analyzer not found');
        }
        
        const analysis = {
            id: `analysis_${Date.now()}`,
            analyzerId,
            telemetryData,
            insights: this.generateInsights(telemetryData, analyzer),
            statistics: this.calculateStatistics(telemetryData),
            trends: this.detectTrends(telemetryData),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.analyses.set(analysis.id, analysis);
        
        return analysis;
    }

    generateInsights(telemetryData, analyzer) {
        return analyzer.metrics.map(metric => ({
            metric,
            value: Math.random() * 100,
            insight: `Telemetry insight for ${metric}`
        }));
    }

    calculateStatistics(telemetryData) {
        if (!Array.isArray(telemetryData) || telemetryData.length === 0) {
            return { count: 0, avg: 0, min: 0, max: 0 };
        }
        
        const values = telemetryData.map(d => d.value || 0);
        return {
            count: values.length,
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            stdDev: this.calculateStdDev(values)
        };
    }

    calculateStdDev(values) {
        if (values.length === 0) return 0;
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    detectTrends(telemetryData) {
        if (!Array.isArray(telemetryData) || telemetryData.length < 2) {
            return { trend: 'insufficient_data' };
        }
        
        const first = telemetryData[0]?.value || 0;
        const last = telemetryData[telemetryData.length - 1]?.value || 0;
        const change = last - first;
        const percentChange = first !== 0 ? (change / first) * 100 : 0;
        
        if (change > 0) return { trend: 'increasing', change, percentChange };
        if (change < 0) return { trend: 'decreasing', change, percentChange };
        return { trend: 'stable', change: 0, percentChange: 0 };
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
    window.telemetryAnalytics = new TelemetryAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelemetryAnalytics;
}

