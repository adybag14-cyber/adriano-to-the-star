/**
 * Planet Discovery Offline Mode Support
 * Enable offline functionality with service worker caching
 */

class PlanetDiscoveryOfflineMode {
    constructor() {
        this.cacheName = 'planet-discovery-v1';
        this.offlineData = new Map();
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            await this.registerServiceWorker();
        }
        
        this.setupOfflineDetection();
        this.setupOfflineStorage();
        console.log('📴 Offline mode initialized');
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('Service worker registered:', registration);
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.onOnline();
        });

        window.addEventListener('offline', () => {
            this.onOffline();
        });

        // Check initial status
        if (!navigator.onLine) {
            this.onOffline();
        }
    }

    onOnline() {
        console.log('Back online - syncing data');
        this.syncOfflineData();
        this.showNotification('Connection restored', 'Your data will be synced');
    }

    onOffline() {
        console.log('Gone offline - enabling offline mode');
        this.showNotification('Offline mode', 'Some features may be limited');
        document.body.classList.add('offline-mode');
    }

    setupOfflineStorage() {
        // Use IndexedDB for offline storage
        if ('indexedDB' in window) {
            this.initIndexedDB();
        } else {
            // Fallback to localStorage
            console.warn('IndexedDB not available, using localStorage');
        }
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PlanetDiscoveryDB', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('planets')) {
                    db.createObjectStore('planets', { keyPath: 'kepid' });
                }
                
                if (!db.objectStoreNames.contains('claims')) {
                    db.createObjectStore('claims', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'url' });
                }
            };
        });
    }

    async saveOffline(storeName, data) {
        if (this.db) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.put(data);
        } else {
            // Fallback to localStorage
            const key = `offline_${storeName}_${data.kepid || data.id}`;
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    async getOffline(storeName, key) {
        if (this.db) {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            return await store.get(key);
        } else {
            // Fallback to localStorage
            const keyStr = `offline_${storeName}_${key}`;
            const data = localStorage.getItem(keyStr);
            return data ? JSON.parse(data) : null;
        }
    }

    async syncOfflineData() {
        if (!navigator.onLine) return;

        try {
            // Sync claims
            const claims = await this.getAllOffline('claims');
            for (const claim of claims) {
                if (typeof supabase !== 'undefined' && supabase) {
                    await supabase.from('planet_claims').upsert(claim);
                }
            }

            // Clear synced data
            await this.clearOffline('claims');
            console.log('Offline data synced');
        } catch (error) {
            console.error('Error syncing offline data:', error);
        }
    }

    async getAllOffline(storeName) {
        if (this.db) {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            return await store.getAll();
        } else {
            // Fallback: get all from localStorage
            const items = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`offline_${storeName}_`)) {
                    items.push(JSON.parse(localStorage.getItem(key)));
                }
            }
            return items;
        }
    }

    async clearOffline(storeName) {
        if (this.db) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.clear();
        } else {
            // Fallback: clear from localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`offline_${storeName}_`)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }
    }

    showNotification(message, details) {
        // Show a simple notification banner
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(186, 148, 79, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        notification.innerHTML = `
            <strong>${message}</strong>
            ${details ? `<br><small>${details}</small>` : ''}
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryOfflineMode = new PlanetDiscoveryOfflineMode();
}

