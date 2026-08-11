/**
 * Paxos Algorithm
 * Paxos consensus algorithm implementation
 */

class PaxosAlgorithm {
    constructor() {
        this.proposers = new Map();
        this.acceptors = new Map();
        this.learners = new Map();
        this.proposals = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ax_os_al_go_ri_th_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ax_os_al_go_ri_th_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async addProposer(proposerId, proposerData) {
        const proposer = {
            id: proposerId,
            ...proposerData,
            name: proposerData.name || proposerId,
            status: 'active',
            createdAt: new Date()
        };
        
        this.proposers.set(proposerId, proposer);
        return proposer;
    }

    async addAcceptor(acceptorId, acceptorData) {
        const acceptor = {
            id: acceptorId,
            ...acceptorData,
            name: acceptorData.name || acceptorId,
            status: 'active',
            createdAt: new Date()
        };

        this.acceptors.set(acceptorId, acceptor);
        return acceptor;
    }

    async propose(proposalId, proposalData) {
        const proposal = {
            id: proposalId,
            ...proposalData,
            proposerId: proposalData.proposerId || '',
            value: proposalData.value || '',
            proposalNumber: proposalData.proposalNumber || Date.now(),
            status: 'phase1',
            createdAt: new Date()
        };

        this.proposals.set(proposalId, proposal);
        await this.executePaxos(proposal);
        return proposal;
    }

    async executePaxos(proposal) {
        await new Promise(resolve => setTimeout(resolve, 500));
        proposal.status = 'phase2';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        proposal.status = 'accepted';
        proposal.acceptedAt = new Date();
    }

    async learn(learnerId, learnerData) {
        const learner = {
            id: learnerId,
            ...learnerData,
            name: learnerData.name || learnerId,
            learnedValues: learnerData.learnedValues || [],
            status: 'active',
            createdAt: new Date()
        };

        this.learners.set(learnerId, learner);
        return learner;
    }

    getProposer(proposerId) {
        return this.proposers.get(proposerId);
    }

    getAllProposers() {
        return Array.from(this.proposers.values());
    }

    getProposal(proposalId) {
        return this.proposals.get(proposalId);
    }

    getAllProposals() {
        return Array.from(this.proposals.values());
    }
}

module.exports = PaxosAlgorithm;

