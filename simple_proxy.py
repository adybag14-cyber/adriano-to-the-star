
import http.server
import urllib.request
import urllib.parse
import sys
import os

PORT = 8090

class PatchHandler(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        with open('DEBUG_INIT.txt', 'a') as f:
             f.write("INIT\n")
        sys.stderr.write("DEBUG: Handler Init\n")
        super().__init__(*args, **kwargs)

    def do_GET(self):
        sys.stderr.write(f"DEBUG: GET {self.path}\n")
        print(f"GET {self.path}")
        
        if self.path == '/cheerpj/4.2/cj3.js':
            self.proxy_cj3()
            return

        super().do_GET()

    def proxy_cj3(self):
        url = 'https://cjrtnc.leaningtech.com/4.2/cj3.js'
        print(f"Fetching {url}")
        
        try:
            headers = {'Accept-Encoding': 'identity'}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                body = response.read()
                
            print(f"Read {len(body)} bytes.")
            
            # NEEDLE CHECK
            needle = b'if(c==="__syscall_pipe2")'
            with open('proxy_diag.txt', 'w') as diag:
                if needle in body:
                    diag.write("Needle FOUND! Applying patch.\n")
                    replacement = b'if(c==="JVM_LoadLibrary"||c==="JVM_FindLibraryEntry"){console.log("HOOKED_JVM_ANCHOR "+c);return 1;}else if(c==="__syscall_pipe2")'
                    body = body.replace(needle, replacement)
                else:
                    diag.write("Needle NOT found.\n")
                    idx = body.find(b'__syscall_pipe2')
                    if idx != -1:
                        snippet = body[max(0, idx-20):idx+50]
                        diag.write(f"Context: {snippet}\n")
                        diag.write(f"Hex: {snippet.hex()}\n")
                    else:
                        diag.write("Key __syscall_pipe2 NOT found.\n")
                        diag.write(f"First 100 bytes: {body[:100]}\n")

            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', len(body))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
            self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
            self.end_headers()
            self.wfile.write(body)
            
        except Exception as e:
            print(f"Proxy Error: {e}")
            self.send_error(500, str(e))

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), PatchHandler)
    print(f"Simple Proxy on {PORT}")
    server.serve_forever()
