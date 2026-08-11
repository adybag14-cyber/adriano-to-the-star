const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8090;
const ROOT = process.cwd();
const CDN_HOST = 'cjrtnc.leaningtech.com';
const CDN_PATH_PREFIX = '/4.2';

const server = http.createServer((req, res) => {
    // 1. Global Headers
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // 2. Proxy Logic (Runtime)
    // Handle /lt/ or /17/ or /lts/
    if (req.url.startsWith('/lt/') || req.url.startsWith('/17/') || req.url.startsWith('/lts/')) {
        let remotePath = req.url;
        
        // CORRECTION: The CDN structure is /4.2/17/... NOT /4.2/lt/17/...
        // We must STRIP /lt/ if present.
        if (remotePath.startsWith('/lt/')) {
            remotePath = remotePath.substring(3); // Remove /lt
        }
        
        // remotePath is now /17/lib/modules or /8/jre/...
        
        const targetPath = CDN_PATH_PREFIX + remotePath + "?cb=" + Date.now(); // Cache bust
        
        console.log(`[Proxy] ${req.method} ${req.url} -> https://${CDN_HOST}${targetPath}`);

        const options = {
            hostname: CDN_HOST,
            port: 443,
            path: targetPath,
            method: req.method,
            headers: { 
                ...req.headers, 
                'host': CDN_HOST, 
                'accept-encoding': 'identity',
                'cache-control': 'no-cache',
                'pragma': 'no-cache'
            }
        };
        delete options.headers['host'];
        delete options.headers['referer']; 
        delete options.headers['origin'];

        const proxyReq = https.request(options, (proxyRes) => {
            // Filter Headers
            const headersToForward = [
                'content-type', 'content-length', 'content-range', 
                'accept-ranges', 'date', 'server'
            ];
            
            const responseHeaders = {};
            for (const key of headersToForward) {
                if (proxyRes.headers[key]) {
                    responseHeaders[key] = proxyRes.headers[key];
                }
            }
            
            responseHeaders['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
            responseHeaders['expires'] = '0';
            responseHeaders['cross-origin-embedder-policy'] = 'credentialless';
            responseHeaders['cross-origin-opener-policy'] = 'same-origin';
            responseHeaders['access-control-allow-origin'] = '*';

            res.writeHead(proxyRes.statusCode, responseHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error(`Proxy Error: ${e.message}`);
            if (!res.headersSent) res.writeHead(502);
            res.end();
        });

        req.pipe(proxyReq);
        return;
    }

    // 3. Static File Serving
    let safePath = path.normalize(decodeURIComponent(url.parse(req.url).pathname)).replace(/^(\.\.[/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/game.html';
    
    let fullPath = path.join(ROOT, safePath);

    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end(); 
            return;
        }

        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
            '.json': 'application/json', '.wasm': 'application/wasm',
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jar': 'application/java-archive'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store'); 

        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Content-Length': chunksize
            });
            fs.createReadStream(fullPath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, { 'Content-Length': stats.size });
            fs.createReadStream(fullPath).pipe(res);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Node.js Proxy Server (v5 - Correct Path) running on port ${PORT}`);
});
