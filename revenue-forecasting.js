/**
 * Revenue Forecasting
 * Predictive revenue forecasting and financial planning
 */

class RevenueForecasting {
    constructor() {
        this.forecasts = new Map();
        this.historicalData = [];
        this.models = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ev_en_ue_fo_re_ca_st_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ev_en_ue_fo_re_ca_st_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addHistoricalData(period, revenue, metrics = {}) {
        this.historicalData.push({
            period,
            revenue,
            ...metrics,
            recordedAt: new Date()
        });
        console.log(`Historical data added for period: ${period}`);
    }

    createForecast(forecastId, method, periods, options = {}) {
        const forecast = this.generateForecast(method, periods, options);
        
        this.forecasts.set(forecastId, {
            id: forecastId,
            method,
            periods,
            forecast,
            confidence: forecast.confidence || 0.8,
            createdAt: new Date()
        });
        
        console.log(`Forecast created: ${forecastId}`);
        return forecast;
    }

    generateForecast(method, periods, options) {
        if (this.historicalData.length < 2) {
            throw new Error('Insufficient historical data for forecasting');
        }
        
        switch (method) {
            case 'linear':
                return this.linearForecast(periods);
            case 'exponential':
                return this.exponentialForecast(periods);
            case 'moving_average':
                return this.movingAverageForecast(periods, options.window || 3);
            default:
                return this.linearForecast(periods);
        }
    }

    linearForecast(periods) {
        const data = this.historicalData.slice(-12); // Last 12 periods
        if (data.length < 2) {
            throw new Error('Need at least 2 data points');
        }
        
        const n = data.length;
        const sumX = data.reduce((sum, d, i) => sum + i, 0);
        const sumY = data.reduce((sum, d) => sum + d.revenue, 0);
        const sumXY = data.reduce((sum, d, i) => sum + i * d.revenue, 0);
        const sumX2 = data.reduce((sum, d, i) => sum + i * i, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            const x = n + i;
            const predicted = slope * x + intercept;
            predictions.push({
                period: `Period ${n + i + 1}`,
                revenue: Math.max(0, predicted),
                confidence: 0.8
            });
        }
        
        return {
            predictions,
            confidence: 0.8,
            method: 'linear'
        };
    }

    exponentialForecast(periods) {
        const data = this.historicalData.slice(-12);
        if (data.length < 2) {
            throw new Error('Need at least 2 data points');
        }
        
        const growthRate = this.calculateGrowthRate(data);
        const lastRevenue = data[data.length - 1].revenue;
        
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            const predicted = lastRevenue * Math.pow(1 + growthRate, i + 1);
            predictions.push({
                period: `Period ${data.length + i + 1}`,
                revenue: Math.max(0, predicted),
                confidence: 0.75
            });
        }
        
        return {
            predictions,
            confidence: 0.75,
            method: 'exponential'
        };
    }

    movingAverageForecast(periods, window) {
        const data = this.historicalData.slice(-window);
        const avg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
        
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            predictions.push({
                period: `Period ${this.historicalData.length + i + 1}`,
                revenue: avg,
                confidence: 0.7
            });
        }
        
        return {
            predictions,
            confidence: 0.7,
            method: 'moving_average'
        };
    }

    calculateGrowthRate(data) {
        if (data.length < 2) return 0;
        const first = data[0].revenue;
        const last = data[data.length - 1].revenue;
        return (last - first) / (first * data.length);
    }

    getForecast(forecastId) {
        return this.forecasts.get(forecastId);
    }

    getAllForecasts() {
        return Array.from(this.forecasts.values());
    }
}

if (typeof window !== 'undefined') {
    window.revenueForecasting = new RevenueForecasting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RevenueForecasting;
}

