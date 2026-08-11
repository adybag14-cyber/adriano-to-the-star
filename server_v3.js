const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8091;
const ROOT = process.cwd();

const server = http.createServer((req, res) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");

    // Only log non-asset requests to avoid spam/freezing
    if (!req.url.startsWith('/graphics/') && !req.url.startsWith('/sounds/')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }

    let safePath = path.normalize(decodeURIComponent(url.parse(req.url).pathname)).replace(/^(\.\.[/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/game.html';
    
    let fullPath = path.join(ROOT, safePath);

    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (!req.url.endsWith('.map')) { // Ignore map files
                console.log(`  -> 404 Not Found: ${fullPath}`);
            }
            res.statusCode = 404;
            res.end("Not Found");
            return;
        }

        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
            '.json': 'application/json', '.wasm': 'application/wasm',
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jar': 'application/java-archive'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Accept-Ranges', 'bytes');

        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;

            if (start >= stats.size || end >= stats.size) {
                res.statusCode = 416;
                res.setHeader('Content-Range', `bytes */${stats.size}`);
                res.end();
                return;
            }

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Content-Length': chunksize
            });
            
            const stream = fs.createReadStream(fullPath, { start, end });
            stream.on('error', (streamErr) => {
                console.error(`Stream error for ${req.url}:`, streamErr);
                if (!res.headersSent) res.statusCode = 500;
                res.end();
            });
            stream.pipe(res);
        } else {
            res.writeHead(200, { 'Content-Length': stats.size });
            const stream = fs.createReadStream(fullPath);
            stream.on('error', (streamErr) => {
                console.error(`Stream error for ${req.url}:`, streamErr);
            });
            stream.pipe(res);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Node.js Server v3 running on port ${PORT}`);
});
