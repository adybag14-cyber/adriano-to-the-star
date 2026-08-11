#!/usr/bin/env python3
import os
import sys
import re
from http.server import SimpleHTTPRequestHandler, HTTPServer, ThreadingHTTPServer
import argparse
from datetime import datetime

BROWSER_LOG_FILE = os.environ.get('BROWSER_LOG_FILE', 'browser_console.log')

NODE_ENV = os.environ.get('NODE_ENV', '').lower()
CORS_ORIGINS = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]

# Minimal Range support implementation for http.server
class RangeRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Always allow all origins for debugging CheerpJ 4.1
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding, Range")
        self.send_header('Access-Control-Expose-Headers', 'Content-Length, Content-Range')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Accept-Ranges', 'bytes')
        SimpleHTTPRequestHandler.end_headers(self)

    extensions_map = SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '': 'application/octet-stream',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '.jar': 'application/java-archive',
        '.class': 'application/java-vm',
    })

    def send_head(self):
        if 'Range' not in self.headers:
            self.range = None
            return SimpleHTTPRequestHandler.send_head(self)
        
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            self.range = None
            return SimpleHTTPRequestHandler.send_head(self)

        try:
            ctype = self.guess_type(path)
            f = open(path, 'rb')
        except IOError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        file_len = fs[6]
        
        range_header = self.headers['Range']
        # Simple parsing for "bytes=start-end"
        range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
        print(f"[DEBUG] Range Header: {range_header} Match: {range_match}", file=sys.stderr)
        
        if range_match:
            first = int(range_match.group(1))
            last = range_match.group(2)
            if last:
                last = int(last)
            else:
                last = file_len - 1
            
            if first >= file_len:
                self.send_error(416, "Requested Range Not Satisfiable")
                return None
            
            length = last - first + 1
            self.send_response(206, "Partial Content")
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", "bytes %s-%s/%s" % (first, last, file_len))
            self.send_header("Content-Length", str(length))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            
            f.seek(first)
            self.range = (first, last, length)
            return f
        else:
            self.range = None
            return SimpleHTTPRequestHandler.send_head(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        print("[DEBUG] do_POST called", file=sys.stderr)
        try:
            length_header = self.headers.get('Content-Length')
            if length_header:
                content_length = int(length_header)
                post_data = self.rfile.read(content_length)
                decoded = post_data.decode('utf-8', errors='ignore').strip()
                if not decoded:
                    self.send_response(200)
                    self.end_headers()
                    return

                # Log to Markdown file
                BROWSER_LOG_FILE = r"c:\Users\adyba\adriano-to-the-star-clean\starsector_console_log.md"
                ts = datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'
                
                try:
                    # Append formatted log message
                    with open(BROWSER_LOG_FILE, 'a', encoding='utf-8') as f:
                        f.write(f"{decoded}\n")
                except Exception as file_err:
                    print(f"[ERROR] Failed to write {BROWSER_LOG_FILE}: {file_err}", file=sys.stderr)
                
                print(f"[BROWSER LOG] {decoded}", file=sys.stderr)
            else:
                print("[DEBUG] No Content-Length header", file=sys.stderr)
            
            sys.stderr.flush()
            self.send_response(200)
            self.end_headers()
        except Exception as e:
            print(f"[ERROR] POST failed: {e}", file=sys.stderr)
            sys.stderr.flush()
            self.send_response(500)
            self.end_headers()

    def copyfile(self, source, outputfile):
        if not self.range:
            try:
                SimpleHTTPRequestHandler.copyfile(self, source, outputfile)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                return
            return

        # Handle range copy
        start, end, length = self.range
        print(f"[DEBUG] Range Copy: {start}-{end}/{length} bytes", file=sys.stderr)
        left = length
        BLOCK_SIZE = 64 * 1024
        total_written = 0
        while left > 0:
            block = source.read(min(BLOCK_SIZE, left))
            if not block:
                print("[DEBUG] Unexpected EOF reading source file!", file=sys.stderr)
                break
            try:
                self.wfile.write(block)
                total_written += len(block)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError) as e:
                print(f"[DEBUG] Client disconnected: {e}", file=sys.stderr)
                break
            except Exception as e:
                print(f"[DEBUG] Write error: {e}", file=sys.stderr)
                break
            left -= len(block)
        print(f"[DEBUG] Finished writing {total_written} bytes", file=sys.stderr)

    def do_GET(self):
        print(f"[DEBUG] GET Request: {self.path}", file=sys.stderr)
        sys.stderr.flush()
        SimpleHTTPRequestHandler.do_GET(self)

    def log_message(self, format, *args):
        msg = f"[{self.log_date_time_string()}] {self.address_string()} - {format % args} | headers: {self.headers.get('Range', 'No Range')}\n"
        sys.stdout.write(msg)
        sys.stdout.flush()
        try:
            with open("server_access.log", "a") as f:
                f.write(msg)
                f.flush()
        except Exception as e:
            sys.stdout.write(f"LOG WRITE FAILED: {e}\n")
            sys.stdout.flush()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default=os.environ.get('HOST', '0.0.0.0'))
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '9000')))
    args = parser.parse_args()

    # HTTPServer.allow_reuse_address = True # Not needed for ThreadingHTTPServer usually, but good practice if binding same port often
    ThreadingHTTPServer.allow_reuse_address = True
    print(f"Starting Range-Supporting Threaded Server on {args.host}:{args.port}...")
    server = ThreadingHTTPServer((args.host, args.port), RangeRequestHandler)
    server.serve_forever()
