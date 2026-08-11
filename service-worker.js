/**
 * Service Worker for Caching
 * Implements offline caching and performance optimization
 * 
 * Features:
 * - Cache static assets
 * - Cache API responses
 * - Offline fallback
 * - Cache versioning
 * - Automatic cache cleanup
 */

const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `stellar-ai-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const API_CACHE = `${CACHE_NAME}-api`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/stellar-ai.html',
    '/database.html',
    '/ai-predictions.html',
    '/space-dashboard.html',
    '/star-maps.html',
    '/database-analytics.html',
    '/hiv-market-analysis.html',
    '/styles.css',
    '/pages-styles.css',
    '/theme-styles.css',
    '/stellar-ai-styles.css',
    '/keyboard-shortcuts-styles.css',
    '/accessibility-styles.css',
    '/i18n-styles.css',
    '/loader-minimal.css',
    '/loader.js',
    '/navigation.js',
    '/stellar-ai.js',
    '/animations.js',
    '/animation-controls.js',
    '/lazy-loading.js',
    '/keyboard-shortcuts.js',
    '/accessibility.js',
    '/i18n.js',
    '/cosmic-music-player.js',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[Service Worker] Caching static assets');
            return cache.addAll(STATIC_ASSETS).catch((error) => {
                console.warn('[Service Worker] Failed to cache some assets:', error);
                // Continue even if some assets fail to cache
                return Promise.resolve();
            });
        })
    );
    
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== API_CACHE && 
                        cacheName !== IMAGE_CACHE &&
                        cacheName.startsWith('stellar-ai-cache-')) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Always prefer network for navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, STATIC_CACHE));
        return;
    }

    // Handle different types of requests
    if (isStaticAsset(request.url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isImage(request.url)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else if (isAPI(request.url)) {
        event.respondWith(networkFirst(request, API_CACHE));
    } else {
        // Default: network first
        event.respondWith(networkFirst(request, STATIC_CACHE));
    }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('[Service Worker] Fetch failed:', error);
        // Return offline fallback if available
        return getOfflineFallback(request);
    }
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            // Cache successful responses
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('[Service Worker] Network failed, trying cache:', error);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        return getOfflineFallback(request);
    }
}

function getOfflineFallback(request) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        return caches.match('/offline.html').then((response) => {
            return response || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
            });
        });
    }
    
    // Return error for other requests
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// Helper functions
function isStaticAsset(url) {
    return url.match(/\.(css|js|json|woff|woff2|ttf|eot)$/i) ||
           url.includes('/static/') ||
           url.includes('/assets/');
}

function isImage(url) {
    return url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
           url.includes('/images/');
}

function isAPI(url) {
    return url.includes('/api/') ||
           url.includes('googleapis.com') ||
           url.includes('livekit.cloud');
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
});

