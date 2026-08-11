/**
 * Service Worker Caching Strategies
 * Implement service worker caching
 */
(function() {
    'use strict';

    class ServiceWorkerCachingStrategies {
        constructor() {
            this.init();
        }

        init() {
            this.registerServiceWorker();
        }

        async registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered:', registration);
                } catch (error) {
                    console.error('Service Worker registration failed:', error);
                }
            }
        }

        createServiceWorkerScript() {
            return `
                self.addEventListener('install', (event) => {
                    event.waitUntil(
                        caches.open('v1').then((cache) => {
                            return cache.addAll([
                                '/',
                                '/index.html',
                                '/styles.css',
                                '/app.js'
                            ]);
                        })
                    );
                });

                self.addEventListener('fetch', (event) => {
                    event.respondWith(
                        caches.match(event.request).then((response) => {
                            return response || fetch(event.request);
                        })
                    );
                });
            `;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.serviceWorkerCaching = new ServiceWorkerCachingStrategies();
        });
    } else {
        window.serviceWorkerCaching = new ServiceWorkerCachingStrategies();
    }
})();

