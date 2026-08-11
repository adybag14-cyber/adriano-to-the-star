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
    if (req.url.startsWith('/lt/') || req.url.startsWith('/17/') || req.url.startsWith('/lts/')) {
        console.log(`[Proxy] ${req.url}`); // Keep logs for proxy requests
        let remotePath = req.url;
        if (remotePath.startsWith('/17/')) {
            remotePath = '/lt' + remotePath;
        }
        const targetPath = CDN_PATH_PREFIX + remotePath;
        
        const options = {
            hostname: CDN_HOST,
            port: 443,
            path: targetPath,
            method: req.method,
            headers: { ...req.headers, 'host': CDN_HOST, 'accept-encoding': 'identity' }
        };
        delete options.headers['host'];
        delete options.headers['referer']; 
        delete options.headers['origin'];

        const proxyReq = https.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
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

    // 3. Static File Serving (Optimized)
    // No console.log here to prevent blocking on 5000+ requests
    let safePath = path.normalize(decodeURIComponent(url.parse(req.url).pathname)).replace(/^(\.\.[/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/game.html';
    
    let fullPath = path.join(ROOT, safePath);

    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end(); // Empty body for speed
            return;
        }

        const ext = path.extname(fullPath).toLowerCase();
        // Minimal mime lookup
        const mimeTypes = {
            '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
            '.json': 'application/json', '.wasm': 'application/wasm',
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jar': 'application/java-archive'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');

        // Range Support
        const range = req.headers.range;
        let readStream;
        
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Content-Length': chunksize
            });
            readStream = fs.createReadStream(fullPath, { start, end });
        } else {
            res.writeHead(200, { 'Content-Length': stats.size });
            readStream = fs.createReadStream(fullPath);
        }

        // Robust Error Handling
        readStream.on('error', (e) => {
            // Client likely aborted or file lock issue
            if (!res.headersSent) res.statusCode = 500;
            res.end();
        });

        // Cleanup if client disconnects
        req.on('close', () => {
            readStream.destroy();
        });

        readStream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Node.js Optimized Server running on port ${PORT}`);
    console.log(`Logging disabled for static assets to improve performance.`);
});
