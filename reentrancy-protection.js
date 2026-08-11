/**
 * Reentrancy Protection
 * Reentrancy attack protection system
 */

class ReentrancyProtection {
    constructor() {
        this.protections = new Map();
        this.locks = new Map();
        this.checks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ee_nt_ra_nc_yp_ro_te_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ee_nt_ra_nc_yp_ro_te_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createProtection(protectionId, protectionData) {
        const protection = {
            id: protectionId,
            ...protectionData,
            contract: protectionData.contract || '',
            strategy: protectionData.strategy || 'checks_effects_interactions',
            status: 'active',
            createdAt: new Date()
        };
        
        this.protections.set(protectionId, protection);
        return protection;
    }

    async acquireLock(lockId, lockData) {
        const lock = {
            id: lockId,
            ...lockData,
            contract: lockData.contract || '',
            function: lockData.function || '',
            caller: lockData.caller || '',
            status: 'locked',
            createdAt: new Date()
        };

        const existingLock = Array.from(this.locks.values())
            .find(l => l.contract === lock.contract && l.function === lock.function && l.status === 'locked');

        if (existingLock) {
            lock.status = 'rejected';
            lock.reason = 'already_locked';
        } else {
            this.locks.set(lockId, lock);
        }

        return lock;
    }

    async releaseLock(lockId) {
        const lock = this.locks.get(lockId);
        if (!lock) {
            throw new Error(`Lock ${lockId} not found`);
        }

        lock.status = 'released';
        lock.releasedAt = new Date();
        return lock;
    }

    async checkReentrancy(checkId, checkData) {
        const check = {
            id: checkId,
            ...checkData,
            contract: checkData.contract || '',
            function: checkData.function || '',
            caller: checkData.caller || '',
            status: 'pending',
            createdAt: new Date()
        };

        const lock = Array.from(this.locks.values())
            .find(l => l.contract === check.contract && l.function === check.function && l.status === 'locked');

        if (lock && lock.caller === check.caller) {
            check.status = 'reentrancy_detected';
            check.reason = 'same_caller_during_lock';
        } else {
            check.status = 'safe';
        }

        this.checks.set(checkId, check);
        return check;
    }

    getProtection(protectionId) {
        return this.protections.get(protectionId);
    }

    getAllProtections() {
        return Array.from(this.protections.values());
    }

    getLock(lockId) {
        return this.locks.get(lockId);
    }

    getAllLocks() {
        return Array.from(this.locks.values());
    }
}

module.exports = ReentrancyProtection;

