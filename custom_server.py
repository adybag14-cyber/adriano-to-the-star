import http.server
import socketserver
import os
import sys
import re
import mimetypes

# Ensure correct MIME types for CheerpJ and WASM
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('application/java-archive', '.jar')
mimetypes.add_type('application/javascript', '.js')

PORT = 9007

class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        self.send_header('Accept-Ranges', 'bytes')
        # COI Headers for SharedArrayBuffer support
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

    def log_message(self, format, *args):
        # Override to log to file as well as stderr
        msg = "%s - - [%s] %s\n" % (self.client_address[0],
                                    self.log_date_time_string(),
                                    format % args)
        with open("server_logs.txt", "a", encoding="utf-8") as f:
            f.write(msg)
        sys.stderr.write(msg)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        print(f"RAW REQUEST: {self.path}")
        path = self.translate_path(self.path)
        print(f"DEBUG GET: {self.path} -> {path}")
        sys.stdout.flush()
        
        if os.path.exists(path) and not os.path.isdir(path):
            range_header = self.headers.get('Range')
            if range_header:
                try:
                    # Parse Range header "bytes=0-100" or "bytes=100-"
                    file_size = os.path.getsize(path)
                    range_match = re.match(r'bytes=(\d+)-(\d+)?', range_header)
                    if range_match:
                        start = int(range_match.group(1))
                        end = range_match.group(2)
                        
                        if end:
                            end = int(end)
                        else:
                            end = file_size - 1
                        
                        if start >= file_size:
                            self.send_error(416, "Requested Range Not Satisfiable")
                            return

                        chunk_length = end - start + 1
                        
                        self.send_response(206)
                        self.send_header('Content-Type', 'application/octet-stream')
                        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                        self.send_header('Content-Length', str(chunk_length))
                        self.end_headers()
                        
                        with open(path, 'rb') as f:
                            f.seek(start)
                            self.wfile.write(f.read(chunk_length))
                        return
                except Exception as e:
                    print(f"Range handling error: {e}")
                    # Fallback to normal behavior if parsing fails
                    pass
                except Exception as e:
                    print(f"Range handling error: {e}")
                    # Fallback to normal behavior if parsing fails
                    pass
        
        if path.endswith("modules"):
            print(f"DEBUG: Serving modules file from {path}")
            try:
                fsize = os.path.getsize(path)
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Length', str(fsize))
                self.end_headers()
                
                sent = 0
                with open(path, 'rb') as f:
                    while True:
                        chunk = f.read(65536) # 64KB chunks
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        sent += len(chunk)
                print(f"DEBUG: Served {sent}/{fsize} bytes of modules")
            except Exception as e:
                print(f"ERROR serving modules: {e}")
                self.send_error(500, f"Server Error: {e}")
            return

        # Fallback to standard handler for non-range or directories
        return super().do_GET()

    def do_POST(self):
        if self.path == '/log':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            log_msg = f"[GAME LOG] {body.decode('utf-8', errors='replace')}\n"
            print(log_msg.strip())
            with open("server_logs.txt", "a", encoding="utf-8") as f:
                f.write(log_msg)
            self.send_response(200)
            self.end_headers()
            return
        self.send_error(501, "Unsupported method ('POST')")

# Use ThreadingTCPServer for concurrent request handling (vital for CheerpJ + Logging)
class ThreadingHTTPServer(socketserver.ThreadingTCPServer):
    daemon_threads = True

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    try:
        print(f"Serving at port {PORT} with CORS and FULL Range support...")
        sys.stdout.flush()
        with ThreadingHTTPServer(("0.0.0.0", PORT), RangeRequestHandler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        print(f"Error: Could not bind to port {PORT}. Is it already in use?")
        sys.exit(1)
