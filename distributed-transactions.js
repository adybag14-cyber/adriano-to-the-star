/**
 * Distributed Transactions
 * Distributed transaction management
 */

class DistributedTransactions {
    constructor() {
        this.transactions = new Map();
        this.participants = new Map();
        this.init();
    }

    init() {
        this.trackEvent('dist_transactions_initialized');
    }

    beginTransaction(transactionId, transactionData) {
        const transaction = {
            id: transactionId,
            ...transactionData,
            participants: [],
            status: 'active',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.transactions.set(transactionId, transaction);
        console.log(`Transaction started: ${transactionId}`);
        return transaction;
    }

    addParticipant(transactionId, participantId, participantData) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        const participant = {
            id: participantId,
            transactionId,
            ...participantData,
            status: 'pending',
            createdAt: new Date()
        };
        
        this.participants.set(participantId, participant);
        transaction.participants.push(participantId);
        
        return participant;
    }

    async commit(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        transaction.status = 'committing';
        
        const participants = transaction.participants
            .map(id => this.participants.get(id))
            .filter(Boolean);
        
        try {
            for (const participant of participants) {
                participant.status = 'committed';
                participant.committedAt = new Date();
            }
            
            transaction.status = 'committed';
            transaction.committedAt = new Date();
            
            return transaction;
        } catch (error) {
            await this.rollback(transactionId);
            throw error;
        }
    }

    async rollback(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        transaction.status = 'rolling_back';
        
        const participants = transaction.participants
            .map(id => this.participants.get(id))
            .filter(Boolean);
        
        for (const participant of participants) {
            participant.status = 'rolled_back';
            participant.rolledBackAt = new Date();
        }
        
        transaction.status = 'rolled_back';
        transaction.rolledBackAt = new Date();
        
        return transaction;
    }

    getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dist_transactions_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.distributedTransactions = new DistributedTransactions();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DistributedTransactions;
}

