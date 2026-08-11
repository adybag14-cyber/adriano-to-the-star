/**
 * Intrusion Prevention System
 * IPS implementation
 */

class IPSSystem {
    constructor() {
        this.blocked = new Set();
        this.actions = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'IPS System initialized' };
    }

    blockSource(source, reason) {
        this.blocked.add(source);
        const action = {
            id: Date.now().toString(),
            source,
            action: 'blocked',
            reason,
            blockedAt: new Date()
        };
        this.actions.push(action);
        return action;
    }

    isBlocked(source) {
        return this.blocked.has(source);
    }

    unblockSource(source) {
        this.blocked.delete(source);
        return { unblocked: true, source };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IPSSystem;
}

