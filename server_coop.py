import http.server
import socketserver

PORT = 8001

class COOPCOEPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        # Also helpful for debugging
        self.send_header("Access-Control-Allow-Origin", "*")
        http.server.SimpleHTTPRequestHandler.end_headers(self)

with socketserver.TCPServer(("", PORT), COOPCOEPHandler) as httpd:
    print(f"Serving on port {PORT} with COOP/COEP headers...")
    httpd.serve_forever()
