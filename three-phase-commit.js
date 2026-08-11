/**
 * Three-Phase Commit
 * Three-phase commit protocol implementation
 */

class ThreePhaseCommit {
    constructor() {
        this.transactions = new Map();
        this.coordinators = new Map();
        this.participants = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_hr_ee_ph_as_ec_om_mi_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_hr_ee_ph_as_ec_om_mi_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createCoordinator(coordinatorId, coordinatorData) {
        const coordinator = {
            id: coordinatorId,
            ...coordinatorData,
            name: coordinatorData.name || coordinatorId,
            transactions: [],
            createdAt: new Date()
        };
        
        this.coordinators.set(coordinatorId, coordinator);
        console.log(`Coordinator created: ${coordinatorId}`);
        return coordinator;
    }

    registerParticipant(participantId, participantData) {
        const participant = {
            id: participantId,
            ...participantData,
            name: participantData.name || participantId,
            status: 'ready',
            createdAt: new Date()
        };
        
        this.participants.set(participantId, participant);
        console.log(`Participant registered: ${participantId}`);
        return participant;
    }

    async beginTransaction(coordinatorId, transactionId, participantIds) {
        const coordinator = this.coordinators.get(coordinatorId);
        if (!coordinator) {
            throw new Error('Coordinator not found');
        }
        
        const transaction = {
            id: transactionId,
            coordinatorId,
            participants: participantIds,
            phase: 'canCommit',
            status: 'active',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.transactions.set(transactionId, transaction);
        coordinator.transactions.push(transactionId);
        
        const canCommitResults = await this.canCommitPhase(transaction);
        
        if (canCommitResults.every(r => r.response === 'yes')) {
            transaction.phase = 'preCommit';
            const preCommitResults = await this.preCommitPhase(transaction);
            
            if (preCommitResults.every(r => r.ack === 'yes')) {
                transaction.phase = 'doCommit';
                await this.doCommitPhase(transaction);
                transaction.status = 'committed';
            } else {
                transaction.phase = 'abort';
                await this.abortPhase(transaction);
                transaction.status = 'aborted';
            }
        } else {
            transaction.phase = 'abort';
            await this.abortPhase(transaction);
            transaction.status = 'aborted';
        }
        
        return transaction;
    }

    async canCommitPhase(transaction) {
        const results = [];
        
        for (const participantId of transaction.participants) {
            const participant = this.participants.get(participantId);
            if (participant) {
                participant.status = 'canCommit';
                results.push({ participantId, response: 'yes' });
            }
        }
        
        return results;
    }

    async preCommitPhase(transaction) {
        const results = [];
        
        for (const participantId of transaction.participants) {
            const participant = this.participants.get(participantId);
            if (participant) {
                participant.status = 'preCommit';
                results.push({ participantId, ack: 'yes' });
            }
        }
        
        return results;
    }

    async doCommitPhase(transaction) {
        for (const participantId of transaction.participants) {
            const participant = this.participants.get(participantId);
            if (participant) {
                participant.status = 'committed';
            }
        }
    }

    async abortPhase(transaction) {
        for (const participantId of transaction.participants) {
            const participant = this.participants.get(participantId);
            if (participant) {
                participant.status = 'aborted';
            }
        }
    }

    getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.threePhaseCommit = new ThreePhaseCommit();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThreePhaseCommit;
}

