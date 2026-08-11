const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8091;
const ROOT = process.cwd();

const server = http.createServer((req, res) => {
    // Security Headers
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Path normalization
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
        res.setHeader('Accept-Ranges', 'bytes');

        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;

            if (start >= stats.size || end >= stats.size) {
                res.statusCode = 416;
                res.end();
                return;
            }

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
    console.log(`Silent Engine Server running on port ${PORT}`);
    console.log(`Serving from: ${ROOT}`);
});
