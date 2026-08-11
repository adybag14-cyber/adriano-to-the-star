import os
import sys
import re
import io
import html
import urllib.parse
import urllib.request
import urllib.error
import shutil
from http.server import SimpleHTTPRequestHandler, HTTPServer, ThreadingHTTPServer

PORT = 8001


# Force correct MIME types (Windows registry often messes this up)
import mimetypes
mimetypes.init()
mimetypes.types_map['.js'] = 'application/javascript'
mimetypes.types_map['.js'] = 'application/javascript'
mimetypes.types_map['.wasm'] = 'application/wasm'
mimetypes.types_map['.jar'] = 'application/java-archive'
# Force 'modules' (jimage) to be octet-stream
mimetypes.add_type('application/octet-stream', 'modules')

NODE_ENV = os.environ.get('NODE_ENV', '').lower()

CORS_ORIGINS = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]

LOG4J_XML_STUB = (
    """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE log4j:configuration SYSTEM \"log4j.dtd\">
<log4j:configuration xmlns:log4j=\"http://jakarta.apache.org/log4j/\">
  <appender name=\"console\" class=\"org.apache.log4j.ConsoleAppender\">
    <layout class=\"org.apache.log4j.PatternLayout\">
      <param name=\"ConversionPattern\" value=\"%d{ISO8601} [%t] %-5p %c %x - %m%n\"/>
    </layout>
  </appender>
  <root>
    <priority value=\"info\"/>
    <appender-ref ref=\"console\"/>
  </root>
</log4j:configuration>
"""
).encode('utf-8')

SERVICE_STUB = b"\n"
LAUNCHING_STUB = b"\n"

CJ3_PATCH_LOGGED = False
CJ3_PATCH_APPLIED = None
CJ3_PATCH_REGEX_FALLBACK = None


def _get_allow_origin(headers):
    origin = headers.get('Origin')
    if not origin:
        return None
    if CORS_ORIGINS:
        return origin if origin in CORS_ORIGINS else None
    if NODE_ENV != 'production':
        return origin
    return None

class RangeRequestHandler(SimpleHTTPRequestHandler):
    """
    Enhanced Request Handler with support for:
    1. HTTP Range Requests (Critical for CheerpJ/large files)
    2. CORS Headers (Critical for cross-origin resources)
    3. Correct MIME types
    """

    def log_message(self, format, *args):
        # DEBUG: Log all requests to understand what's happening
        print(f"DEBUG: log_message called: {format % args}")
        return super().log_message(format, *args)

    def end_headers(self):
        # Security & Isolation Headers (Critical for CheerpJ WASM/Threading)
        # NOTE: COEP disabled to allow c.html iframe to load
        # self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        # self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        
        # Force no-cache for all files to ensure patches and stubs update immediately
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')


        # Add CORS headers
        allow_origin = _get_allow_origin(self.headers)
        if allow_origin:
            self.send_header('Access-Control-Allow-Origin', allow_origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding, Range")
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        """Handle POST requests, specifically for logging."""
        if self.path == '/log':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                msg = post_data.decode('utf-8')
                print(f"[BROWSER LOG] {msg}")
                with open('starsector_browser.log', 'a', encoding='utf-8') as f:
                    f.write(f"{msg}\n")
            except Exception as e:
                print(f"Error handling log: {e}")
            
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            allow_origin = _get_allow_origin(self.headers)
            if allow_origin:
                self.send_header('Access-Control-Allow-Origin', allow_origin) # Ensure CORS for POST
                self.send_header('Vary', 'Origin')
            super().end_headers()
            self.wfile.write(b"Logged")
        else:
            self.send_error(404, "Not Found")

    def _serve_bytes(self, data, content_type, head_only=False):
        file_size = len(data)

        range_header = self.headers.get('Range')
        if range_header:
            range_header = range_header.split(',')[0].strip()
            range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
            if range_match:
                first_str, last_str = range_match.groups()
                if not (first_str == "" and last_str == ""):
                    if first_str == "":
                        suffix_length = int(last_str) if last_str else 0
                        if suffix_length <= 0:
                            first_byte = 0
                            last_byte = -1
                        else:
                            first_byte = max(file_size - suffix_length, 0)
                            last_byte = file_size - 1
                    else:
                        first_byte = int(first_str)
                        last_byte = int(last_str) if last_str else file_size - 1

                    if last_byte >= file_size:
                        last_byte = file_size - 1

                    if first_byte > last_byte or first_byte >= file_size:
                        self.send_response(416, "Requested Range Not Satisfiable")
                        self.send_header("Content-Range", f"bytes */{file_size}")
                        self.end_headers()
                        return

                    body = data[first_byte:last_byte + 1]
                    self.send_response(206)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Content-Range", f"bytes {first_byte}-{last_byte}/{file_size}")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()

                    if not head_only:
                        self.wfile.write(body)
                    return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file_size))
        self.end_headers()

        if not head_only:
            self.wfile.write(data)

    def _maybe_remap_starsector_graphics(self):
        split = urllib.parse.urlsplit(self.path)
        if not split.path.startswith('/Starsector/graphics/'):
            return None

        local_path = self.translate_path(split.path)
        if os.path.exists(local_path):
            return None

        alt_path = '/Starsector/starsector-core' + split.path[len('/Starsector'):]
        alt_local_path = self.translate_path(alt_path)
        if not os.path.exists(alt_local_path):
            return None

        if split.query:
            alt_path += '?' + split.query
        if split.fragment:
            alt_path += '#' + split.fragment
        return alt_path

    def do_HEAD(self):
        split = urllib.parse.urlsplit(self.path)

        if split.path.startswith('/Starsector/starsector-core/lwjgl.jar'):
            self.send_error(404, "Blocked lwjgl.jar")
            return

        # PROXY CDN HEAD REQUESTS (cjrtnc.leaningtech.com/4.2/*) to enable cj3.js patching
        if self.path.startswith('/cjrtnc.leaningtech.com/4.2/'):
            print(f"DEBUG: Proxying CDN HEAD request: {self.path}")
            # Remap to /cheerpj/4.2/ for proxy handling
            self.path = self.path.replace('/cjrtnc.leaningtech.com/4.2/', '/cheerpj/4.2/')
            split = urllib.parse.urlsplit(self.path)
            # Re-process with new path
            return self._proxy_cheerpj(head_only=True)

        if split.path.endswith('/index.list'):
            self._serve_index_list(head_only=True)
            return
        if split.path.endswith('/log4j.xml'):
            self._serve_bytes(LOG4J_XML_STUB, 'text/xml; charset=utf-8', head_only=True)
            return
        if '/META-INF/services/' in split.path:
            self._serve_bytes(SERVICE_STUB, 'text/plain; charset=utf-8', head_only=True)
            return
        if split.path.endswith('/.launching'):
            self._serve_bytes(LAUNCHING_STUB, 'application/octet-stream', head_only=True)
            return

        if "ooOOOO" in self.path and self.path.endswith(".class"):
            try:
                with open("files/long_class_patch.class", "rb") as f:
                    self._serve_bytes(f.read(), "application/java-vm", head_only=True)
                return
            except:
                pass

        remapped = self._maybe_remap_starsector_graphics()
        if remapped:
            self.path = remapped
            return super().do_HEAD()
        if self.path.startswith('/cheerpj-4.2/'):
            self._proxy_cheerpj(head_only=True)
            return
        if self.path.startswith('/cheerpj-3.0/'):
            self._proxy_cheerpj3(head_only=True)
            return

        # UNIVERSAL RANGE SUPPORT FOR STATIC FILES (HEAD)
        local_path = self.translate_path(self.path)
        if os.path.isfile(local_path):
            try:
                with open(local_path, 'rb') as f:
                    # we don't need to read the whole file for HEAD, but for _serve_bytes we do right now
                    # (unless we refactor it to take size). But these are small files.
                    data = f.read()
                ctype = self.guess_type(local_path)
                self._serve_bytes(data, ctype, head_only=True)
                return
            except:
                pass

        return super().do_HEAD()

    def do_GET(self):
        # We will log the result AFTER handling it
        split = urllib.parse.urlsplit(self.path)

        if split.path.startswith('/Starsector/starsector-core/lwjgl.jar'):
            self.send_error(404, "Blocked lwjgl.jar")
            return
        
        # DEBUG: Log all requests to understand what's happening
        print(f"DEBUG: do_GET called with path: {self.path}")
        
        # PROXY CDN REQUESTS (cjrtnc.leaningtech.com/4.2/*) to enable cj3.js patching
        # MUST BE FIRST to intercept before other checks
        if self.path.startswith('/cjrtnc.leaningtech.com/4.2/'):
            print(f"DEBUG: Proxying CDN request: {self.path}")
            # Special handling for c.html to add COEP headers
            if self.path.endswith('/c.html'):
                print(f"DEBUG: c.html detected, calling _proxy_c_html")
                return self._proxy_c_html(head_only=False)
            # Remap to /cheerpj/4.2/ for proxy handling
            self.path = self.path.replace('/cjrtnc.leaningtech.com/4.2/', '/cheerpj/4.2/')
            split = urllib.parse.urlsplit(self.path)
            # Re-process with new path
            return self._proxy_cheerpj(head_only=False)
        
        # REMAPPING: If /files/ something is requested and it's a class or not found, try /files/classes/
        if split.path.startswith("/files/") and not split.path.startswith("/files/classes/"):
            local_path = self.translate_path(split.path)
            if not os.path.exists(local_path):
                # Try classes
                rel = split.path[7:] # remove /files/
                # handle double slash
                rel = rel.lstrip("/")
                alt = "/files/classes/" + rel
                alt_local = self.translate_path(alt)
                if os.path.exists(alt_local):
                    print(f"DEBUG: Remapping {split.path} -> {alt}")
                    # Update path for following logic
                    self.path = alt + (f"?{split.query}" if split.query else "") + (f"#{split.fragment}" if split.fragment else "")
                    split = urllib.parse.urlsplit(self.path)

        split = urllib.parse.urlsplit(self.path)
        if split.path.endswith('/index.list'):
            self._serve_index_list(head_only=False)
            return
        if split.path.endswith('/log4j.xml'):
            self._serve_bytes(LOG4J_XML_STUB, 'text/xml; charset=utf-8', head_only=False)
            return
        if '/META-INF/services/' in split.path:
            self._serve_bytes(SERVICE_STUB, 'text/plain; charset=utf-8', head_only=False)
            return
        if split.path.endswith('/.launching'):
            self._serve_bytes(LAUNCHING_STUB, 'application/octet-stream', head_only=False)
            return

        if "ooOOOO" in self.path and self.path.endswith(".class"):
            print(f"DEBUG: Remapping Long Class Request: {self.path}")
            try:
                with open("files/long_class_patch.class", "rb") as f:
                    self._serve_bytes(f.read(), "application/java-vm", head_only=False)
                return
            except Exception as e:
                print(f"Error serving long class patch: {e}")

        remapped = self._maybe_remap_starsector_graphics()
        if remapped:
            self.path = remapped
            return super().do_GET()

        # PROXY CDN REQUESTS (cjrtnc.leaningtech.com/4.2/*) to enable cj3.js patching
        if self.path.startswith('/cjrtnc.leaningtech.com/4.2/'):
            print(f"DEBUG: Proxying CDN request: {self.path}")
            # Remap to /cheerpj/4.2/ for proxy handling
            self.path = self.path.replace('/cjrtnc.leaningtech.com/4.2/', '/cheerpj/4.2/')
            split = urllib.parse.urlsplit(self.path)
            # Re-process with new path
            return self._proxy_cheerpj(head_only=False)

        # FORCE SERVE LOCAL PATCHED CJ3.JS
        if self.path.startswith('/cheerpj/4.2/cj3.js'):
            try:
                with open(r'cheerpj\4.2\cj3.js', 'rb') as f:
                    data = f.read()
                print(f"DEBUG: Serving patched cj3.js ({len(data)} bytes)")
                self._serve_bytes(data, 'application/javascript', head_only=False)
                return
            except Exception as e:
                print(f"Error serving cj3.js: {e}")

        # PATCH LOADER.JS TO USE RELATIVE PATHS FOR COEP COMPLIANCE
        if self.path.startswith('/cheerpj/4.2/loader.js'):
            try:
                # Fetch original loader.js from CDN
                remote_url = 'https://cjrtnc.leaningtech.com/4.2/loader.js'
                import ssl
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                req = urllib.request.Request(remote_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                    data = resp.read()
                
                # Patch: Replace cj3InitPath function to use relative path
                data_str = data.decode('utf-8')
                old_func = '''function cj3InitPath()
{
	var loaderFile = cj3GetCurrentScript();
	return loaderFile.substr(0, loaderFile.length - "/loader.js".length);
}'''
                new_func = '''function cj3InitPath()
{
	// PATCH: Use same-origin absolute URL to avoid invalid postMessage origins
	try {
		return window.location.origin + "/cjrtnc.leaningtech.com/4.2";
	} catch (e) {
		return "/cjrtnc.leaningtech.com/4.2";
	}
}'''
                data_str = data_str.replace(old_func, new_func)
                data_str = data_str.replace(
                    'var cj3InitOptions = {version:8};',
                    'var cj3InitOptions = {version:17};'
                )
                data_str = data_str.replace(
                    'var cj3InitOptions = {version: 8};',
                    'var cj3InitOptions = {version: 17};'
                )
                if 'self.cjModule = m' not in data_str:
                    data_str = data_str.replace(
                        'cj3Module = m;',
                        'cj3Module = m;\n\t\t\tself.cj3Module = m;\n\t\t\tself.cjModule = m;'
                    )
                    data_str = data_str.replace(
                        'cj3Module=m;',
                        'cj3Module=m;self.cj3Module=m;self.cjModule=m;'
                    )
                try:
                    with open("proxy_debug.log", "a") as log:
                        log.write(
                            "[PATCH] loader.js cjModule=%s version17=%s\n"
                            % ("self.cjModule" in data_str, "version:17" in data_str)
                        )
                except Exception:
                    pass
                patched_data = data_str.encode('utf-8')
                
                print(f"DEBUG: Serving patched loader.js ({len(patched_data)} bytes)")
                self._serve_bytes(patched_data, 'application/javascript', head_only=False)
                return
            except Exception as e:
                print(f"Error serving patched loader.js: {e}")

        if self.path.startswith('/cheerpj-3.0/'):
            print(f"DEBUG: Proxying 3.0: {self.path}")
            self._proxy_cheerpj3(head_only=False)
            return

        if self.path.startswith('/cheerpj-4.2/'):
            print(f"DEBUG: Proxying 4.2 request: {self.path}")
            self._proxy_cheerpj(head_only=False)
            return

        # UNIVERSAL RANGE SUPPORT FOR STATIC FILES
        local_path = self.translate_path(self.path)
        if os.path.isfile(local_path):
            try:
                with open(local_path, 'rb') as f:
                    data = f.read()
                ctype = self.guess_type(local_path)
                self._serve_bytes(data, ctype, head_only=False)
                return
            except Exception as e:
                print(f"Error serving local file {self.path}: {e}")

        return super().do_GET()

    def _proxy_cheerpj3(self, head_only=False):
        try:
            with open("proxy_debug.log", "a") as log:
                log.write(f"Proxy Request: {self.path}\n")
        except: pass

        split = urllib.parse.urlsplit(self.path)
        path = split.path
        prefix = '/cheerpj-3.0/'
        if not path.startswith(prefix):
            self.send_error(404, "Not Found")
            return

        # 1. Check Local File
        local_path = self.translate_path(path)
        if os.path.exists(local_path) and os.path.isfile(local_path):
            try:
                with open("proxy_debug.log", "a") as log:
                     log.write(f"  -> Serving Local: {local_path}\n")
                with open(local_path, 'rb') as f:
                    content = f.read()
                ctype = self.guess_type(local_path)
                self._serve_bytes(content, ctype, head_only=head_only)
                return
            except Exception as e:
                print(f"[CJ3 Proxy] Local file error: {e}")

        # 2. Remote Proxy
        remote_url = 'https://cjrtnc.leaningtech.com/3.0/' + path[len(prefix):]
        if split.query:
            remote_url += '?' + split.query

        try:
            with open("proxy_debug.log", "a") as log:
                log.write(f"  -> Fetching Remote: {remote_url}\n")
        except: pass

        headers = { 'Accept-Encoding': 'identity' }
        client_range = self.headers.get('Range')
        if client_range:
             headers['Range'] = client_range

        method = 'HEAD' if head_only else 'GET'
        req = urllib.request.Request(remote_url, headers=headers, method=method)

        try:
            resp = urllib.request.urlopen(req)
        except urllib.error.HTTPError as e:
            try:
                with open("proxy_debug.log", "a") as log:
                    log.write(f"  -> Remote Error: {e.code} {e.read(100)}\n")
            except: pass
            self.send_error(e.code, e.reason)
            return
        except Exception as e:
            try:
                with open("proxy_debug.log", "a") as log:
                    log.write(f"  -> Remote Exception: {e}\n")
            except: pass
            self.send_error(502, "Bad Gateway")
            return

        try:
            status = resp.getcode()
            self.send_response(status)
            skip_headers = {'connection', 'keep-alive', 'transfer-encoding'}
            for k, v in resp.headers.items():
                if k.lower() not in skip_headers:
                    self.send_header(k, v)
            self.end_headers()
            if not head_only:
                shutil.copyfileobj(resp, self.wfile)
        finally:
            try: resp.close()
            except: pass

    def _serve_index_list(self, head_only=False):
        split = urllib.parse.urlsplit(self.path)
        index_path = self.translate_path(split.path)

        encoded = None
        mtime = None

        if os.path.exists(index_path):
            try:
                with open(index_path, 'rb') as f:
                    encoded = f.read()
                try:
                    mtime = os.stat(index_path).st_mtime
                except Exception:
                    mtime = None
            except OSError:
                self.send_error(404, "File not found")
                return
        else:
            dir_path = os.path.dirname(index_path)
            if not os.path.isdir(dir_path):
                self.send_error(404, "File not found")
                return
            try:
                listing = os.listdir(dir_path)
            except OSError:
                self.send_error(404, "No permission to list directory")
                return

            listing.sort(key=lambda a: a.lower())
            lines = [name for name in listing if name.lower() != 'index.list']
            encoded = ('\n'.join(lines) + ('\n' if lines else '')).encode('utf-8')
            try:
                mtime = os.stat(dir_path).st_mtime
            except Exception:
                mtime = None

        file_size = len(encoded)

        range_header = self.headers.get('Range')
        if range_header:
            range_header = range_header.split(',')[0].strip()
            range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
            if range_match:
                first_str, last_str = range_match.groups()
                if not (first_str == "" and last_str == ""):
                    if first_str == "":
                        suffix_length = int(last_str) if last_str else 0
                        if suffix_length <= 0:
                            first_byte = 0
                            last_byte = -1
                        else:
                            first_byte = max(file_size - suffix_length, 0)
                            last_byte = file_size - 1
                    else:
                        first_byte = int(first_str)
                        last_byte = int(last_str) if last_str else file_size - 1

                    if last_byte >= file_size:
                        last_byte = file_size - 1

                    if first_byte > last_byte or first_byte >= file_size:
                        self.send_response(416, "Requested Range Not Satisfiable")
                        self.send_header("Content-Range", f"bytes */{file_size}")
                        self.end_headers()
                        return

                    body = encoded[first_byte:last_byte + 1]
                    self.send_response(206)
                    self.send_header("Content-type", "text/plain; charset=utf-8")
                    self.send_header("Content-Range", f"bytes {first_byte}-{last_byte}/{file_size}")
                    self.send_header("Content-Length", str(len(body)))
                    if mtime is not None:
                        self.send_header("Last-Modified", self.date_time_string(mtime))
                    self.end_headers()

                    if not head_only:
                        self.wfile.write(body)
                    return

        self.send_response(200)
        self.send_header("Content-type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(file_size))
        if mtime is not None:
            self.send_header("Last-Modified", self.date_time_string(mtime))
        self.end_headers()

        if not head_only:
            self.wfile.write(encoded)

    def _proxy_c_html(self, head_only=False):
        """Proxy c.html with COEP headers to fix iframe blocking"""
        try:
            remote_url = 'https://cjrtnc.leaningtech.com/4.2/c.html'
            print(f"[PROXY c.html] Request: {self.path} -> {remote_url}")

            # SSL workaround for python/windows
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept-Encoding': 'identity'
            }

            method = 'HEAD' if head_only else 'GET'
            req = urllib.request.Request(remote_url, headers=headers, method=method)

            try:
                with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                    status = resp.getcode()

                    self.send_response(status)

                    # Forward relevant headers
                    skip = {'connection', 'keep-alive', 'transfer-encoding', 'content-encoding', 'content-length'}
                    for k, v in resp.headers.items():
                        if k.lower() not in skip:
                            self.send_header(k, v)

                    # Force COEP headers for iframe
                    # NOTE: COEP disabled to allow c.html iframe to load
                    # self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
                    # self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
                    self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

                    content_len = resp.headers.get('Content-Length')
                    if content_len:
                        self.send_header('Content-Length', content_len)

                    self.end_headers()

                    if not head_only:
                        shutil.copyfileobj(resp, self.wfile)

            except urllib.error.HTTPError as e:
                print(f"[PROXY c.html] HTTP Error {e.code}: {e}")
                self.send_error(e.code, str(e))
            except Exception as e:
                print(f"[PROXY c.html] Network Error: {e}")
                self.send_error(502, f"Bad Gateway: {e}")

        except Exception as e:
            print(f"[PROXY c.html] CRITICAL: {e}")
            self.send_error(500, f"Internal Error: {e}")

    def _proxy_cheerpj(self, head_only=False):
        try:
            # ROBUST PROXY FOR CHEERPJ 4.2
            # No patching for now - just get it working
            
            split = urllib.parse.urlsplit(self.path)
            path = split.path
            prefix = '/cheerpj/4.2/'
            
            if not path.startswith(prefix):
                self.send_error(404, "Not Found")
                return

            # CheerpJ 4.2 URL
            target_path = path[len(prefix):]
            remote_url = 'https://cjrtnc.leaningtech.com/4.2/' + target_path
            if split.query:
                remote_url += '?' + split.query

            print(f"[PROXY 4.2] Request: {self.path} -> {remote_url}")

            # SSL workaround for python/windows
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept-Encoding': 'identity'
            }

            client_range = self.headers.get('Range')
            # Don't pass range for JS files
            if client_range and not path.endswith('.js'):
                headers['Range'] = client_range

            method = 'HEAD' if head_only else 'GET'
            req = urllib.request.Request(remote_url, headers=headers, method=method)

            try:
                with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                    status = resp.getcode()
                    
                    self.send_response(status)
                    
                    # Forward relevant headers
                    skip = {'connection', 'keep-alive', 'transfer-encoding', 'content-encoding', 'content-length'}
                    for k, v in resp.headers.items():
                        if k.lower() not in skip:
                            self.send_header(k, v)
                    
                    # Force Cross-Origin Headers
                    # NOTE: COEP disabled to allow c.html iframe to load
                    # self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
                    # self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
                    self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                    
                    content_len = resp.headers.get('Content-Length')
                    if content_len:
                         self.send_header('Content-Length', content_len)

                    self.end_headers()

                    if not head_only:
                        shutil.copyfileobj(resp, self.wfile)
                        
            except urllib.error.HTTPError as e:
                print(f"[PROXY 4.2] HTTP Error {e.code}: {e}")
                self.send_error(e.code, str(e))
            except Exception as e:
                print(f"[PROXY 4.2] Network Error: {e}")
                self.send_error(502, f"Bad Gateway: {e}")

        except Exception as e:
            print(f"[PROXY 4.2] CRITICAL: {e}")
            self.send_error(500, f"Internal Error: {e}")

            # Debug logic failure
            if not CJ3_PATCH_APPLIED:
                try:
                    with open('debug_patch_fail.txt', 'w') as f:
                        f.write(str(body_bytes[:1000]))
                except:
                    pass

            if not CJ3_PATCH_LOGGED:
                CJ3_PATCH_LOGGED = True
                print(f"[cheerpj proxy] cj3.js STATUS: {CJ3_PATCH_APPLIED}")

            # CRITICAL FIX: Update body_text because we modified body_bytes
            if CJ3_PATCH_APPLIED:
                body_text = body_bytes.decode('utf-8', errors='replace')

            # 2. Inject Monotonic Timer Polyfill (New)
            # We inject this at the very top to ensure it overrides natives before anything runs.
            # Using 1.0ms increment to be absolutely safe against integer truncation.
            timer_polyfill = """
;(function(){
  try {
    var _realNow = performance.now.bind(performance);
    var _lastNow = _realNow();
    Object.defineProperty(performance, 'now', {
      value: function() {
        var now = _realNow();
        if (now <= _lastNow) { now = _lastNow + 1.0; } // Force 1.0ms increment
        _lastNow = now;
        return now;
      },
      writable: true, configurable: true
    });

  } catch(e) { console.error("[CheerpJ Proxy] Timer injection failed", e); }
})();
"""
            body_text = timer_polyfill + body_text

            patched_full = body_text.encode('utf-8')

            if client_range_header and status == 200:
                file_size = len(patched_full)
                range_header = client_range_header.split(',')[0].strip()
                range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
                if range_match:
                    first_str, last_str = range_match.groups()
                    if first_str == "" and last_str == "":
                        patched_body = patched_full
                    elif first_str == "":
                        suffix_length = int(last_str)
                        if suffix_length <= 0:
                            patched_body = patched_full
                        else:
                            first_byte = max(file_size - suffix_length, 0)
                            last_byte = file_size - 1
                            patched_body = patched_full[first_byte:last_byte + 1]
                            patched_content_range = f"bytes {first_byte}-{last_byte}/{file_size}"
                            status = 206
                    else:
                        first_byte = int(first_str)
                        if last_str:
                            last_byte = int(last_str)
                        else:
                            last_byte = file_size - 1
                        if last_byte >= file_size:
                            last_byte = file_size - 1
                        if first_byte > last_byte or first_byte >= file_size:
                            self.send_response(416, "Requested Range Not Satisfiable")
                            self.send_header("Content-Range", f"bytes */{file_size}")
                            self.end_headers()
                            return
                        patched_body = patched_full[first_byte:last_byte + 1]
                        patched_content_range = f"bytes {first_byte}-{last_byte}/{file_size}"
                        status = 206
                else:
                    patched_body = patched_full
            else:
                patched_body = patched_full
        except Exception:
            patched_body = body_bytes

            self.send_response(status)

            for k, v in resp.headers.items():
                lk = k.lower()
                if lk in skip_headers:
                    continue
                if lk == 'accept-ranges':
                    continue
                if patched_body is not None and lk in {'content-length', 'content-encoding', 'content-range'}:
                    continue
                self.send_header(k, v)

            if patched_body is not None:
                if patched_content_range is not None:
                    self.send_header('Content-Range', patched_content_range)
                self.send_header('Content-Length', str(len(patched_body)))

            self.end_headers()

            if head_only:
                return

            if patched_body is not None:
                self.wfile.write(patched_body)
            else:
                shutil.copyfileobj(resp, self.wfile)
        finally:
            try:
                resp.close()
            except Exception:
                pass

    def send_head(self):
        """
        Override to parse 'Range' header and send partial content if requested.
        """
        try:
            path = self.translate_path(self.path)
            if os.path.isdir(path):
                split = urllib.parse.urlsplit(self.path)
                if not split.path.endswith('/'):
                    new_path = split.path + '/'
                    if split.query:
                        new_path += '?' + split.query
                    if split.fragment:
                        new_path += '#' + split.fragment
                    self.send_response(301)
                    self.send_header("Location", new_path)
                    self.end_headers()
                    return None
        except Exception:
            pass

        try:
            split = urllib.parse.urlsplit(self.path)
            if split.path.endswith('/index.list'):
                index_path = self.translate_path(split.path)
                if not os.path.exists(index_path):
                    dir_path = os.path.dirname(index_path)
                    if os.path.isdir(dir_path):
                        try:
                            listing = os.listdir(dir_path)
                        except OSError:
                            self.send_error(404, "No permission to list directory")
                            return None

                        listing.sort(key=lambda a: a.lower())
                        lines = [name for name in listing if name.lower() != 'index.list']
                        encoded = ('\n'.join(lines) + ('\n' if lines else '')).encode('utf-8', 'surrogateescape')
                        f = io.BytesIO(encoded)
                        file_size = len(encoded)

                        range_header = self.headers.get('Range')
                        if range_header:
                            range_header = range_header.split(',')[0].strip()
                            range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
                            if range_match:
                                first_str, last_str = range_match.groups()
                                if not (first_str == "" and last_str == ""):
                                    if first_str == "":
                                        suffix_length = int(last_str)
                                        if suffix_length <= 0:
                                            first_byte = 0
                                            last_byte = -1
                                        else:
                                            first_byte = max(file_size - suffix_length, 0)
                                            last_byte = file_size - 1
                                    else:
                                        first_byte = int(first_str)
                                        if last_str:
                                            last_byte = int(last_str)
                                        else:
                                            last_byte = file_size - 1

                                    if last_byte >= file_size:
                                        last_byte = file_size - 1

                                    if first_byte > last_byte or first_byte >= file_size:
                                        self.send_response(416, "Requested Range Not Satisfiable")
                                        self.send_header("Content-Range", f"bytes */{file_size}")
                                        self.end_headers()
                                        f.close()
                                        return None

                                    length = last_byte - first_byte + 1
                                    self.send_response(206)
                                    self.send_header("Content-type", self.guess_type(path))
                                    self.send_header("Content-Range", f"bytes {first_byte}-{last_byte}/{file_size}")
                                    self.send_header("Content-Length", str(length))
                                    try:
                                        st = os.stat(dir_path)
                                        self.send_header("Last-Modified", self.date_time_string(st.st_mtime))
                                    except Exception:
                                        pass
                                    self.end_headers()
                                    f.seek(first_byte)
                                    return _RangeFileWrapper(f, length)

                        self.send_response(200)
                        self.send_header("Content-type", self.guess_type(path))
                        self.send_header("Content-Length", str(file_size))
                        try:
                            st = os.stat(dir_path)
                            self.send_header("Last-Modified", self.date_time_string(st.st_mtime))
                        except Exception:
                            pass
                        self.end_headers()
                        return f
        except Exception:
            pass

        if 'Range' not in self.headers:
            return super().send_head()

        try:
            path = self.translate_path(self.path)
            if os.path.isdir(path):
                try:
                    listing = os.listdir(path)
                except OSError:
                    self.send_error(404, "No permission to list directory")
                    return None

                listing.sort(key=lambda a: a.lower())
                displaypath = html.escape(urllib.parse.unquote(self.path))
                r = []
                r.append('<!DOCTYPE HTML>')
                r.append('<html lang="en">')
                r.append('<head>')
                r.append('<meta charset="utf-8">')
                r.append(f'<title>Directory listing for {displaypath}</title>')
                r.append('</head>')
                r.append('<body>')
                r.append(f'<h1>Directory listing for {displaypath}</h1>')
                r.append('<hr>')
                r.append('<ul>')
                for name in listing:
                    fullname = os.path.join(path, name)
                    displayname = linkname = name
                    if os.path.isdir(fullname):
                        displayname = name + '/'
                        linkname = name + '/'
                    if os.path.islink(fullname):
                        displayname = name + '@'
                    r.append(
                        f'<li><a href="{urllib.parse.quote(linkname)}">{html.escape(displayname)}</a></li>'
                    )
                r.append('</ul>')
                r.append('<hr>')
                r.append('</body>')
                r.append('</html>')

                encoded = '\n'.join(r).encode('utf-8', 'surrogateescape')
                f = io.BytesIO(encoded)
                file_size = len(encoded)

                range_header = self.headers.get('Range')
                if not range_header:
                    return super().send_head()

                range_header = range_header.split(',')[0].strip()
                range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
                if not range_match:
                    return super().send_head()

                first_str, last_str = range_match.groups()
                if first_str == "" and last_str == "":
                    return super().send_head()

                if first_str == "":
                    suffix_length = int(last_str)
                    if suffix_length <= 0:
                        return super().send_head()
                    first_byte = max(file_size - suffix_length, 0)
                    last_byte = file_size - 1
                else:
                    first_byte = int(first_str)
                    if last_str:
                        last_byte = int(last_str)
                    else:
                        last_byte = file_size - 1

                if last_byte >= file_size:
                    last_byte = file_size - 1

                if first_byte > last_byte:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    self.send_header("Content-Range", f"bytes */{file_size}")
                    super().end_headers()
                    f.close()
                    return None

                if first_byte >= file_size:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    self.send_header("Content-Range", f"bytes */{file_size}")
                    super().end_headers()
                    f.close()
                    return None

                length = last_byte - first_byte + 1
                self.send_response(206)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.send_header("Content-Range", f"bytes {first_byte}-{last_byte}/{file_size}")
                self.send_header("Content-Length", str(length))
                try:
                    st = os.stat(path)
                    self.send_header("Last-Modified", self.date_time_string(st.st_mtime))
                except Exception:
                    pass
                self.end_headers()

                f.seek(first_byte)
                return _RangeFileWrapper(f, length)
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        # Content-Type
        ctype = self.guess_type(path)
        
        # File size
        fs = os.fstat(f.fileno())
        file_size = fs.st_size

        # Parse Range header
        # Example: bytes=0-1023
        range_header = self.headers.get('Range')
        if not range_header:
            return super().send_head()

        range_header = range_header.split(',')[0].strip()
        range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)

        if not range_match:
            return super().send_head()

        first_str, last_str = range_match.groups()
        if first_str == "" and last_str == "":
            return super().send_head()

        if first_str == "":
            suffix_length = int(last_str)
            if suffix_length <= 0:
                return super().send_head()
            first_byte = max(file_size - suffix_length, 0)
            last_byte = file_size - 1
        else:
            first_byte = int(first_str)
            if last_str:
                last_byte = int(last_str)
            else:
                last_byte = file_size - 1

        if last_byte >= file_size:
            last_byte = file_size - 1

        if first_byte > last_byte:
            self.send_error(416, "Requested Range Not Satisfiable")
            self.send_header("Content-Range", f"bytes */{file_size}")
            super().end_headers()
            f.close()
            return None

        if first_byte >= file_size:
            self.send_error(416, "Requested Range Not Satisfiable")
            self.send_header("Content-Range", f"bytes */{file_size}")
            super().end_headers() # Just end headers for error
            f.close()
            return None

        # Calculate length
        length = last_byte - first_byte + 1

        if range_header:
            print(f"DEBUG_RANGE_RESP 206: {path} | Content-Range: bytes {first_byte}-{last_byte}/{file_size}")
        else:
            print(f"DEBUG_RANGE_RESP 200: {path}")

        # Send headers
        status_code = 200
        if range_header:
            status_code = 206
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {first_byte}-{last_byte}/{file_size}")
            self.send_header("Content-Length", str(length))
        else:
            self.send_response(200)
            self.send_header("Content-Length", str(file_size))

        # LOGGING
        try:
            with open("server_hit.log", "a") as logf:
                logf.write(f"{status_code} | GET {self.path} | Range: {self.headers.get('Range', 'None')}\n")
        except: pass

        self.send_header("Content-type", ctype)
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()

        if range_header:
            f.seek(first_byte)
            return _RangeFileWrapper(f, length)
        else:
            return f

class _RangeFileWrapper:
    """Wraps a file object to limit the number of bytes read."""
    def __init__(self, f, length):
        self.f = f
        self.length = length
        self.read_so_far = 0

    def read(self, size=-1):
        if self.read_so_far >= self.length:
            return b""
        
        allowed = self.length - self.read_so_far
        if size < 0 or size > allowed:
            size = allowed
            
        data = self.f.read(size)
        self.read_so_far += len(data)
        return data

    def close(self):
        self.f.close()



if __name__ == '__main__':
    # Ensure correct working directory
    # os.chdir(...) # Optional: set if needed, but usually current dir is fine
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except Exception:
            pass
    elif os.environ.get('PORT'):
        try:
            PORT = int(os.environ['PORT'])
        except Exception:
            pass
    
    server_address = ('0.0.0.0', PORT)
    print(f"[OK] Starting Robust Server on port {PORT} with Range Support...")
    print(RangeRequestHandler.__mro__)
    print(f"[LINK] URL: http://localhost:{PORT}/")
    
    httpd = ThreadingHTTPServer(server_address, RangeRequestHandler)
    httpd.daemon_threads = True
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
        httpd.server_close()


