/**
 * Security Token Management
 * Security token lifecycle management
 */

class SecurityTokenManagement {
    constructor() {
        this.tokens = new Map();
        this.issuers = new Map();
        this.revocations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_yt_ok_en_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_yt_ok_en_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerIssuer(issuerId, issuerData) {
        const issuer = {
            id: issuerId,
            ...issuerData,
            name: issuerData.name || issuerId,
            algorithm: issuerData.algorithm || 'HS256',
            secret: issuerData.secret || this.generateSecret(),
            enabled: issuerData.enabled !== false,
            createdAt: new Date()
        };
        
        this.issuers.set(issuerId, issuer);
        console.log(`Token issuer registered: ${issuerId}`);
        return issuer;
    }

    issueToken(issuerId, tokenData) {
        const issuer = this.issuers.get(issuerId);
        if (!issuer) {
            throw new Error('Issuer not found');
        }
        
        if (!issuer.enabled) {
            throw new Error('Issuer is disabled');
        }
        
        const token = {
            id: `token_${Date.now()}`,
            issuerId,
            ...tokenData,
            subject: tokenData.subject || '',
            audience: tokenData.audience || '',
            expiresAt: new Date(Date.now() + (tokenData.expiresIn || 3600000)),
            issuedAt: new Date(),
            token: this.generateToken(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.tokens.set(token.id, token);
        return token;
    }

    validateToken(tokenString) {
        const token = Array.from(this.tokens.values())
            .find(t => t.token === tokenString);
        
        if (!token) {
            return { valid: false, reason: 'Token not found' };
        }
        
        if (token.status !== 'active') {
            return { valid: false, reason: 'Token not active' };
        }
        
        if (new Date() > token.expiresAt) {
            return { valid: false, reason: 'Token expired' };
        }
        
        return { valid: true, token };
    }

    revokeToken(tokenId, reason = '') {
        const token = this.tokens.get(tokenId);
        if (!token) {
            throw new Error('Token not found');
        }
        
        token.status = 'revoked';
        token.revokedAt = new Date();
        
        const revocation = {
            id: `revocation_${Date.now()}`,
            tokenId,
            reason,
            revokedAt: new Date(),
            createdAt: new Date()
        };
        
        this.revocations.set(revocation.id, revocation);
        
        return { token, revocation };
    }

    generateToken() {
        return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }

    generateSecret() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    getToken(tokenId) {
        return this.tokens.get(tokenId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityTokenManagement = new SecurityTokenManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityTokenManagement;
}

