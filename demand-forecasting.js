/**
 * Demand Forecasting
 * Demand prediction and forecasting system
 */

class DemandForecasting {
    constructor() {
        this.models = new Map();
        this.forecasts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_em_an_df_or_ec_as_ti_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_em_an_df_or_ec_as_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            productCategory: modelData.productCategory || 'general',
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Demand forecasting model registered: ${modelId}`);
        return model;
    }

    async forecast(productId, historicalData, modelId = null, horizon = 30) {
        const model = modelId ? this.models.get(modelId) : Array.from(this.models.values())[0];
        if (!model) {
            throw new Error('Model not found');
        }
        
        const forecast = {
            id: `forecast_${Date.now()}`,
            productId,
            modelId: model.id,
            historicalData,
            predictions: this.generateDemandPredictions(historicalData, model, horizon),
            seasonality: this.detectSeasonality(historicalData),
            trend: this.calculateTrend(historicalData),
            horizon,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.forecasts.set(forecast.id, forecast);
        
        return forecast;
    }

    generateDemandPredictions(historicalData, model, horizon) {
        const avgDemand = historicalData.reduce((sum, d) => sum + (d.demand || 0), 0) / historicalData.length;
        const trend = this.calculateTrend(historicalData);
        
        return Array.from({ length: horizon }, (_, i) => ({
            day: i + 1,
            demand: Math.max(0, avgDemand + trend * (i + 1)),
            timestamp: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000)
        }));
    }

    detectSeasonality(historicalData) {
        return {
            detected: true,
            period: 7,
            strength: 0.6
        };
    }

    calculateTrend(historicalData) {
        if (historicalData.length < 2) return 0;
        const first = historicalData[0]?.demand || 0;
        const last = historicalData[historicalData.length - 1]?.demand || 0;
        return (last - first) / historicalData.length;
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
    window.demandForecasting = new DemandForecasting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemandForecasting;
}
