from http.server import SimpleHTTPRequestHandler, test
import os

class RangeRequestHandler(SimpleHTTPRequestHandler):
    """
    Extensions to the SimpleHTTPRequestHandler to support the Range header.
    Adapted from various sources to provide partial content support for CheerpJ.
    """
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Accept-Ranges', 'bytes') # advertise support
        super().end_headers()

    def send_head(self):
        if 'Range' not in self.headers:
            self.send_header('Accept-Ranges', 'bytes')
            return super().send_head()

        try:
            path = self.translate_path(self.path)
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        ctype = self.guess_type(path)
        try:
            fs = os.fstat(f.fileno())
            file_len = fs.st_size
            
            range_header = self.headers['Range']
            # Simple parsing for "bytes=START-END"
            # Does not support multiple ranges or complex specs
            if not range_header.startswith('bytes='):
                return super().send_head()
            
            ranges = range_header[6:].split('-')
            start = int(ranges[0])
            end = int(ranges[1]) if ranges[1] else file_len - 1
            
            if start >= file_len:
                self.send_error(416, "Requested Range Not Satisfiable")
                return None
                
            self.send_response(206)
            self.send_header("Content-type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_len}")
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
            self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
            self.end_headers()
            
            f.seek(start)
            # Create a limited file wrapper for copyfile
            import io
            return io.BytesIO(f.read(end - start + 1))
            
        except:
            f.close()
            raise

if __name__ == '__main__':
    test(HandlerClass=RangeRequestHandler, port=8000)
