/**
 * Data Transformation
 * Transforms data between formats
 */

class DataTransformation {
    constructor() {
        this.transformations = [];
        this.init();
    }

    init() {
        this.trackEvent('data_transformation_initialized');
    }

    addTransformation(name, transformFn) {
        this.transformations.push({ name, transformFn });
    }

    transform(data, transformationName) {
        const transformation = this.transformations.find(t => t.name === transformationName);
        if (!transformation) throw new Error('Transformation not found');
        return transformation.transformFn(data);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_transformation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dataTransformation = new DataTransformation();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTransformation;
}

