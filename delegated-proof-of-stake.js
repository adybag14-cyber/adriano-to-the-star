/**
 * Delegated Proof of Stake
 * DPoS consensus implementation
 */

class DelegatedProofOfStake {
    constructor() {
        this.delegates = new Map();
        this.voters = new Map();
        this.votes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_el_eg_at_ed_pr_oo_fo_fs_ta_ke_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_el_eg_at_ed_pr_oo_fo_fs_ta_ke_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async registerDelegate(delegateId, delegateData) {
        const delegate = {
            id: delegateId,
            ...delegateData,
            name: delegateData.name || delegateId,
            address: delegateData.address || this.generateAddress(),
            votes: 0,
            status: 'active',
            createdAt: new Date()
        };
        
        this.delegates.set(delegateId, delegate);
        return delegate;
    }

    async vote(voteId, voteData) {
        const vote = {
            id: voteId,
            ...voteData,
            voter: voteData.voter || '',
            delegateId: voteData.delegateId || '',
            amount: voteData.amount || 0,
            status: 'cast',
            createdAt: new Date()
        };

        const delegate = this.delegates.get(vote.delegateId);
        if (delegate) {
            delegate.votes += vote.amount;
        }

        this.votes.set(voteId, vote);
        return vote;
    }

    async addVoter(voterId, voterData) {
        const voter = {
            id: voterId,
            ...voterData,
            name: voterData.name || voterId,
            address: voterData.address || this.generateAddress(),
            stake: voterData.stake || 0,
            status: 'active',
            createdAt: new Date()
        };

        this.voters.set(voterId, voter);
        return voter;
    }

    async selectProducers() {
        const delegates = Array.from(this.delegates.values())
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 21);
        
        return delegates.map(d => ({ ...d, selected: true }));
    }

    generateAddress() {
        return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    getDelegate(delegateId) {
        return this.delegates.get(delegateId);
    }

    getAllDelegates() {
        return Array.from(this.delegates.values());
    }

    getVote(voteId) {
        return this.votes.get(voteId);
    }

    getAllVotes() {
        return Array.from(this.votes.values());
    }
}

module.exports = DelegatedProofOfStake;

