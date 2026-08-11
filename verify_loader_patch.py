
import urllib.request

def check_url(url):
    print(f"Checking {url}...")
    try:
        with urllib.request.urlopen(url) as response:
            content = response.read(1000).decode('utf-8')
            # print("--- CONTENT START ---")
            # print(content[:200])
            # print("--- CONTENT END ---")
            
            if "[CheerpJ Proxy] Injected Monotonic Timer Polyfill" in content:
                print(f"SUCCESS: Polyfill found in {url}")
            else:
                print(f"FAILURE: Polyfill NOT found in {url}")
    except Exception as e:
        print(f"Error fetching {url}: {e}")

check_url("http://localhost:8095/cheerpj/4.2/loader.js")
check_url("http://localhost:8095/cheerpj/4.2/cj3.js")
