/**
 * Web Locks API
 * Provides locking mechanism for coordinating access to resources
 */

class WebLocksAPI {
    constructor() {
        this.supported = false;
        this.initialized = false;
        this.activeLocks = new Map();
    }

    /**
     * Initialize Web Locks API
     */
    async initialize() {
        this.supported = this.isSupported();
        if (!this.supported) {
            throw new Error('Web Locks API is not supported in this browser');
        }
        this.initialized = true;
        return { success: true, message: 'Web Locks API initialized' };
    }

    /**
     * Check if Web Locks API is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof navigator !== 'undefined' && 'locks' in navigator;
    }

    /**
     * Request a lock
     * @param {string} name - Lock name
     * @param {Function} callback - Callback function
     * @param {Object} options - Lock options
     * @returns {Promise<any>}
     */
    async requestLock(name, callback, options = {}) {
        if (!this.supported) {
            throw new Error('Web Locks API is not supported');
        }

        const lockOptions = {
            mode: options.mode || 'exclusive',
            ifAvailable: options.ifAvailable || false,
            steal: options.steal || false,
            signal: options.signal || null
        };

        return new Promise((resolve, reject) => {
            navigator.locks.request(name, lockOptions, async (lock) => {
                try {
                    this.activeLocks.set(name, lock);
                    const result = await callback(lock);
                    this.activeLocks.delete(name);
                    resolve(result);
                } catch (error) {
                    this.activeLocks.delete(name);
                    reject(error);
                }
            }).catch(reject);
        });
    }

    /**
     * Request exclusive lock
     * @param {string} name - Lock name
     * @param {Function} callback - Callback function
     * @param {Object} options - Lock options
     * @returns {Promise<any>}
     */
    async requestExclusiveLock(name, callback, options = {}) {
        return this.requestLock(name, callback, { ...options, mode: 'exclusive' });
    }

    /**
     * Request shared lock
     * @param {string} name - Lock name
     * @param {Function} callback - Callback function
     * @param {Object} options - Lock options
     * @returns {Promise<any>}
     */
    async requestSharedLock(name, callback, options = {}) {
        return this.requestLock(name, callback, { ...options, mode: 'shared' });
    }

    /**
     * Query locks
     * @returns {Promise<Object>}
     */
    async queryLocks() {
        if (!this.supported) {
            throw new Error('Web Locks API is not supported');
        }

        return new Promise((resolve, reject) => {
            navigator.locks.query((locks) => {
                resolve({
                    held: locks.held || [],
                    pending: locks.pending || []
                });
            });
        });
    }

    /**
     * Check if lock is held
     * @param {string} name - Lock name
     * @returns {Promise<boolean>}
     */
    async isLockHeld(name) {
        const locks = await this.queryLocks();
        return locks.held.some(lock => lock.name === name);
    }

    /**
     * Wait for lock to be available
     * @param {string} name - Lock name
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<boolean>}
     */
    async waitForLock(name, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const isHeld = await this.isLockHeld(name);
            if (!isHeld) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }

    /**
     * Release lock
     * @param {string} name - Lock name
     */
    releaseLock(name) {
        this.activeLocks.delete(name);
    }

    /**
     * Get active locks
     * @returns {Array<string>}
     */
    getActiveLocks() {
        return Array.from(this.activeLocks.keys());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebLocksAPI;
}

