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
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.jar': 'application/java-archive',
    '.xml': 'text/xml'
};

http.createServer(function (req, res) {
    const parsedUrl = url.parse(req.url);
    let sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.{2}[/\\])+/, '');
    let pathname = path.join(__dirname, sanitizePath);

    fs.exists(pathname, function (exist) {
        // HEADERS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Accept-Ranges', 'bytes');

        if (!exist) {
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        // Directory Handling
        if (fs.statSync(pathname).isDirectory()) {
            // If the URL doesn't end with a slash, redirect to the same URL with a slash
            // This helps CheerpJ and browsers treat it as a directory
            if (!req.url.endsWith('/')) {
                 res.writeHead(301, { 'Location': req.url + '/' });
                 res.end();
                 return;
            }

            // Check for index.html
            let indexFile = path.join(pathname, 'index.html');
            if (fs.existsSync(indexFile)) {
                pathname = indexFile;
                // fall through to file serving
            } else {
                // Generate Directory Listing
                fs.readdir(pathname, { withFileTypes: true }, (err, files) => {
                    if (err) {
                        res.statusCode = 500;
                        res.end(`Error reading directory: ${err}`);
                        return;
                    }
                    res.setHeader('Content-Type', 'text/html');
                    res.write('<html><body><ul>');
                    
                    // Add parent directory link
                    res.write('<li><a href="../">..</a></li>');

                    const links = files.map(dirent => {
                        let name = dirent.name;
                        let isDir = dirent.isDirectory();
                        // For CheerpJ, it's helpful if directory links end with /
                        let href = name + (isDir ? '/' : '');
                        return `<li><a href="${href}">${name}</a></li>`;
                    }).join('');
                    
                    res.write(links);
                    res.end('</ul></body></html>');
                });
                return;
            }
        }

        // File Serving
        fs.stat(pathname, (err, stat) => {
            if (err) {
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
                return;
            }

            const ext = path.parse(pathname).ext;
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);

            if (stat.size === 0) {
                res.setHeader('Content-Length', 0);
                res.writeHead(200);
                res.end();
                return;
            }

            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                let end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

                if (start >= stat.size) {
                    res.statusCode = 416;
                    res.setHeader('Content-Range', `bytes */${stat.size}`);
                    res.end();
                    return;
                }

                if (end >= stat.size) {
                    end = stat.size - 1;
                }
                const chunksize = (end - start) + 1;

                const file = fs.createReadStream(pathname, { start, end });
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Content-Length': chunksize,
                });
                file.pipe(res);
            } else {
                res.setHeader('Content-Length', stat.size);
                res.writeHead(200);
                const file = fs.createReadStream(pathname);
                file.pipe(res);
            }
        });
    });
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
