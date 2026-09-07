// Loopback-only preview of the generated Pages artifact; no source/config serving.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = fs.realpathSync(path.resolve(process.argv[2] || 'public'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.jsonl': 'application/x-ndjson' };
http.createServer((req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    file = fs.realpathSync(file);
    if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile()) { res.writeHead(403).end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store', 'Content-Length': fs.statSync(file).size });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(0, '127.0.0.1', function () {
  console.log(JSON.stringify({ url: `http://127.0.0.1:${this.address().port}`, pid: process.pid, root }));
});
