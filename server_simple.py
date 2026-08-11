import http.server
import socketserver
import os

PORT = 8090

class RobustHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Server on {PORT}")

with socketserver.TCPServer(("", PORT), RobustHandler) as httpd:
    httpd.serve_forever()