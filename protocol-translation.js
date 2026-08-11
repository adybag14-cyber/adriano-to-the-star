/**
 * Protocol Translation
 * IoT protocol translation and conversion
 */

class ProtocolTranslation {
    constructor() {
        this.translators = new Map();
        this.translations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_to_co_lt_ra_ns_la_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_to_co_lt_ra_ns_la_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createTranslator(translatorId, translatorData) {
        const translator = {
            id: translatorId,
            ...translatorData,
            name: translatorData.name || translatorId,
            sourceProtocol: translatorData.sourceProtocol || 'mqtt',
            targetProtocol: translatorData.targetProtocol || 'http',
            rules: translatorData.rules || [],
            enabled: translatorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.translators.set(translatorId, translator);
        console.log(`Protocol translator created: ${translatorId}`);
        return translator;
    }

    async translate(translatorId, message) {
        const translator = this.translators.get(translatorId);
        if (!translator) {
            throw new Error('Translator not found');
        }
        
        if (!translator.enabled) {
            throw new Error('Translator is disabled');
        }
        
        const translation = {
            id: `translation_${Date.now()}`,
            translatorId,
            sourceMessage: message,
            targetMessage: this.convertMessage(message, translator),
            sourceProtocol: translator.sourceProtocol,
            targetProtocol: translator.targetProtocol,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.translations.set(translation.id, translation);
        
        return translation;
    }

    convertMessage(message, translator) {
        if (translator.sourceProtocol === 'mqtt' && translator.targetProtocol === 'http') {
            return {
                method: 'POST',
                url: '/api/data',
                body: message.payload || message
            };
        } else if (translator.sourceProtocol === 'http' && translator.targetProtocol === 'mqtt') {
            return {
                topic: message.topic || '/data',
                payload: message.body || message
            };
        }
        
        return message;
    }

    getTranslator(translatorId) {
        return this.translators.get(translatorId);
    }

    getTranslation(translationId) {
        return this.translations.get(translationId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.protocolTranslation = new ProtocolTranslation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProtocolTranslation;
}


