/**
 * IoT Certificate Management
 * Certificate management for IoT devices
 */

class IoTCertificateManagement {
    constructor() {
        this.certificates = new Map();
        this.cas = new Map();
        this.revocations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_ce_rt_if_ic_at_em_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_ce_rt_if_ic_at_em_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async issueCertificate(certId, certData) {
        const certificate = {
            id: certId,
            ...certData,
            deviceId: certData.deviceId || '',
            serial: this.generateSerial(),
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date()
        };
        
        this.certificates.set(certId, certificate);
        return certificate;
    }

    generateSerial() {
        return '0x' + Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    async revoke(certId, reason) {
        const certificate = this.certificates.get(certId);
        if (!certificate) {
            throw new Error(`Certificate ${certId} not found`);
        }

        certificate.status = 'revoked';
        certificate.revokedAt = new Date();
        certificate.revocationReason = reason;

        const revocation = {
            id: `rev_${Date.now()}`,
            certId,
            reason,
            timestamp: new Date()
        };

        this.revocations.set(revocation.id, revocation);
        return revocation;
    }

    getCertificate(certId) {
        return this.certificates.get(certId);
    }

    getAllCertificates() {
        return Array.from(this.certificates.values());
    }
}

module.exports = IoTCertificateManagement;

