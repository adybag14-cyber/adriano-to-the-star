/**
 * IoT Consent Management
 * Consent management for IoT devices
 */

class IoTConsentManagement {
    constructor() {
        this.consents = new Map();
        this.users = new Map();
        this.preferences = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_co_ns_en_tm_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_co_ns_en_tm_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createConsent(consentId, consentData) {
        const consent = {
            id: consentId,
            ...consentData,
            userId: consentData.userId || '',
            deviceId: consentData.deviceId || '',
            purpose: consentData.purpose || 'data_collection',
            granted: consentData.granted || false,
            status: 'active',
            createdAt: new Date()
        };
        
        this.consents.set(consentId, consent);
        return consent;
    }

    async checkConsent(userId, deviceId, purpose) {
        const consent = Array.from(this.consents.values())
            .find(c => c.userId === userId && c.deviceId === deviceId && c.purpose === purpose);

        return {
            userId,
            deviceId,
            purpose,
            granted: consent ? consent.granted : false,
            timestamp: new Date()
        };
    }

    getConsent(consentId) {
        return this.consents.get(consentId);
    }

    getAllConsents() {
        return Array.from(this.consents.values());
    }
}

module.exports = IoTConsentManagement;

