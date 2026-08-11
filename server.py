import http.server
import socketserver
import os

PORT = 8090

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # FORCE RANGE SUPPORT HEADER
        self.send_header("Accept-Ranges", "bytes")
        
        # Security Headers
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    # Override to ensure extensions map correctly if needed
    def guess_type(self, path):
        return super().guess_type(path)

class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"--- RANGE-FORCED SERVER ON PORT {PORT} ---")

with ThreadingServer(("", PORT), RangeHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass