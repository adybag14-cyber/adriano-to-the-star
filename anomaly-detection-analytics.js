/**
 * Anomaly Detection Analytics
 * Anomaly detection and analysis
 */

class AnomalyDetectionAnalytics {
    constructor() {
        this.datasets = new Map();
        this.detectors = new Map();
        this.anomalies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('analytics_initialized');
    }

    createDataset(datasetId, datasetData) {
        const dataset = {
            id: datasetId,
            ...datasetData,
            name: datasetData.name || datasetId,
            data: datasetData.data || [],
            createdAt: new Date()
        };
        
        this.datasets.set(datasetId, dataset);
        this.trackEvent('dataset_created', { datasetId });
        return dataset;
    }

    createDetector(detectorId, detectorData) {
        const detector = {
            id: detectorId,
            ...detectorData,
            name: detectorData.name || detectorId,
            algorithm: detectorData.algorithm || 'isolation_forest',
            threshold: detectorData.threshold || 0.5,
            createdAt: new Date()
        };
        
        this.detectors.set(detectorId, detector);
        console.log(`Anomaly detector created: ${detectorId}`);
        return detector;
    }

    async detect(datasetId, detectorId) {
        const dataset = this.datasets.get(datasetId);
        const detector = this.detectors.get(detectorId);
        
        if (!dataset || !detector) {
            throw new Error('Dataset or detector not found');
        }
        
        const anomalies = [];
        
        for (let i = 0; i < dataset.data.length; i++) {
            const score = this.calculateAnomalyScore(dataset.data[i], detector);
            
            if (score > detector.threshold) {
                const anomaly = {
                    id: `anomaly_${Date.now()}_${i}`,
                    datasetId,
                    detectorId,
                    index: i,
                    value: dataset.data[i],
                    score: score,
                    timestamp: new Date(),
                    createdAt: new Date()
                };
                
                this.anomalies.set(anomaly.id, anomaly);
                anomalies.push(anomaly);
            }
        }
        
        return {
            detectorId,
            datasetId,
            totalAnomalies: anomalies.length,
            anomalyRate: (anomalies.length / dataset.data.length * 100).toFixed(2) + '%',
            anomalies: anomalies.map(a => a.id)
        };
    }

    calculateAnomalyScore(value, detector) {
        if (detector.algorithm === 'isolation_forest') {
            return Math.random();
        } else if (detector.algorithm === 'statistical') {
            return Math.abs(value - 50) / 50;
        }
        return Math.random();
    }

    getAnomaly(anomalyId) {
        return this.anomalies.get(anomalyId);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`anomaly_analytics_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'anomaly_detection_analytics', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.anomalyDetectionAnalytics = new AnomalyDetectionAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnomalyDetectionAnalytics;
}
