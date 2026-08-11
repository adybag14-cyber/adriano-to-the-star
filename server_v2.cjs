const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.jar': 'application/java-archive',
    '.xml': 'text/xml',
    '.properties': 'text/plain',
    '.csv': 'text/plain',
    '.ship': 'application/json',
    '.variant': 'application/json',
    '.system': 'application/json',
    '.wpn': 'application/json',
    '.proj': 'application/json',
    '.faction': 'application/json'
};

http.createServer(function (req, res) {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${req.method} ${req.url} -> ${res.statusCode} (${duration}ms) ${req.headers.range || ''}`);
    });

    // Set headers for EVERY response, even errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Accept-Ranges', 'bytes');

    const parsedUrl = url.parse(req.url);
    let sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.{2}[/\\])+/, '');
    let pathname = path.join(__dirname, sanitizePath);

    fs.exists(pathname, function (exist) {
        if (!exist) {
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        try {
            const stats = fs.statSync(pathname);
            if (stats.isDirectory()) {
                const files = fs.readdirSync(pathname);
                const content = Buffer.from(JSON.stringify(files));
                const size = content.length;

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Length', size);

                const range = req.headers.range;
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    let start = parseInt(parts[0], 10);
                    let end = parts[1] ? parseInt(parts[1], 10) : size - 1;

                    if (isNaN(start)) start = 0;
                    if (isNaN(end)) end = size - 1;

                    // Clamp end to size - 1
                    if (end >= size) end = size - 1;

                    if (start >= size) {
                        res.writeHead(416, { 'Content-Range': `bytes */${size}` });
                        res.end();
                        return;
                    }

                    const chunksize = (end - start) + 1;
                    res.writeHead(206, {
                        'Content-Range': `bytes ${start}-${end}/${size}`,
                        'Content-Length': chunksize,
                    });
                    res.end(content.slice(start, end + 1));
                } else {
                    res.statusCode = 200;
                    res.end(content);
                }
                return;
            }

            // It's a file
            const ext = path.parse(pathname).ext;
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const size = stats.size;

            res.setHeader('Content-Type', contentType);

            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                let start = parseInt(parts[0], 10);
                let end = parts[1] ? parseInt(parts[1], 10) : size - 1;

                if (isNaN(start)) start = 0;
                if (isNaN(end)) end = size - 1;

                // Clamp end to size - 1
                if (end >= size) end = size - 1;

                // Handle cases where size is 0 (like localtime)
                if (size === 0) {
                    if (start === 0) {
                        res.writeHead(206, {
                            'Content-Range': `bytes 0-0/0`,
                            'Content-Length': 0,
                        });
                        res.end();
                        return;
                    } else {
                        res.writeHead(416, { 'Content-Range': `bytes */0` });
                        res.end();
                        return;
                    }
                }

                if (start >= size) {
                    res.writeHead(416, { 'Content-Range': `bytes */${size}` });
                    res.end();
                    return;
                }

                const chunksize = (end - start) + 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Content-Length': chunksize,
                });
                fs.createReadStream(pathname, { start, end }).pipe(res);
            } else {
                res.setHeader('Content-Length', size);
                res.writeHead(200);
                fs.createReadStream(pathname).pipe(res);
            }
        } catch (e) {
            res.statusCode = 500;
            res.end(`Error: ${e.message}`);
        }
    });
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});