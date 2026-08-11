/**
 * Certificate Management
 * SSL/TLS certificate lifecycle management
 */

class CertificateManagement {
    constructor() {
        this.certificates = new Map();
        this.requests = new Map();
        this.revocations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cert_mgmt_initialized');
    }

    requestCertificate(requestId, requestData) {
        const request = {
            id: requestId,
            ...requestData,
            domain: requestData.domain || '',
            organization: requestData.organization || '',
            validity: requestData.validity || 365,
            status: 'pending',
            requestedAt: new Date(),
            createdAt: new Date()
        };
        
        this.requests.set(requestId, request);
        console.log(`Certificate request created: ${requestId}`);
        return request;
    }

    issueCertificate(requestId) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        const certificate = {
            id: `cert_${Date.now()}`,
            requestId,
            domain: request.domain,
            serialNumber: this.generateSerialNumber(),
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + request.validity * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date()
        };
        
        this.certificates.set(certificate.id, certificate);
        request.status = 'issued';
        request.certificateId = certificate.id;
        
        return certificate;
    }

    validateCertificate(certificateId) {
        const certificate = this.certificates.get(certificateId);
        if (!certificate) {
            return { valid: false, reason: 'Certificate not found' };
        }
        
        if (certificate.status !== 'active') {
            return { valid: false, reason: 'Certificate not active' };
        }
        
        if (new Date() > certificate.expiresAt) {
            return { valid: false, reason: 'Certificate expired' };
        }
        
        const daysUntilExpiry = (certificate.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        
        return {
            valid: true,
            certificate,
            daysUntilExpiry: Math.floor(daysUntilExpiry)
        };
    }

    revokeCertificate(certificateId, reason = '') {
        const certificate = this.certificates.get(certificateId);
        if (!certificate) {
            throw new Error('Certificate not found');
        }
        
        certificate.status = 'revoked';
        certificate.revokedAt = new Date();
        
        const revocation = {
            id: `revocation_${Date.now()}`,
            certificateId,
            reason,
            revokedAt: new Date(),
            createdAt: new Date()
        };
        
        this.revocations.set(revocation.id, revocation);
        
        return { certificate, revocation };
    }

    getExpiringCertificates(days = 30) {
        const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        
        return Array.from(this.certificates.values())
            .filter(cert => {
                return cert.status === 'active' && 
                       cert.expiresAt <= cutoff && 
                       cert.expiresAt > new Date();
            });
    }

    generateSerialNumber() {
        return Math.random().toString(36).substring(2, 15).toUpperCase() + 
               Date.now().toString(36).toUpperCase();
    }

    getCertificate(certificateId) {
        return this.certificates.get(certificateId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cert_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.certificateManagement = new CertificateManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificateManagement;
}

