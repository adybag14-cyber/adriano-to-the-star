/**
 * Escrow System
 * Escrow service for secure transactions
 */

class EscrowSystem {
    constructor() {
        this.escrows = new Map();
        this.transactions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('e_sc_ro_ws_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_sc_ro_ws_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createEscrow(escrowId, escrowData) {
        const escrow = {
            id: escrowId,
            ...escrowData,
            buyer: escrowData.buyer,
            seller: escrowData.seller,
            amount: escrowData.amount || 0,
            currency: escrowData.currency || 'ETH',
            status: 'pending',
            createdAt: new Date()
        };
        
        this.escrows.set(escrowId, escrow);
        console.log(`Escrow created: ${escrowId}`);
        return escrow;
    }

    async fund(escrowId, amount) {
        const escrow = this.escrows.get(escrowId);
        if (!escrow) {
            throw new Error('Escrow not found');
        }
        
        if (escrow.status !== 'pending') {
            throw new Error('Escrow is not in pending status');
        }
        
        escrow.fundedAmount = (escrow.fundedAmount || 0) + amount;
        
        if (escrow.fundedAmount >= escrow.amount) {
            escrow.status = 'funded';
            escrow.fundedAt = new Date();
        }
        
        return escrow;
    }

    async release(escrowId, releasedBy) {
        const escrow = this.escrows.get(escrowId);
        if (!escrow) {
            throw new Error('Escrow not found');
        }
        
        if (escrow.status !== 'funded') {
            throw new Error('Escrow is not funded');
        }
        
        if (releasedBy !== escrow.buyer && releasedBy !== escrow.seller) {
            throw new Error('Unauthorized release');
        }
        
        escrow.status = 'released';
        escrow.releasedBy = releasedBy;
        escrow.releasedAt = new Date();
        
        return escrow;
    }

    async dispute(escrowId, disputer, reason) {
        const escrow = this.escrows.get(escrowId);
        if (!escrow) {
            throw new Error('Escrow not found');
        }
        
        if (escrow.status !== 'funded') {
            throw new Error('Escrow is not funded');
        }
        
        escrow.status = 'disputed';
        escrow.disputer = disputer;
        escrow.disputeReason = reason;
        escrow.disputedAt = new Date();
        
        return escrow;
    }

    async resolve(escrowId, resolution, winner) {
        const escrow = this.escrows.get(escrowId);
        if (!escrow) {
            throw new Error('Escrow not found');
        }
        
        if (escrow.status !== 'disputed') {
            throw new Error('Escrow is not in dispute');
        }
        
        escrow.status = 'resolved';
        escrow.resolution = resolution;
        escrow.winner = winner;
        escrow.resolvedAt = new Date();
        
        return escrow;
    }

    getEscrow(escrowId) {
        return this.escrows.get(escrowId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.escrowSystem = new EscrowSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EscrowSystem;
}


