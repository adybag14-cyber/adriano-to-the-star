
    def _proxy_cheerpj3(self, head_only=False):
        """
        Proxies requests for /cheerpj-3.0/ to:
        1. Local file if it exists.
        2. Official CDN if it doesn't.
        """
        split = urllib.parse.urlsplit(self.path)
        path = split.path
        prefix = '/cheerpj-3.0/'
        if not path.startswith(prefix):
            self.send_error(404, "Not Found")
            return

        # 1. Check Local File
        local_path = self.translate_path(path)
        if os.path.exists(local_path):
            # Let the normal static file handler deal with it if it exists locally
            # But wait, translate_path maps to CWD, so /cheerpj-3.0/foo -> ./cheerpj-3.0/foo
            # We can just call serve_bytes or rely on fall-through?
            # Actually, standard do_GET handles static files. We intercepted it.
            # So we must serve it here if it exists.
            try:
                with open(local_path, 'rb') as f:
                    content = f.read()
                # Simple MIME guess
                ctype = self.guess_type(local_path)
                self._serve_bytes(content, ctype, head_only=head_only)
                return
            except Exception as e:
                print(f"[CJ3 Proxy] Local file error: {e}")
                # Fallthrough to remote

        # 2. Remote Proxy
        remote_url = 'https://cjrtnc.leaningtech.com/3.0/' + path[len(prefix):]
        if split.query:
            remote_url += '?' + split.query

        print(f"[CJ3 Proxy] Fetching: {remote_url}")

        headers = {
            'Accept-Encoding': 'identity'
        }
        
        # Forward Range header
        client_range = self.headers.get('Range')
        if client_range:
             headers['Range'] = client_range

        method = 'HEAD' if head_only else 'GET'
        req = urllib.request.Request(remote_url, headers=headers, method=method)

        try:
            resp = urllib.request.urlopen(req)
        except urllib.error.HTTPError as e:
            # If 404, send 404.
            self.send_error(e.code, e.reason)
            return
        except Exception:
            self.send_error(502, "Bad Gateway")
            return

        try:
            status = resp.getcode()
            self.send_response(status)
            
            # Forward relevant headers
            skip_headers = {'connection', 'keep-alive', 'transfer-encoding'}
            for k, v in resp.headers.items():
                if k.lower() not in skip_headers:
                    self.send_header(k, v)
            self.end_headers()

            if not head_only:
                shutil.copyfileobj(resp, self.wfile)

        finally:
            resp.close()
