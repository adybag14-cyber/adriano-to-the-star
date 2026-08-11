import http.server
import socketserver
import os

PORT = 8090

class ForcedRangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # We override this to ensure the header is written
        # Check if we already sent it to avoid duplicates
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Server on {PORT}")

with socketserver.TCPServer(("", PORT), ForcedRangeHandler) as httpd:
    httpd.serve_forever()