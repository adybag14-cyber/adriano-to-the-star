#!/usr/bin/env python3
"""
Proxy server that redirects Starsector asset requests to Cloudflare Worker.
Serves HTML from localhost but proxies game asset requests to worker URL.
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.error
import os

WORKER_URL = "https://starisdons-swf-worker.adybag14.workers.dev"

class ProxyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Proxy requests for starsector assets to worker
        if self.path.startswith('/starsector/') or self.path.startswith('/Starsector-'):
            # Construct full worker URL
            worker_request_url = f"{WORKER_URL}{self.path}"
            print(f"[PROXY] Redirecting to worker: {self.path} -> {worker_request_url}")
            
            try:
                # Fetch from worker
                with urllib.request.urlopen(worker_request_url) as response:
                    content = response.read()
                    content_type = response.headers.get('Content-Type', 'application/octet-stream')
                    
                    # Return response
                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', len(content))
                    self.end_headers()
                    self.wfile.write(content)
                    print(f"[PROXY] Successfully proxied: {self.path} ({len(content)} bytes)")
                    return
            except urllib.error.HTTPError as e:
                print(f"[PROXY] Worker returned {e.code} for {self.path}")
                self.send_response(e.code)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"Worker error: {e.code}".encode())
                return
            except Exception as e:
                print(f"[PROXY] Error proxying {self.path}: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"Proxy error: {str(e)}".encode())
                return
        
        # Serve all other files locally (HTML, JS, CSS, etc.)
        return SimpleHTTPRequestHandler.do_GET(self)
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

def run_server(port=8001):
    """Start the proxy server on the specified port."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHTTPRequestHandler)
    print(f"[PROXY] Server running on http://localhost:{port}")
    print(f"[PROXY] Proxying starsector/* requests to {WORKER_URL}")
    print(f"[PROXY] Serving all other files locally")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
