/**
 * Data Aggregation Tools
 * Data aggregation and summarization tools
 */

class DataAggregationTools {
    constructor() {
        this.datasets = new Map();
        this.aggregations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_aggregation_initialized');
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

    async aggregate(datasetId, aggregationConfig) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        const aggregation = {
            id: `aggregation_${Date.now()}`,
            datasetId,
            config: aggregationConfig,
            status: 'aggregating',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.aggregations.set(aggregation.id, aggregation);
        
        const result = this.performAggregation(dataset.data, aggregationConfig);
        
        aggregation.status = 'completed';
        aggregation.completedAt = new Date();
        aggregation.result = result;
        
        return aggregation;
    }

    performAggregation(data, config) {
        const groupBy = config.groupBy || null;
        const functions = config.functions || ['sum', 'count', 'avg'];
        const fields = config.fields || [];
        
        if (!groupBy) {
            return this.aggregateAll(data, functions, fields);
        }
        
        return this.aggregateByGroup(data, groupBy, functions, fields);
    }

    aggregateAll(data, functions, fields) {
        const result = {};
        
        functions.forEach(func => {
            if (func === 'count') {
                result.count = data.length;
            } else if (func === 'sum' && fields.length > 0) {
                fields.forEach(field => {
                    result[`${field}_sum`] = data.reduce((sum, item) => sum + (item[field] || 0), 0);
                });
            } else if (func === 'avg' && fields.length > 0) {
                fields.forEach(field => {
                    result[`${field}_avg`] = data.reduce((sum, item) => sum + (item[field] || 0), 0) / data.length;
                });
            }
        });
        
        return result;
    }

    aggregateByGroup(data, groupBy, functions, fields) {
        const grouped = {};
        
        data.forEach(item => {
            const key = item[groupBy];
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        
        const result = {};
        
        Object.keys(grouped).forEach(key => {
            result[key] = this.aggregateAll(grouped[key], functions, fields);
        });
        
        return result;
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_aggregation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataAggregationTools = new DataAggregationTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAggregationTools;
}
