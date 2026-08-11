/**
 * Field Selection
 * API field selection and projection
 */

class FieldSelection {
    constructor() {
        this.selections = new Map();
        this.schemas = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ie_ld_se_le_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ie_ld_se_le_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerSchema(schemaId, schemaData) {
        const schema = {
            id: schemaId,
            ...schemaData,
            name: schemaData.name || schemaId,
            fields: schemaData.fields || [],
            createdAt: new Date()
        };
        
        this.schemas.set(schemaId, schema);
        console.log(`Schema registered: ${schemaId}`);
        return schema;
    }

    select(schemaId, fields) {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            throw new Error('Schema not found');
        }
        
        const selection = {
            id: `selection_${Date.now()}`,
            schemaId,
            fields: Array.isArray(fields) ? fields : [fields],
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.selections.set(selection.id, selection);
        
        const validFields = selection.fields.filter(field => 
            schema.fields.includes(field)
        );
        
        return {
            selection,
            validFields,
            invalidFields: selection.fields.filter(field => 
                !schema.fields.includes(field)
            )
        };
    }

    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.fieldSelection = new FieldSelection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldSelection;
}

