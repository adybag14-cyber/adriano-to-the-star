/**
 * API Response Transformation
 * Transform API responses to different formats
 */

class APIResponseTransformation {
    constructor() {
        this.transformers = new Map();
        this.transformRules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('transformation_initialized');
    }

    createTransformer(transformerId, transformFn) {
        this.transformers.set(transformerId, {
            id: transformerId,
            transformFn,
            createdAt: new Date()
        });
        console.log(`Transformer created: ${transformerId}`);
    }

    addTransformRule(ruleId, endpoint, transformerId, format) {
        this.transformRules.set(ruleId, {
            id: ruleId,
            endpoint,
            transformerId,
            format,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Transform rule added: ${ruleId}`);
    }

    transform(response, transformerId, options = {}) {
        const transformer = this.transformers.get(transformerId);
        if (!transformer) {
            throw new Error('Transformer does not exist');
        }
        
        try {
            const transformed = transformer.transformFn(response, options);
            console.log(`Response transformed using: ${transformerId}`);
            return transformed;
        } catch (error) {
            console.error(`Transformation failed: ${error.message}`);
            throw error;
        }
    }

    transformToFormat(response, format) {
        switch (format) {
            case 'json':
                return typeof response === 'string' ? JSON.parse(response) : response;
            case 'xml':
                return this.jsonToXml(response);
            case 'csv':
                return this.jsonToCsv(response);
            case 'yaml':
                return this.jsonToYaml(response);
            default:
                return response;
        }
    }

    jsonToXml(obj) {
        // Simple JSON to XML conversion
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
        xml += this.objectToXml(obj);
        xml += '</root>';
        return xml;
    }

    objectToXml(obj, indent = 1) {
        let xml = '';
        const spaces = '  '.repeat(indent);
        
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                obj[key].forEach(item => {
                    xml += `${spaces}<${key}>\n`;
                    xml += this.objectToXml(item, indent + 1);
                    xml += `${spaces}</${key}>\n`;
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                xml += `${spaces}<${key}>\n`;
                xml += this.objectToXml(obj[key], indent + 1);
                xml += `${spaces}</${key}>\n`;
            } else {
                xml += `${spaces}<${key}>${obj[key]}</${key}>\n`;
            }
        }
        
        return xml;
    }

    jsonToCsv(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }
        
        const headers = Object.keys(data[0]);
        const csv = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            });
            csv.push(values.join(','));
        });
        
        return csv.join('\n');
    }

    jsonToYaml(obj, indent = 0) {
        let yaml = '';
        const spaces = '  '.repeat(indent);
        
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                yaml += `${spaces}- ${item}\n`;
            });
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    yaml += `${spaces}${key}:\n`;
                    yaml += this.jsonToYaml(obj[key], indent + 1);
                } else {
                    yaml += `${spaces}${key}: ${obj[key]}\n`;
                }
            }
        } else {
            yaml += `${spaces}${obj}\n`;
        }
        
        return yaml;
    }

    getTransformer(transformerId) {
        return this.transformers.get(transformerId);
    }

    getTransformRule(ruleId) {
        return this.transformRules.get(ruleId);
    }

    getAllTransformers() {
        return Array.from(this.transformers.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`transformation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseTransformation = new APIResponseTransformation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseTransformation;
}

