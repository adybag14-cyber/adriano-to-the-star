/**
 * Data Synchronization Across Multiple Devices
 * 
 * Adds comprehensive data synchronization across multiple devices.
 * 
 * @module DataSyncMultiDevice
 * @version 1.0.0
 * @author Adriano To The Star
 */

class DataSyncMultiDevice {
    constructor() {
        this.syncQueue = [];
        this.lastSync = null;
        this.syncEndpoint = null;
        this.deviceId = this.getDeviceId();
        this.isInitialized = false;
    }

    /**
     * Initialize data sync system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('DataSyncMultiDevice already initialized');
            return;
        }

        this.syncEndpoint = options.endpoint || null;
        this.setupSyncInterval();
        this.setupOnlineListener();
        
        this.isInitialized = true;
        this.trackEvent('data_sync_multi_device_initialized');
    }

    /**
     * Get device ID
     * @private
     * @returns {string} Device ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('device-id');
        if (!deviceId) {
            deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('device-id', deviceId);
        }
        return deviceId;
    }

    /**
     * Queue data for sync
     * @public
     * @param {string} type - Data type
     * @param {string} action - Action (create, update, delete)
     * @param {Object} data - Data to sync
     */
    queueSync(type, action, data) {
        const syncItem = {
            id: Date.now() + Math.random(),
            type,
            action,
            data,
            deviceId: this.deviceId,
            timestamp: new Date().toISOString()
        };

        this.syncQueue.push(syncItem);
        this.saveSyncQueue();

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.sync();
        }
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[DataSync] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[DataSync] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[DataSync] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Sync data
     * @public
     * @returns {Promise} Sync result
     */
    async sync() {
        if (!navigator.onLine) {
            return { success: false, error: 'Offline' };
        }

        if (this.syncQueue.length === 0) {
            return { success: true, synced: 0 };
        }

        if (!this.syncEndpoint) {
            // Local sync only
            return this.syncLocal();
        }

        try {
            const itemsToSync = [...this.syncQueue];
            const data = await this.fetchJSON(this.syncEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceId: this.deviceId,
                    items: itemsToSync
                })
            });

            if (data) {
                this.syncQueue = [];
                this.saveSyncQueue();
                this.lastSync = new Date().toISOString();
                this.saveLastSync();

                // Pull changes from server
                await this.pullChanges();

                return { success: true, synced: itemsToSync.length };
            } else {
                throw new Error('Sync failed - no data returned');
            }
        } catch (error) {
            console.warn('Sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sync local data
     * @private
     * @returns {Promise} Sync result
     */
    async syncLocal() {
        // For local-only sync, merge with other devices' data in localStorage
        const otherDevicesData = this.getOtherDevicesData();
        
        this.syncQueue.forEach(item => {
            this.applySyncItem(item);
        });

        this.syncQueue = [];
        this.saveSyncQueue();
        this.lastSync = new Date().toISOString();
        this.saveLastSync();

        return { success: true, synced: this.syncQueue.length };
    }

    /**
     * Apply sync item
     * @private
     * @param {Object} item - Sync item
     */
    applySyncItem(item) {
        const { type, action, data } = item;
        
        try {
            const key = `sync-${type}`;
            let items = JSON.parse(localStorage.getItem(key) || '[]');

            if (action === 'create' || action === 'update') {
                const index = items.findIndex(i => i.id === data.id);
                if (index > -1) {
                    items[index] = { ...items[index], ...data };
                } else {
                    items.push(data);
                }
            } else if (action === 'delete') {
                items = items.filter(i => i.id !== data.id);
            }

            localStorage.setItem(key, JSON.stringify(items));
        } catch (e) {
            console.warn('Failed to apply sync item:', e);
        }
    }

    /**
     * Pull changes from server
     * @private
     * @returns {Promise} Pull result
     */
    async pullChanges() {
        if (!this.syncEndpoint) {
            return;
        }

        try {
            const data = await this.fetchJSON(`${this.syncEndpoint}?deviceId=${this.deviceId}&lastSync=${this.lastSync || ''}`);
            if (data && Array.isArray(data)) {
                data.forEach(change => {
                    if (change.deviceId !== this.deviceId) {
                        this.applySyncItem(change);
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to pull changes:', error);
        }
    }

    /**
     * Get other devices data
     * @private
     * @returns {Array} Other devices data
     */
    getOtherDevicesData() {
        try {
            const data = localStorage.getItem('sync-data');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    /**
     * Set up sync interval
     * @private
     */
    setupSyncInterval() {
        // Sync every 5 minutes
        setInterval(() => {
            if (navigator.onLine && this.syncQueue.length > 0) {
                this.sync();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Set up online listener
     * @private
     */
    setupOnlineListener() {
        window.addEventListener('online', () => {
            if (this.syncQueue.length > 0) {
                this.sync();
            }
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
     * Save last sync
     * @private
     */
    saveLastSync() {
        try {
            localStorage.setItem('last-sync', this.lastSync);
        } catch (e) {
            console.warn('Failed to save last sync:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_sync_multi_device_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.DataSyncMultiDevice = DataSyncMultiDevice;
window.dataSync = new DataSyncMultiDevice();
window.dataSync.init();

