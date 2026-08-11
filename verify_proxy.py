import urllib.request
import sys

def check(url, label):
    print(f"Checking {label}: {url}")
    try:
        with urllib.request.urlopen(url) as response:
            content = response.read(1000).decode('utf-8')
            if "[CheerpJ Proxy]" in content:
                print(f"  [PASS] Polyfill FOUND in {label}")
                return True
            else:
                print(f"  [FAIL] Polyfill NOT found in {label}")
                print(f"  Content start: {content[:100]}...")
                return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False

success = True
success &= check("http://localhost:8095/cheerpj/4.2/loader.js", "Clean URL")
success &= check("http://localhost:8095/cheerpj/4.2/loader.js?v=monotonic7", "Query URL")

if not success:
    sys.exit(1)
