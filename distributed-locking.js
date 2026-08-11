/**
 * Distributed Locking
 * Distributed lock management
 */

class DistributedLocking {
    constructor() {
        this.locks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('dist_locking_initialized');
    }

    async acquire(lockKey, ttl = 60000) {
        const existingLock = this.locks.get(lockKey);
        
        if (existingLock && existingLock.expiresAt > Date.now()) {
            throw new Error('Lock already acquired');
        }
        
        const lock = {
            id: `lock_${Date.now()}`,
            key: lockKey,
            acquiredAt: new Date(),
            expiresAt: Date.now() + ttl,
            createdAt: new Date()
        };
        
        this.locks.set(lockKey, lock);
        
        return lock;
    }

    async release(lockKey) {
        const lock = this.locks.get(lockKey);
        if (!lock) {
            throw new Error('Lock not found');
        }
        
        if (lock.expiresAt <= Date.now()) {
            this.locks.delete(lockKey);
            throw new Error('Lock has expired');
        }
        
        this.locks.delete(lockKey);
        
        return { released: true, lockKey };
    }

    async renew(lockKey, ttl) {
        const lock = this.locks.get(lockKey);
        if (!lock) {
            throw new Error('Lock not found');
        }
        
        if (lock.expiresAt <= Date.now()) {
            this.locks.delete(lockKey);
            throw new Error('Lock has expired');
        }
        
        lock.expiresAt = Date.now() + ttl;
        
        return lock;
    }

    isLocked(lockKey) {
        const lock = this.locks.get(lockKey);
        return lock && lock.expiresAt > Date.now();
    }

    getLock(lockKey) {
        return this.locks.get(lockKey);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dist_locking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.distributedLocking = new DistributedLocking();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DistributedLocking;
}

