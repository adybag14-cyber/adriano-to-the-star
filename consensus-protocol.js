/**
 * Consensus Protocol
 * Consensus algorithm implementation
 */

class ConsensusProtocol {
    constructor() {
        this.nodes = new Map();
        this.proposals = new Map();
        this.init();
    }

    init() {
        this.trackEvent('consensus_proto_initialized');
    }

    registerNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            role: nodeData.role || 'follower',
            votes: 0,
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        console.log(`Node registered: ${nodeId}`);
        return node;
    }

    async propose(proposerId, proposalId, proposalData) {
        const proposer = this.nodes.get(proposerId);
        if (!proposer) {
            throw new Error('Proposer not found');
        }
        
        const proposal = {
            id: proposalId,
            proposerId,
            ...proposalData,
            value: proposalData.value || '',
            votes: 0,
            status: 'proposed',
            createdAt: new Date()
        };
        
        this.proposals.set(proposalId, proposal);
        
        const votes = await this.collectVotes(proposal);
        proposal.votes = votes.length;
        
        const majority = Math.floor(this.nodes.size / 2) + 1;
        
        if (votes.length >= majority) {
            proposal.status = 'accepted';
            proposal.acceptedAt = new Date();
        } else {
            proposal.status = 'rejected';
            proposal.rejectedAt = new Date();
        }
        
        return proposal;
    }

    async collectVotes(proposal) {
        const votes = [];
        
        for (const [nodeId, node] of this.nodes.entries()) {
            if (nodeId !== proposal.proposerId) {
                const vote = { nodeId, vote: 'yes' };
                votes.push(vote);
            }
        }
        
        return votes;
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getProposal(proposalId) {
        return this.proposals.get(proposalId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`consensus_proto_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.consensusProtocol = new ConsensusProtocol();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsensusProtocol;
}

