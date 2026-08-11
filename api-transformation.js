/**
 * API Transformation
 * API data transformation
 */

class APITransformation {
    constructor() {
        this.transformers = new Map();
        this.transformations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_transformation_initialized');
    }

    createTransformer(transformerId, transformerData) {
        const transformer = {
            id: transformerId,
            ...transformerData,
            name: transformerData.name || transformerId,
            rules: transformerData.rules || [],
            enabled: transformerData.enabled !== false,
            createdAt: new Date()
        };
        
        this.transformers.set(transformerId, transformer);
        console.log(`API transformer created: ${transformerId}`);
        return transformer;
    }

    async transform(transformerId, data) {
        const transformer = this.transformers.get(transformerId);
        if (!transformer) {
            throw new Error('Transformer not found');
        }
        
        const transformation = {
            id: `transformation_${Date.now()}`,
            transformerId,
            input: data,
            output: null,
            status: 'processing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.transformations.set(transformation.id, transformation);
        
        let result = data;
        
        for (const rule of transformer.rules) {
            result = this.applyRule(rule, result);
        }
        
        transformation.output = result;
        transformation.status = 'completed';
        transformation.completedAt = new Date();
        
        return transformation;
    }

    applyRule(rule, data) {
        if (rule.type === 'map') {
            return this.mapFields(rule, data);
        } else if (rule.type === 'filter') {
            return this.filterFields(rule, data);
        } else if (rule.type === 'aggregate') {
            return this.aggregate(rule, data);
        }
        return data;
    }

    mapFields(rule, data) {
        if (Array.isArray(data)) {
            return data.map(item => {
                const mapped = {};
                for (const [source, target] of Object.entries(rule.mapping)) {
                    mapped[target] = item[source];
                }
                return mapped;
            });
        }
        return data;
    }

    filterFields(rule, data) {
        if (Array.isArray(data)) {
            return data.map(item => {
                const filtered = {};
                for (const field of rule.fields) {
                    if (item.hasOwnProperty(field)) {
                        filtered[field] = item[field];
                    }
                }
                return filtered;
            });
        }
        return data;
    }

    aggregate(rule, data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { count: 0 };
        }
        
        return {
            count: data.length,
            sum: data.reduce((sum, item) => sum + (item[rule.field] || 0), 0)
        };
    }

    getTransformer(transformerId) {
        return this.transformers.get(transformerId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_transform_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiTransformation = new APITransformation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APITransformation;
}

