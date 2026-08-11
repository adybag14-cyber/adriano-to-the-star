import http.server
import socketserver
import os
import re
import sys
from socketserver import ThreadingMixIn

class ThreadingSimpleServer(ThreadingMixIn, socketserver.TCPServer):
    pass

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print("%s - - [%s] %s" % (self.client_address[0], self.log_date_time_string(), format%args))

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Range')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        
        if not os.path.exists(path):
            return super().send_head()

        range_header = self.headers.get('Range')
        if not range_header:
            return super().send_head()

        match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not match:
            return super().send_head()

        start = int(match.group(1))
        end = match.group(2)
        
        file_size = os.path.getsize(path)
        if end:
            end = int(end)
        else:
            end = file_size - 1
        
        if start >= file_size:
            self.send_error(416, "Requested Range Not Satisfiable")
            return None

        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()

        f = open(path, 'rb')
        f.seek(start)
        return f

PORT = 8000
socketserver.TCPServer.allow_reuse_address = True
print(f"Starting server on port {PORT}...")
with ThreadingSimpleServer(("", PORT), MyHTTPRequestHandler) as httpd:
    httpd.serve_forever()