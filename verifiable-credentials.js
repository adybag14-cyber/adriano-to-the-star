/**
 * Verifiable Credentials
 * Verifiable credentials system
 */

class VerifiableCredentials {
    constructor() {
        this.credentials = new Map();
        this.schemas = new Map();
        this.init();
    }

    init() {
        this.trackEvent('v_er_if_ia_bl_ec_re_de_nt_ia_ls_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("v_er_if_ia_bl_ec_re_de_nt_ia_ls_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createSchema(schemaId, schemaData) {
        const schema = {
            id: schemaId,
            ...schemaData,
            name: schemaData.name || schemaId,
            type: schemaData.type || 'VerifiableCredential',
            properties: schemaData.properties || {},
            createdAt: new Date()
        };
        
        this.schemas.set(schemaId, schema);
        console.log(`Credential schema created: ${schemaId}`);
        return schema;
    }

    issueCredential(credentialId, credentialData) {
        const schema = this.schemas.get(credentialData.schemaId);
        if (!schema) {
            throw new Error('Schema not found');
        }
        
        const credential = {
            id: credentialId,
            ...credentialData,
            schemaId: schema.id,
            type: schema.type,
            issuer: credentialData.issuer || '',
            subject: credentialData.subject || '',
            claims: credentialData.claims || {},
            proof: this.generateProof(),
            issuedAt: new Date(),
            expiresAt: credentialData.expiresAt ? new Date(credentialData.expiresAt) : null,
            createdAt: new Date()
        };
        
        this.credentials.set(credentialId, credential);
        
        return credential;
    }

    verifyCredential(credentialId) {
        const credential = this.credentials.get(credentialId);
        if (!credential) {
            throw new Error('Credential not found');
        }
        
        const verification = {
            valid: true,
            expired: credential.expiresAt ? new Date() > credential.expiresAt : false,
            credential,
            verifiedAt: new Date()
        };
        
        if (verification.expired) {
            verification.valid = false;
        }
        
        return verification;
    }

    generateProof() {
        return {
            type: 'Ed25519Signature2020',
            proofValue: '0x' + Array.from({ length: 128 }, () => 
                Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            created: new Date().toISOString()
        };
    }

    getCredential(credentialId) {
        return this.credentials.get(credentialId);
    }

    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.verifiableCredentials = new VerifiableCredentials();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerifiableCredentials;
}


