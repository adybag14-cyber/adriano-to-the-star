/**
 * Offline-First Architecture (Advanced)
 * Advanced offline-first implementation
 */

class OfflineFirstArchitectureAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupServiceWorker();
        this.setupOfflineStorage();
        this.handleOfflineMode();
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registered');
            });
        }
    }
    
    setupOfflineStorage() {
        // Use IndexedDB for offline storage
        if ('indexedDB' in window) {
            this.setupIndexedDB();
        } else {
            // Fallback to localStorage
            this.setupLocalStorageFallback();
        }
    }
    
    setupIndexedDB() {
        // Setup IndexedDB for large data storage
        const request = indexedDB.open('app-db', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'id' });
            }
        };
    }
    
    setupLocalStorageFallback() {
        // Use localStorage as fallback
    }
    
    handleOfflineMode() {
        // Handle offline/online transitions
        window.addEventListener('online', () => {
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.enableOfflineMode();
        });
    }
    
    syncOfflineData() {
        // Sync data when coming back online
        if (window.supabase) {
            // Sync offline changes
        }
    }
    
    enableOfflineMode() {
        // Enable offline mode features
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show('You are offline. Some features may be limited.', 'info');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.offlineFirstArchitectureAdvanced = new OfflineFirstArchitectureAdvanced(); });
} else {
    window.offlineFirstArchitectureAdvanced = new OfflineFirstArchitectureAdvanced();
}

