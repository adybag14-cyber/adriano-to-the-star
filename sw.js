self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

const CDN_BASE = 'https://cjrtnc.leaningtech.com/4.2';

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Intercept Runtime Requests (/lt/... or /17/...)
    if (url.pathname.startsWith('/lt/') || url.pathname.startsWith('/17/') || url.pathname.startsWith('/lts/')) {
        let remotePath = url.pathname;
        if (remotePath.startsWith('/17/')) {
            remotePath = '/lt' + remotePath;
        }
        
        const targetUrl = CDN_BASE + remotePath;
        // console.log(`[SW] Proxying ${url.pathname} to ${targetUrl}`);
        
        event.respondWith(
            fetch(targetUrl, {
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    // Browser automatically adds necessary headers
                }
            })
        );
        return;
    }
    
    // Allow all other requests to go to the server
});