/**
 * Trend Analysis
 * Trend identification and analysis
 */

class TrendAnalysis {
    constructor() {
        this.series = new Map();
        this.trends = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_re_nd_an_al_ys_is_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_re_nd_an_al_ys_is_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createSeries(seriesId, seriesData) {
        const series = {
            id: seriesId,
            ...seriesData,
            name: seriesData.name || seriesId,
            data: seriesData.data || [],
            timestamps: seriesData.timestamps || [],
            createdAt: new Date()
        };
        
        this.series.set(seriesId, series);
        console.log(`Time series created: ${seriesId}`);
        return series;
    }

    async analyze(seriesId) {
        const series = this.series.get(seriesId);
        if (!series) {
            throw new Error('Time series not found');
        }
        
        const trend = {
            id: `trend_${Date.now()}`,
            seriesId,
            status: 'analyzing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.trends.set(trend.id, trend);
        
        const analysis = this.identifyTrend(series);
        
        trend.status = 'completed';
        trend.completedAt = new Date();
        trend.direction = analysis.direction;
        trend.strength = analysis.strength;
        trend.slope = analysis.slope;
        trend.forecast = analysis.forecast;
        
        return trend;
    }

    identifyTrend(series) {
        if (series.data.length < 2) {
            return {
                direction: 'insufficient_data',
                strength: 0,
                slope: 0,
                forecast: null
            };
        }
        
        const first = series.data[0];
        const last = series.data[series.data.length - 1];
        const change = last - first;
        const changePercent = (change / first) * 100;
        
        let direction = 'stable';
        if (changePercent > 5) {
            direction = 'increasing';
        } else if (changePercent < -5) {
            direction = 'decreasing';
        }
        
        const strength = Math.min(Math.abs(changePercent) / 10, 1);
        const slope = change / series.data.length;
        
        const forecast = last + slope * 5;
        
        return {
            direction,
            strength: strength.toFixed(2),
            slope: slope.toFixed(2),
            forecast: forecast.toFixed(2)
        };
    }

    getSeries(seriesId) {
        return this.series.get(seriesId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.trendAnalysis = new TrendAnalysis();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrendAnalysis;
}
