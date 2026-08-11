/**
 * Service Worker Registration
 * Registers the service worker and handles updates
 */

const isSmokeFunctional = (() => {
    try {
        if (typeof window === 'undefined' || !window.location) return false;
        return new URLSearchParams(window.location.search || '').get('cb') === 'smoke-functional';
    } catch {
        return false;
    }
})();

if (!isSmokeFunctional && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                if (!registration) {
                    console.warn('⚠️ Service Worker registration returned no registration object.');
                    return;
                }

                console.log('✅ Service Worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New service worker found, installing...');

                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('✨ New service worker installed. Refresh to update.');
                            showUpdateNotification();
                        }
                    });
                });

                // Handle controller change (page refresh after update)
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 Service worker controller changed');
                    // Instead of auto-reloading, show a toast to let user know
                    console.log('🔄 Service worker controller changed');
                    showUpdateNotification('Update complete! Reload to see changes.');
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from service worker:', event.data);
    });
}

function showUpdateNotification(message = 'New version available!') {
    // Check if notification already exists
    if (document.querySelector('.sw-update-notification')) return;

    // Create update notification
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <span>✨ ${message}</span>
            <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #ba944f; border: none; border-radius: 5px; color: white; cursor: pointer;">
                Update Now
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 0.5rem 1rem; background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer;">
                Later
            </button>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(186, 148, 79, 0.5);
        border-radius: 10px;
        padding: 1rem 1.5rem;
        z-index: 10000;
        color: white;
        font-family: 'Raleway', sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

// Cache management API
window.cacheManager = {
    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('✅ All caches cleared');
        }
    },

    async cacheUrls(urls) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_URLS',
                urls: urls
            });
        }
    },

    async getCacheSize() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            let totalSize = 0;

            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();

                for (const key of keys) {
                    const response = await cache.match(key);
                    if (response) {
                        const blob = await response.blob();
                        totalSize += blob.size;
                    }
                }
            }

            return {
                size: totalSize,
                sizeMB: (totalSize / 1024 / 1024).toFixed(2),
                caches: cacheNames.length
            };
        }
        return null;
    }
};

