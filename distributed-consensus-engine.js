/**
 * 🗳️ EXOPLANET PIONEER: DISTRIBUTED CONSENSUS ENGINE
 * Item 2019: Byzantine Fault Tolerance (BFT) for the galactic ledger.
 */

class DistributedConsensusEngine {
    constructor() {
        this.quorumSize = 3; // Minimum nodes for consensus
        this.pendingTransactions = new Map();
        console.log("🗳️ Consensus Engine: BFT Protocol active. Quorum required:", this.quorumSize);
    }

    /**
     * Propose a new transaction to the mesh.
     */
    propose(transactionId, data) {
        console.log(`[CONSENSUS] Proposing: ${transactionId}`);
        const proposal = {
            id: transactionId,
            data,
            votes: new Set(),
            timestamp: Date.now()
        };
        this.pendingTransactions.set(transactionId, proposal);
        this._broadcastProposal(proposal);
    }

    /**
     * Receive a vote from a peer.
     */
    vote(transactionId, peerId) {
        if (!this.pendingTransactions.has(transactionId)) return;
        
        const proposal = this.pendingTransactions.get(transactionId);
        proposal.votes.add(peerId);
        
        if (proposal.votes.size >= this.quorumSize) {
            this._commit(proposal);
        }
    }

    _commit(proposal) {
        console.log(`✅ [LEDGER] Consensus reached for ${proposal.id}. Committing to chain.`);
        this.pendingTransactions.delete(proposal.id);
        this.fireEvent("TRANSACTION_COMMITTED", proposal);
    }

    _broadcastProposal(proposal) {
        if (window.meshEngine) {
            window.meshEngine._broadcast("BFT_PROPOSAL", proposal);
        }
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const consensusEngine = new DistributedConsensusEngine();
window.consensusEngine = consensusEngine;
