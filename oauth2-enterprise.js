/**
 * OAuth 2.0 Enterprise
 * Enterprise OAuth 2.0 implementation
 */

class OAuth2Enterprise {
    constructor() {
        this.clients = new Map();
        this.tokens = new Map();
        this.authorizations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('o_au_th2e_nt_er_pr_is_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("o_au_th2e_nt_er_pr_is_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerClient(clientId, clientData) {
        const client = {
            id: clientId,
            ...clientData,
            name: clientData.name || clientId,
            secret: clientData.secret || this.generateSecret(),
            redirectUris: clientData.redirectUris || [],
            scopes: clientData.scopes || [],
            grantTypes: clientData.grantTypes || ['authorization_code'],
            createdAt: new Date()
        };
        
        this.clients.set(clientId, client);
        console.log(`OAuth client registered: ${clientId}`);
        return client;
    }

    async authorize(clientId, userId, scopes) {
        const client = this.clients.get(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        const authorization = {
            id: `auth_${Date.now()}`,
            clientId,
            userId,
            scopes: scopes || client.scopes,
            code: this.generateCode(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            createdAt: new Date()
        };
        
        this.authorizations.set(authorization.id, authorization);
        
        return authorization;
    }

    async exchangeCode(code, clientId, clientSecret) {
        const authorization = Array.from(this.authorizations.values())
            .find(auth => auth.code === code && auth.clientId === clientId);
        
        if (!authorization) {
            throw new Error('Invalid authorization code');
        }
        
        const client = this.clients.get(clientId);
        if (!client || client.secret !== clientSecret) {
            throw new Error('Invalid client credentials');
        }
        
        if (new Date() > authorization.expiresAt) {
            throw new Error('Authorization code expired');
        }
        
        const token = {
            id: `token_${Date.now()}`,
            clientId,
            userId: authorization.userId,
            scopes: authorization.scopes,
            accessToken: this.generateToken(),
            refreshToken: this.generateToken(),
            expiresAt: new Date(Date.now() + 3600 * 1000),
            createdAt: new Date()
        };
        
        this.tokens.set(token.id, token);
        
        return token;
    }

    generateSecret() {
        return Array.from({ length: 32 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateCode() {
        return Array.from({ length: 32 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateToken() {
        return Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getClient(clientId) {
        return this.clients.get(clientId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.oauth2Enterprise = new OAuth2Enterprise();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OAuth2Enterprise;
}

