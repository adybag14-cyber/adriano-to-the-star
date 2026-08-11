/**
 * Offline Mode Enhancements
 * 
 * Provides enhanced offline functionality with service worker registration,
 * cache management, offline action queue, and network status monitoring.
 * 
 * @class OfflineModeEnhancements
 * @example
 * // Auto-initializes on page load
 * // Access via: window.offlineEnhancements()
 * 
 * // Check if online
 * const offline = window.offlineEnhancements();
 * if (offline.isOnlineMode()) {
 *   console.log('User is online');
 * }
 * 
 * // Add action to offline queue
 * offline.addToQueue('claimPlanet', { kepid: 12345 });
 */
class OfflineModeEnhancements {
    constructor() {
        this.serviceWorker = null;
        this.cacheName = 'adriano-offline-enhancements-v1';
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.init();
    }

    init() {
        // Register service worker
        this.registerServiceWorker();
        
        // Setup online/offline listeners
        this.setupNetworkListeners();
        
        // Setup cache management
        this.setupCacheManagement();
        
        // Load offline queue
        this.loadOfflineQueue();
        
        console.log('✅ Offline Mode Enhancements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("o_ff_li_ne_mo_de_en_ha_nc_em_en_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Register service worker for offline support
     * 
     * @method registerServiceWorker
     * @returns {Promise<void>}
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                this.serviceWorker = registration;
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                });
            } catch (error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Setup network listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onOffline();
        });

        // Also check periodically
        setInterval(() => {
            this.isOnline = navigator.onLine;
        }, 5000);
    }

    /**
     * Handle online event
     */
    onOnline() {
        console.log('✅ Back online');
        this.showNotification('Connection restored', 'success');
        
        // Process offline queue
        this.processOfflineQueue();
    }

    /**
     * Handle offline event
     */
    onOffline() {
        console.log('⚠️ Gone offline');
        this.showNotification('You are offline. Some features may be limited.', 'warning');
    }

    /**
     * Setup cache management
     */
    setupCacheManagement() {
        // Cache critical resources
        this.cacheCriticalResources();
        
        // Setup cache cleanup
        this.setupCacheCleanup();
    }

    /**
     * Cache critical resources
     */
    async cacheCriticalResources() {
        if (!('caches' in window)) return;

        try {
            const cache = await caches.open(this.cacheName);
            
            const criticalResources = [
                '/',
                '/index.html',
                '/styles.css',
                '/navigation.js',
                '/cosmic-music-player.js',
                '/theme-toggle.js',
                '/accessibility.js'
            ];

            await cache.addAll(criticalResources);
            console.log('✅ Critical resources cached');
        } catch (error) {
            console.warn('Failed to cache resources:', error);
        }
    }

    /**
     * Setup cache cleanup
     */
    setupCacheCleanup() {
        // Clean old caches on load
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    if (cacheName.startsWith('adriano-offline-enhancements-') && cacheName !== this.cacheName) {
                        caches.delete(cacheName);
                        console.log('🗑️ Deleted old cache:', cacheName);
                    }
                });
            });
        }
    }

    /**
     * Load offline queue
     */
    loadOfflineQueue() {
        try {
            const stored = localStorage.getItem('offline-queue');
            if (stored) {
                this.offlineQueue = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load offline queue:', error);
        }
    }

    /**
     * Save offline queue
     */
    saveOfflineQueue() {
        try {
            localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.warn('Failed to save offline queue:', error);
        }
    }

    /**
     * Add action to offline queue for processing when online
     * 
     * @method addToQueue
     * @param {string} action - Action type identifier
     * @param {*} data - Action data (must be JSON-serializable)
     * @returns {void}
     */
    addToQueue(action, data) {
        this.offlineQueue.push({
            id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            action,
            data,
            timestamp: Date.now()
        });
        
        this.saveOfflineQueue();
        this.showNotification('Action queued for when you go online', 'info');
    }

    /**
     * Process offline queue
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        this.saveOfflineQueue();

        let successCount = 0;
        let failCount = 0;

        for (const item of queue) {
            try {
                await this.processQueueItem(item);
                successCount++;
            } catch (error) {
                console.error('Failed to process queue item:', error);
                failCount++;
                // Re-add failed items
                this.offlineQueue.push(item);
            }
        }

        this.saveOfflineQueue();

        if (successCount > 0) {
            this.showNotification(`Processed ${successCount} queued actions`, 'success');
        }
    }

    /**
     * Process queue item
     */
    async processQueueItem(item) {
        // This would process different action types
        // For now, just log
        console.log('Processing queue item:', item);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `offline-notification offline-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${this.escapeHtml(message)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);
        this.injectStyles();

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });

        // Auto-remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateY(-100%)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Check if online
     */
    isOnlineMode() {
        return this.isOnline;
    }

    /**
     * Get cache status and statistics
     * 
     * @method getCacheStatus
     * @returns {Promise<Object>} Cache status object
     * @returns {boolean} returns.available - Whether cache API is available
     * @returns {number} [returns.itemCount] - Number of cached items
     * @returns {number} [returns.totalSize] - Total cache size in bytes
     * @returns {string} [returns.totalSizeFormatted] - Formatted cache size (e.g., "1.5 MB")
     * @returns {string} [returns.error] - Error message if cache unavailable
     */
    async getCacheStatus() {
        if (!('caches' in window)) {
            return { available: false };
        }

        try {
            const cache = await caches.open(this.cacheName);
            const keys = await cache.keys();
            
            let totalSize = 0;
            for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }

            return {
                available: true,
                itemCount: keys.length,
                totalSize: totalSize,
                totalSizeFormatted: this.formatBytes(totalSize)
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    /**
     * Format bytes
     */
    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Clear cache
     */
    async clearCache() {
        if ('caches' in window) {
            await caches.delete(this.cacheName);
            console.log('🗑️ Cache cleared');
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('offline-mode-styles')) return;

        const style = document.createElement('style');
        style.id = 'offline-mode-styles';
        style.textContent = `
            .offline-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-100%);
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                z-index: 10002;
                font-family: 'Raleway', sans-serif;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                opacity: 0;
                transition: all 0.3s ease;
                min-width: 300px;
                max-width: 500px;
            }

            .offline-notification-success {
                border-color: rgba(68, 255, 68, 0.5);
            }

            .offline-notification-warning {
                border-color: rgba(255, 215, 0, 0.5);
            }

            .offline-notification-error {
                border-color: rgba(220, 53, 69, 0.5);
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: white;
            }

            .notification-icon {
                font-size: 1.2rem;
            }

            .notification-message {
                flex: 1;
            }

            .notification-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notification-close:hover {
                color: #ba944f;
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let offlineEnhancementsInstance = null;

function initOfflineEnhancements() {
    if (!offlineEnhancementsInstance) {
        offlineEnhancementsInstance = new OfflineModeEnhancements();
    }
    return offlineEnhancementsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOfflineEnhancements);
} else {
    initOfflineEnhancements();
}

// Export globally
window.OfflineModeEnhancements = OfflineModeEnhancements;
window.offlineEnhancements = () => offlineEnhancementsInstance;

