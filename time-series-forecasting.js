/**
 * Time Series Forecasting
 * Time series prediction and forecasting
 */

class TimeSeriesForecasting {
    constructor() {
        this.models = new Map();
        this.forecasts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_im_es_er_ie_sf_or_ec_as_ti_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_im_es_er_ie_sf_or_ec_as_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            type: modelData.type || 'arima',
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Time series model registered: ${modelId}`);
        return model;
    }

    async forecast(seriesId, historicalData, modelId = null, horizon = 10) {
        const model = modelId ? this.models.get(modelId) : Array.from(this.models.values())[0];
        if (!model) {
            throw new Error('Model not found');
        }
        
        const forecast = {
            id: `forecast_${Date.now()}`,
            seriesId,
            modelId: model.id,
            historicalData,
            predictions: this.generatePredictions(historicalData, model, horizon),
            confidenceIntervals: this.calculateConfidenceIntervals(historicalData, horizon),
            horizon,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.forecasts.set(forecast.id, forecast);
        
        return forecast;
    }

    generatePredictions(historicalData, model, horizon) {
        const lastValue = historicalData[historicalData.length - 1]?.value || 0;
        const trend = this.calculateTrend(historicalData);
        
        return Array.from({ length: horizon }, (_, i) => ({
            step: i + 1,
            value: lastValue + trend * (i + 1),
            timestamp: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000)
        }));
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;
        const first = data[0]?.value || 0;
        const last = data[data.length - 1]?.value || 0;
        return (last - first) / data.length;
    }

    calculateConfidenceIntervals(historicalData, horizon) {
        const stdDev = this.calculateStdDev(historicalData);
        
        return Array.from({ length: horizon }, (_, i) => ({
            step: i + 1,
            lower: -stdDev * 1.96,
            upper: stdDev * 1.96
        }));
    }

    calculateStdDev(data) {
        if (data.length < 2) return 0;
        const values = data.map(d => d.value || 0);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    getForecast(forecastId) {
        return this.forecasts.get(forecastId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.timeSeriesForecasting = new TimeSeriesForecasting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeSeriesForecasting;
}
