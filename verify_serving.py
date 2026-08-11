
import http.server
import threading
import urllib.request
import os
import time

PORT = 8087

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with open(r'cheerpj\4.2\cj3.js', 'rb') as f:
                data = f.read()
            print(f"SERVER: Serving {len(data)} bytes")
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            print(f"SERVER: Error {e}")
            self.send_error(500)

def run_server():
    http.server.HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()

t = threading.Thread(target=run_server)
t.daemon = True
t.start()

time.sleep(1)

print("CLIENT: Fetching...")
try:
    content = urllib.request.urlopen(f'http://127.0.0.1:{PORT}/cheerpj/4.2/cj3.js').read()
    print(f"CLIENT: Received {len(content)} bytes")
    if b'HOOKED_JVM_ANCHOR' in content:
        print("CLIENT: HOOK FOUND")
    else:
        print("CLIENT: HOOK MISSING")
except Exception as e:
    print(f"CLIENT: Error {e}")
