/**
 * Forecasting
 * Forecasts future values based on historical data
 */

class Forecasting {
    constructor() {
        this.forecasts = [];
        this.models = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_or_ec_as_ti_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_or_ec_as_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createForecast(metricName, historicalData, method = 'linear') {
        let forecast;

        switch (method) {
            case 'linear':
                forecast = this.linearForecast(historicalData);
                break;
            case 'exponential':
                forecast = this.exponentialForecast(historicalData);
                break;
            case 'moving_average':
                forecast = this.movingAverageForecast(historicalData);
                break;
            default:
                forecast = this.linearForecast(historicalData);
        }

        const forecastResult = {
            id: `forecast_${Date.now()}`,
            metricName,
            method,
            historicalData,
            forecast,
            createdAt: new Date()
        };

        this.forecasts.push(forecastResult);
        return forecastResult;
    }

    linearForecast(data, periods = 7) {
        const values = data.map(d => d.value);
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const predictions = [];
        for (let i = 0; i < periods; i++) {
            predictions.push({
                period: n + i,
                value: Math.round((slope * (n + i) + intercept) * 100) / 100
            });
        }

        return predictions;
    }

    exponentialForecast(data, periods = 7) {
        const alpha = 0.3; // Smoothing factor
        const values = data.map(d => d.value);
        let forecast = values[0];

        const predictions = [];
        for (let i = 0; i < periods; i++) {
            forecast = alpha * values[values.length - 1] + (1 - alpha) * forecast;
            predictions.push({
                period: values.length + i,
                value: Math.round(forecast * 100) / 100
            });
        }

        return predictions;
    }

    movingAverageForecast(data, periods = 7, window = 3) {
        const values = data.map(d => d.value);
        const lastWindow = values.slice(-window);
        const average = lastWindow.reduce((a, b) => a + b, 0) / window;

        const predictions = [];
        for (let i = 0; i < periods; i++) {
            predictions.push({
                period: values.length + i,
                value: Math.round(average * 100) / 100
            });
        }

        return predictions;
    }
}

// Auto-initialize
const forecasting = new Forecasting();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Forecasting;
}


