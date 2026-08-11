/**
 * Offline Mode with Queue Management
 * Handle offline operations with queue
 */
(function() {
    'use strict';

    class OfflineModeQueueManagement {
        constructor() {
            this.queue = [];
            this.storageKey = 'offline-queue';
            this.init();
        }

        init() {
            this.setupUI();
            this.setupOfflineDetection();
        }

        setupUI() {
            if (!document.getElementById('offline-mode')) {
                const offline = document.createElement('div');
                offline.id = 'offline-mode';
                offline.className = 'offline-mode';
                offline.innerHTML = `<h2>Offline Mode</h2>`;
                document.body.appendChild(offline);
            }
        }

        setupOfflineDetection() {
            window.addEventListener('online', () => {
                this.processQueue();
            });

            window.addEventListener('offline', () => {
                this.showOfflineIndicator();
            });
        }

        queueRequest(request) {
            this.queue.push({
                ...request,
                timestamp: new Date().toISOString()
            });
            this.saveQueue();
        }

        async processQueue() {
            while (this.queue.length > 0 && navigator.onLine) {
                const request = this.queue.shift();
                try {
                    await fetch(request.url, request.options);
                } catch (error) {
                    this.queue.unshift(request);
                    break;
                }
            }
            this.saveQueue();
        }

        showOfflineIndicator() {
            if (window.notificationSystem) {
                window.notificationSystem.show('Offline', 'You are currently offline. Changes will be synced when connection is restored.', 'warning');
            }
        }

        saveQueue() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        }

        loadQueue() {
            const legacy = localStorage.getItem('offlineQueue');
            const canonical = localStorage.getItem(this.storageKey);

            const parseQueue = (raw) => {
                if (!raw) return [];
                try {
                    const parsed = JSON.parse(raw);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            };

            const canonicalQueue = parseQueue(canonical);
            const legacyQueue = parseQueue(legacy);

            // Prefer canonical, but preserve any legacy items
            const merged = [...canonicalQueue, ...legacyQueue];

            // Best-effort dedupe by timestamp+url
            const seen = new Set();
            this.queue = merged.filter((item) => {
                const key = `${item?.timestamp || ''}:${item?.url || ''}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // Persist to canonical key
            this.saveQueue();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.offlineMode = new OfflineModeQueueManagement();
            window.offlineMode.loadQueue();
        });
    } else {
        window.offlineMode = new OfflineModeQueueManagement();
        window.offlineMode.loadQueue();
    }
})();

