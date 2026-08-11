/**
 * Offline-First Architecture System
 * 
 * Implements offline-first architecture with sync when online.
 * 
 * @module OfflineFirstSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class OfflineFirstSystem {
    constructor() {
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.syncInterval = null;
        this.isInitialized = false;
    }

    /**
     * Initialize offline-first system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('OfflineFirstSystem already initialized');
            return;
        }

        this.setupNetworkMonitoring();
        this.loadSyncQueue();
        this.setupSyncInterval(options.syncInterval || 30000);
        this.setupIndexedDB();
        
        this.isInitialized = true;
        console.log('✅ Offline-First System initialized');
    }

    /**
     * Set up network monitoring
     * @private
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });
    }

    /**
     * Handle online event
     * @private
     */
    async handleOnline() {
        this.isOnline = true;
        console.log('Network online, syncing data...');
        await this.sync();
    }

    /**
     * Handle offline event
     * @private
     */
    handleOffline() {
        this.isOnline = false;
        console.log('Network offline, using local data');
    }

    /**
     * Set up sync interval
     * @private
     * @param {number} interval - Sync interval in milliseconds
     */
    setupSyncInterval(interval) {
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.sync();
            }
        }, interval);
    }

    /**
     * Set up IndexedDB
     * @private
     */
    setupIndexedDB() {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB not supported');
            return;
        }

        const request = indexedDB.open('offline-first-db', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('sync-queue')) {
                db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('cache')) {
                db.createObjectStore('cache', { keyPath: 'key' });
            }
        };
    }

    /**
     * Queue operation for sync
     * @public
     * @param {string} operation - Operation type
     * @param {Object} data - Operation data
     * @param {Function} syncFunction - Function to execute when online
     * @returns {Promise} Operation result
     */
    async queueOperation(operation, data, syncFunction) {
        const queueItem = {
            id: Date.now() + Math.random(),
            operation,
            data,
            syncFunction: syncFunction.toString(),
            timestamp: Date.now()
        };

        this.syncQueue.push(queueItem);
        this.saveSyncQueue();

        // Try to sync immediately if online
        if (this.isOnline) {
            return this.sync();
        }

        // Return cached result if available
        return this.getCachedResult(operation, data);
    }

    /**
     * Sync queued operations
     * @public
     * @returns {Promise} Sync result
     */
    async sync() {
        if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;

        try {
            const queue = [...this.syncQueue];
            const results = [];

            for (const item of queue) {
                try {
                    // Execute sync function
                    const syncFn = new Function('return ' + item.syncFunction)();
                    const result = await syncFn(item.data);
                    
                    results.push({ success: true, item, result });
                    
                    // Remove from queue
                    const index = this.syncQueue.findIndex(q => q.id === item.id);
                    if (index > -1) {
                        this.syncQueue.splice(index, 1);
                    }
                } catch (error) {
                    console.error('Sync operation failed:', error);
                    results.push({ success: false, item, error });
                }
            }

            this.saveSyncQueue();
            return results;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Get cached result
     * @private
     * @param {string} operation - Operation type
     * @param {Object} data - Operation data
     * @returns {Promise} Cached result
     */
    async getCachedResult(operation, data) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const key = `${operation}-${JSON.stringify(data)}`;
            const request = store.get(key);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    resolve(request.result?.value || null);
                };
                request.onerror = reject;
            });
        } catch (error) {
            console.warn('Failed to get cached result:', error);
            return null;
        }
    }

    /**
     * Cache result
     * @private
     * @param {string} operation - Operation type
     * @param {Object} data - Operation data
     * @param {*} result - Result to cache
     */
    async cacheResult(operation, data, result) {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const key = `${operation}-${JSON.stringify(data)}`;
            store.put({ key, value: result, timestamp: Date.now() });
        } catch (error) {
            console.warn('Failed to cache result:', error);
        }
    }

    /**
     * Get IndexedDB database
     * @private
     * @returns {Promise<IDBDatabase>} Database
     */
    getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('offline-first-db', 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = reject;
        });
    }

    /**
     * Save sync queue
     * @private
     */
    saveSyncQueue() {
        try {
            localStorage.setItem('sync-queue', JSON.stringify(this.syncQueue));
        } catch (e) {
            console.warn('Failed to save sync queue:', e);
        }
    }

    /**
     * Load sync queue
     * @private
     */
    loadSyncQueue() {
        try {
            const saved = localStorage.getItem('sync-queue');
            if (saved) {
                this.syncQueue = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load sync queue:', e);
        }
    }

    /**
     * Get sync queue status
     * @public
     * @returns {Object} Queue status
     */
    getQueueStatus() {
        return {
            length: this.syncQueue.length,
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress
        };
    }
}

// Create global instance
window.OfflineFirstSystem = OfflineFirstSystem;
window.offlineFirst = new OfflineFirstSystem();
window.offlineFirst.init();

