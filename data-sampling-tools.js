/**
 * Data Sampling Tools
 * Data sampling and subset generation tools
 */

class DataSamplingTools {
    constructor() {
        this.datasets = new Map();
        this.samples = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_sampling_tools_initialized');
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
        console.log(`Dataset created: ${datasetId}`);
        return dataset;
    }

    async sample(datasetId, samplingConfig) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        const sample = {
            id: `sample_${Date.now()}`,
            datasetId,
            method: samplingConfig.method || 'random',
            size: samplingConfig.size || 100,
            status: 'sampling',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.samples.set(sample.id, sample);
        
        let sampledData = [];
        
        if (samplingConfig.method === 'random') {
            sampledData = this.randomSample(dataset.data, samplingConfig.size);
        } else if (samplingConfig.method === 'stratified') {
            sampledData = this.stratifiedSample(dataset.data, samplingConfig);
        } else if (samplingConfig.method === 'systematic') {
            sampledData = this.systematicSample(dataset.data, samplingConfig.size);
        }
        
        sample.status = 'completed';
        sample.completedAt = new Date();
        sample.data = sampledData;
        sample.originalSize = dataset.data.length;
        sample.sampleSize = sampledData.length;
        
        return sample;
    }

    randomSample(data, size) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(size, data.length));
    }

    stratifiedSample(data, config) {
        const strata = config.strata || {};
        const sample = [];
        
        Object.keys(strata).forEach(stratum => {
            const stratumData = data.filter(item => item[stratum] === strata[stratum]);
            const stratumSample = this.randomSample(stratumData, config.sizePerStratum || 10);
            sample.push(...stratumSample);
        });
        
        return sample;
    }

    systematicSample(data, size) {
        const step = Math.floor(data.length / size);
        const sample = [];
        
        for (let i = 0; i < data.length && sample.length < size; i += step) {
            sample.push(data[i]);
        }
        
        return sample;
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_sampling_tools_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataSamplingTools = new DataSamplingTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSamplingTools;
}
