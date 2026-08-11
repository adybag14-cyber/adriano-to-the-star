const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8091;
const ROOT = process.cwd();

const MIME_TYPES = {
    '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
    '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.jar': 'application/java-archive',
    '.wasm': 'application/wasm', '.class': 'application/java-vm'
};

const server = http.createServer((req, res) => {
    // 1. SECURITY HEADERS
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store'); 

    // Path Logic
    let safePath = path.normalize(decodeURI(req.url.split('?')[0]));
    if (safePath === '/' || safePath === '\\') safePath = '/game.html';
    if (safePath.startsWith('..')) safePath = '/game.html'; 

    const filePath = path.join(ROOT, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Log 404s for debugging
            console.log(`[404] ${req.url}`);
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        res.setHeader('Accept-Ranges', 'bytes'); // CRITICAL FOR CHEERPJ

        // RANGE REQUEST HANDLING
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            let start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            
            if (isNaN(start)) start = 0;
            if (end >= stats.size) end = stats.size - 1;

            if (start >= stats.size) {
                res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
                res.end();
                return;
            }

            const chunksize = (end - start) + 1;
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Content-Length': chunksize
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, { 'Content-Length': stats.size });
            fs.createReadStream(filePath).pipe(res);
        }

        // 2. SILENT LOGGING
        if (!['.png', '.jpg', '.wav', '.ogg', '.class', '.json', '.xml'].includes(ext)) {
            console.log(`[REQ] ${req.url}`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`--- STARSECTOR NODE.JS SERVER (Port ${PORT}) ---
`);
    console.log(`Mode: Silent Logging + Range Support | COEP: Credentialless
`);
});