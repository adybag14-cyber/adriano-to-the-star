
import http.server
import shutil
import sys
import os

PORT = 8086

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        print(f"DEBUG_GET: {self.path}")
        if self.path.startswith('/cheerpj/4.2/cj3.js'):
            print("Intercepting cj3.js")
            with open(r'cheerpj\4.2\cj3.js', 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
            return
        
        return super().do_GET()

if __name__ == '__main__':
    http.server.HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
