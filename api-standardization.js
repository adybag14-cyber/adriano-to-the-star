/**
 * API Standardization
 * API response standardization
 */

class APIStandardization {
    constructor() {
        this.standards = new Map();
        this.transformers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_standardization_initialized');
    }

    createStandard(standardId, standardData) {
        const standard = {
            id: standardId,
            ...standardData,
            name: standardData.name || standardId,
            format: standardData.format || 'json',
            schema: standardData.schema || {},
            createdAt: new Date()
        };
        
        this.standards.set(standardId, standard);
        console.log(`API standard created: ${standardId}`);
        return standard;
    }

    createTransformer(transformerId, transformerData) {
        const transformer = {
            id: transformerId,
            ...transformerData,
            name: transformerData.name || transformerId,
            sourceFormat: transformerData.sourceFormat || 'json',
            targetFormat: transformerData.targetFormat || 'json',
            rules: transformerData.rules || [],
            createdAt: new Date()
        };
        
        this.transformers.set(transformerId, transformer);
        console.log(`Transformer created: ${transformerId}`);
        return transformer;
    }

    standardize(standardId, data) {
        const standard = this.standards.get(standardId);
        if (!standard) {
            throw new Error('Standard not found');
        }
        
        return {
            format: standard.format,
            schema: standard.schema,
            data: this.applyStandard(data, standard)
        };
    }

    applyStandard(data, standard) {
        if (standard.format === 'json') {
            return JSON.parse(JSON.stringify(data));
        }
        return data;
    }

    getStandard(standardId) {
        return this.standards.get(standardId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_std_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiStandardization = new APIStandardization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIStandardization;
}

