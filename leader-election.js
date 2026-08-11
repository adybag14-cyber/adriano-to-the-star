/**
 * Leader Election
 * Leader election algorithm
 */

class LeaderElection {
    constructor() {
        this.nodes = new Map();
        this.elections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ea_de_re_le_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ea_de_re_le_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            priority: nodeData.priority || 0,
            status: 'follower',
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        console.log(`Node registered: ${nodeId}`);
        return node;
    }

    async electLeader(electionId) {
        const nodes = Array.from(this.nodes.values());
        
        if (nodes.length === 0) {
            throw new Error('No nodes available');
        }
        
        const leader = nodes.reduce((prev, current) => {
            return (current.priority > prev.priority) ? current : prev;
        });
        
        nodes.forEach(node => {
            if (node.id === leader.id) {
                node.status = 'leader';
            } else {
                node.status = 'follower';
            }
        });
        
        const election = {
            id: electionId || `election_${Date.now()}`,
            leaderId: leader.id,
            participants: nodes.map(n => n.id),
            electedAt: new Date(),
            createdAt: new Date()
        };
        
        this.elections.set(election.id, election);
        
        return election;
    }

    getLeader() {
        return Array.from(this.nodes.values())
            .find(node => node.status === 'leader');
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getElection(electionId) {
        return this.elections.get(electionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.leaderElection = new LeaderElection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderElection;
}

