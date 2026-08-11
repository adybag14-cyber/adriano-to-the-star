/**
 * Wallet Connect
 * WalletConnect protocol integration
 */

class WalletConnect {
    constructor() {
        this.sessions = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_al_le_tc_on_ne_ct_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_al_le_tc_on_ne_ct_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createSession(sessionData) {
        const session = {
            id: `session_${Date.now()}`,
            ...sessionData,
            peerId: sessionData.peerId || this.generatePeerId(),
            topic: this.generateTopic(),
            status: 'pending',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.sessions.set(session.id, session);
        
        return session;
    }

    async approveSession(sessionId, accounts) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        session.status = 'approved';
        session.accounts = accounts;
        session.approvedAt = new Date();
        
        return session;
    }

    async rejectSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        session.status = 'rejected';
        session.rejectedAt = new Date();
        
        return session;
    }

    async sendRequest(sessionId, requestData) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (session.status !== 'approved') {
            throw new Error('Session is not approved');
        }
        
        const request = {
            id: `request_${Date.now()}`,
            sessionId,
            ...requestData,
            method: requestData.method || 'eth_sendTransaction',
            params: requestData.params || [],
            status: 'pending',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.requests.set(request.id, request);
        
        return request;
    }

    async approveRequest(requestId, result) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        request.status = 'approved';
        request.result = result;
        request.approvedAt = new Date();
        
        return request;
    }

    generatePeerId() {
        return Math.random().toString(36).substring(2, 15);
    }

    generateTopic() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    getRequest(requestId) {
        return this.requests.get(requestId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.walletConnect = new WalletConnect();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletConnect;
}


