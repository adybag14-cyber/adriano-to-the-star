/**
 * API Response Field Selection
 * Select specific fields from API responses
 */

class APIResponseFieldSelection {
    constructor() {
        this.fieldConfigs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('field_selection_initialized');
    }

    createFieldConfig(configId, defaultFields = [], allowedFields = []) {
        this.fieldConfigs.set(configId, {
            id: configId,
            defaultFields,
            allowedFields,
            createdAt: new Date()
        });
        console.log(`Field config created: ${configId}`);
    }

    selectFields(data, fields, configId = null) {
        if (Array.isArray(data)) {
            return data.map(item => this.selectFieldsFromObject(item, fields, configId));
        }
        
        return this.selectFieldsFromObject(data, fields, configId);
    }

    selectFieldsFromObject(obj, fields, configId) {
        const config = configId ? this.fieldConfigs.get(configId) : null;
        
        // Validate allowed fields if config exists
        if (config && config.allowedFields.length > 0) {
            const invalidFields = fields.filter(f => !config.allowedFields.includes(f));
            if (invalidFields.length > 0) {
                throw new Error(`Fields not allowed: ${invalidFields.join(', ')}`);
            }
        }
        
        const selected = {};
        
        for (const field of fields) {
            if (field.includes('.')) {
                // Nested field
                this.setNestedField(selected, field, this.getNestedField(obj, field));
            } else {
                if (obj.hasOwnProperty(field)) {
                    selected[field] = obj[field];
                }
            }
        }
        
        return selected;
    }

    getNestedField(obj, path) {
        const parts = path.split('.');
        let value = obj;
        for (const part of parts) {
            value = value?.[part];
            if (value === undefined) {
                return undefined;
            }
        }
        return value;
    }

    setNestedField(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }

    parseFieldsQuery(queryString) {
        const params = new URLSearchParams(queryString);
        const fieldsParam = params.get('fields');
        
        if (!fieldsParam) {
            return null;
        }
        
        return fieldsParam.split(',').map(f => f.trim());
    }

    excludeFields(data, fields) {
        if (Array.isArray(data)) {
            return data.map(item => this.excludeFieldsFromObject(item, fields));
        }
        
        return this.excludeFieldsFromObject(data, fields);
    }

    excludeFieldsFromObject(obj, fields) {
        const result = { ...obj };
        
        for (const field of fields) {
            if (field.includes('.')) {
                // Handle nested field exclusion
                const parts = field.split('.');
                let current = result;
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];
                    if (!current) break;
                }
                if (current) {
                    delete current[parts[parts.length - 1]];
                }
            } else {
                delete result[field];
            }
        }
        
        return result;
    }

    getFieldConfig(configId) {
        return this.fieldConfigs.get(configId);
    }

    getAllFieldConfigs() {
        return Array.from(this.fieldConfigs.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`field_sel_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseFieldSelection = new APIResponseFieldSelection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseFieldSelection;
}

