/**
 * Data Mapping
 * @class DataMapping
 * @description Handles data mapping and transformation between different data formats and structures.
 */
class DataMapping {
    constructor() {
        this.mappings = new Map();
        this.transformers = new Map();
        this.init();
    }

    init() {
        this.setupDefaultTransformers();
        this.trackEvent('data_mapping_initialized');
    }

    setupDefaultTransformers() {
        // String transformer
        this.transformers.set('string', (value) => String(value));

        // Number transformer
        this.transformers.set('number', (value) => Number(value));

        // Date transformer
        this.transformers.set('date', (value) => new Date(value));

        // Boolean transformer
        this.transformers.set('boolean', (value) => Boolean(value));
    }

    /**
     * Create a data mapping.
     * @param {string} mappingId - Unique mapping identifier.
     * @param {object} mappingConfig - Mapping configuration.
     */
    createMapping(mappingId, mappingConfig) {
        this.mappings.set(mappingId, {
            ...mappingConfig,
            createdAt: new Date()
        });
        console.log(`Data mapping created: ${mappingId}`);
    }

    /**
     * Apply a mapping to transform data.
     * @param {string} mappingId - Mapping identifier.
     * @param {object} sourceData - Source data to transform.
     * @returns {object} Transformed data.
     */
    applyMapping(mappingId, sourceData) {
        const mapping = this.mappings.get(mappingId);
        if (!mapping) {
            throw new Error(`Mapping not found: ${mappingId}`);
        }

        const result = {};
        for (const [targetField, sourceField] of Object.entries(mapping.fields || {})) {
            if (sourceData.hasOwnProperty(sourceField)) {
                const transformer = mapping.transformers?.[targetField];
                if (transformer && this.transformers.has(transformer)) {
                    result[targetField] = this.transformers.get(transformer)(sourceData[sourceField]);
                } else {
                    result[targetField] = sourceData[sourceField];
                }
            }
        }

        return result;
    }

    /**
     * Register a custom transformer.
     * @param {string} name - Transformer name.
     * @param {function} transformer - Transformer function.
     */
    registerTransformer(name, transformer) {
        this.transformers.set(name, transformer);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_mapping_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataMapping = new DataMapping();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataMapping;
}
