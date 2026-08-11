/**
 * Data Transformation Tools
 * Data transformation and conversion tools
 */

class DataTransformationTools {
    constructor() {
        this.datasets = new Map();
        this.transformations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_transform_tools_initialized');
    }

    createDataset(datasetId, datasetData) {
        const dataset = {
            id: datasetId,
            ...datasetData,
            name: datasetData.name || datasetId,
            data: datasetData.data || [],
            format: datasetData.format || 'json',
            createdAt: new Date()
        };
        
        this.datasets.set(datasetId, dataset);
        console.log(`Dataset created: ${datasetId}`);
        return dataset;
    }

    async transform(datasetId, transformationType, options = {}) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        const transformation = {
            id: `transformation_${Date.now()}`,
            datasetId,
            type: transformationType,
            status: 'transforming',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.transformations.set(transformation.id, transformation);
        
        let transformedData = dataset.data;
        
        if (transformationType === 'aggregate') {
            transformedData = this.aggregate(dataset.data, options);
        } else if (transformationType === 'pivot') {
            transformedData = this.pivot(dataset.data, options);
        } else if (transformationType === 'filter') {
            transformedData = this.filter(dataset.data, options);
        } else if (transformationType === 'map') {
            transformedData = this.map(dataset.data, options);
        }
        
        transformation.status = 'completed';
        transformation.completedAt = new Date();
        transformation.transformedData = transformedData;
        transformation.originalCount = dataset.data.length;
        transformation.transformedCount = transformedData.length;
        
        return transformation;
    }

    aggregate(data, options) {
        const groupBy = options.groupBy || 'id';
        const aggregates = options.aggregates || {};
        
        const grouped = {};
        data.forEach(item => {
            const key = item[groupBy];
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        
        return Object.keys(grouped).map(key => {
            const group = grouped[key];
            const result = { [groupBy]: key };
            
            Object.keys(aggregates).forEach(agg => {
                if (aggregates[agg] === 'sum') {
                    result[agg] = group.reduce((sum, item) => sum + (item[agg] || 0), 0);
                } else if (aggregates[agg] === 'avg') {
                    result[agg] = group.reduce((sum, item) => sum + (item[agg] || 0), 0) / group.length;
                } else if (aggregates[agg] === 'count') {
                    result[agg] = group.length;
                }
            });
            
            return result;
        });
    }

    pivot(data, options) {
        return data;
    }

    filter(data, options) {
        const condition = options.condition || (() => true);
        return data.filter(condition);
    }

    map(data, options) {
        const mapper = options.mapper || (item => item);
        return data.map(mapper);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_transform_tools_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataTransformationTools = new DataTransformationTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTransformationTools;
}
