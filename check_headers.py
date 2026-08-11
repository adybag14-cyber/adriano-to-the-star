import urllib.request

try:
    with urllib.request.urlopen("http://localhost:8090/play.html") as response:
        print(f"Status: {response.status}")
        headers = response.info()
        print("Headers:")
        print(headers)
        
        coep = headers.get("Cross-Origin-Embedder-Policy")
        print(f"CHECK -> Cross-Origin-Embedder-Policy: {coep}")

except Exception as e:
    print(f"Error: {e}")
