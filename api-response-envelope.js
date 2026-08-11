/**
 * API Response Envelope
 * Standardize API response format
 */

class APIResponseEnvelope {
    constructor() {
        this.envelopeConfigs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('envelope_initialized');
    }

    createEnvelopeConfig(configId, options = {}) {
        const config = {
            id: configId,
            includeMetadata: options.includeMetadata !== false,
            includeTimestamp: options.includeTimestamp !== false,
            includeRequestId: options.includeRequestId !== false,
            successKey: options.successKey || 'success',
            dataKey: options.dataKey || 'data',
            errorKey: options.errorKey || 'error',
            metadataKey: options.metadataKey || 'metadata',
            createdAt: new Date()
        };
        
        this.envelopeConfigs.set(configId, config);
        console.log(`Envelope config created: ${configId}`);
        return config;
    }

    wrapSuccess(data, configId = 'default', metadata = {}) {
        const config = this.envelopeConfigs.get(configId) || this.getDefaultConfig();
        
        const envelope = {
            [config.successKey]: true,
            [config.dataKey]: data
        };
        
        if (config.includeMetadata) {
            envelope[config.metadataKey] = {
                ...metadata,
                ...(config.includeTimestamp && { timestamp: new Date().toISOString() }),
                ...(config.includeRequestId && metadata.requestId && { requestId: metadata.requestId })
            };
        }
        
        return envelope;
    }

    wrapError(error, configId = 'default', metadata = {}) {
        const config = this.envelopeConfigs.get(configId) || this.getDefaultConfig();
        
        const envelope = {
            [config.successKey]: false,
            [config.errorKey]: {
                message: error.message || 'An error occurred',
                code: error.code || 'UNKNOWN_ERROR',
                ...(error.details && { details: error.details })
            }
        };
        
        if (config.includeMetadata) {
            envelope[config.metadataKey] = {
                ...metadata,
                ...(config.includeTimestamp && { timestamp: new Date().toISOString() }),
                ...(config.includeRequestId && metadata.requestId && { requestId: metadata.requestId })
            };
        }
        
        return envelope;
    }

    unwrap(envelope, configId = 'default') {
        const config = this.envelopeConfigs.get(configId) || this.getDefaultConfig();
        
        if (envelope[config.successKey]) {
            return {
                success: true,
                data: envelope[config.dataKey],
                metadata: envelope[config.metadataKey]
            };
        } else {
            return {
                success: false,
                error: envelope[config.errorKey],
                metadata: envelope[config.metadataKey]
            };
        }
    }

    getDefaultConfig() {
        return {
            includeMetadata: true,
            includeTimestamp: true,
            includeRequestId: true,
            successKey: 'success',
            dataKey: 'data',
            errorKey: 'error',
            metadataKey: 'metadata'
        };
    }

    getEnvelopeConfig(configId) {
        return this.envelopeConfigs.get(configId);
    }

    getAllEnvelopeConfigs() {
        return Array.from(this.envelopeConfigs.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`envelope_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseEnvelope = new APIResponseEnvelope();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseEnvelope;
}

