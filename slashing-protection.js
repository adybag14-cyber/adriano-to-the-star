/**
 * Slashing Protection
 * Validator slashing protection system
 */

class SlashingProtection {
    constructor() {
        this.protections = new Map();
        this.attestations = new Map();
        this.proposals = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_la_sh_in_gp_ro_te_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_la_sh_in_gp_ro_te_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createProtection(protectionId, protectionData) {
        const protection = {
            id: protectionId,
            ...protectionData,
            validatorId: protectionData.validatorId || '',
            minSourceEpoch: protectionData.minSourceEpoch || 0,
            minTargetEpoch: protectionData.minTargetEpoch || 0,
            status: 'active',
            createdAt: new Date()
        };
        
        this.protections.set(protectionId, protection);
        return protection;
    }

    async checkAttestation(attestationId, attestationData) {
        const attestation = {
            id: attestationId,
            ...attestationData,
            validatorId: attestationData.validatorId || '',
            sourceEpoch: attestationData.sourceEpoch || 0,
            targetEpoch: attestationData.targetEpoch || 0,
            status: 'pending',
            createdAt: new Date()
        };

        const protection = Array.from(this.protections.values())
            .find(p => p.validatorId === attestation.validatorId);

        if (protection) {
            if (attestation.sourceEpoch < protection.minSourceEpoch ||
                attestation.targetEpoch < protection.minTargetEpoch) {
                attestation.status = 'rejected';
                attestation.reason = 'slashing_protection';
            } else {
                attestation.status = 'approved';
                protection.minSourceEpoch = Math.max(protection.minSourceEpoch, attestation.sourceEpoch);
                protection.minTargetEpoch = Math.max(protection.minTargetEpoch, attestation.targetEpoch);
            }
        } else {
            attestation.status = 'approved';
        }

        this.attestations.set(attestationId, attestation);
        return attestation;
    }

    async checkProposal(proposalId, proposalData) {
        const proposal = {
            id: proposalId,
            ...proposalData,
            validatorId: proposalData.validatorId || '',
            slot: proposalData.slot || 0,
            status: 'pending',
            createdAt: new Date()
        };

        const existingProposal = Array.from(this.proposals.values())
            .find(p => p.validatorId === proposal.validatorId && p.slot === proposal.slot);

        if (existingProposal) {
            proposal.status = 'rejected';
            proposal.reason = 'double_proposal';
        } else {
            proposal.status = 'approved';
            this.proposals.set(proposalId, proposal);
        }

        return proposal;
    }

    getProtection(protectionId) {
        return this.protections.get(protectionId);
    }

    getAllProtections() {
        return Array.from(this.protections.values());
    }

    getAttestation(attestationId) {
        return this.attestations.get(attestationId);
    }

    getAllAttestations() {
        return Array.from(this.attestations.values());
    }
}

module.exports = SlashingProtection;

