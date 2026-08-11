import urllib.request
import urllib.error

# Alternate domain
url = "https://cheerpj.com/4.2/lt/17/lib/modules"
headers = {
    "User-Agent": "Mozilla/5.0",
    "Range": "bytes=0-100"
}

req = urllib.request.Request(url, headers=headers)

print(f"Probing {url}...")
try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        data = response.read()
        print(f"Read {len(data)} bytes")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.reason}")
except Exception as e:
    print(f"Error: {e}")
