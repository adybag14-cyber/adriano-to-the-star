import os
import sys
from http.server import SimpleHTTPRequestHandler, HTTPServer
import socketserver

# Explicitly handle Range requests
class RangeRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

if __name__ == '__main__':
    port = 8090
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Running Range-Enabled Server on {port}")
    
    # Enable threading
    class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
        daemon_threads = True
    
    with ThreadingHTTPServer(("", port), RangeRequestHandler) as httpd:
        httpd.serve_forever()