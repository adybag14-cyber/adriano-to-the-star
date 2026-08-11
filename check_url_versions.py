
import urllib.request

base_url = "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models"
versions = ["v0.2.46", "v0.2.47", "v0.2.48", "v0.2.49", "v0.2.50", "v0.2.51", "v0.2.52"]
filename = "Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm"

for v in versions:
    url = f"{base_url}/{v}/{filename}"
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            print(f"{v}: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"{v}: {e.code}")
    except Exception as e:
        print(f"{v}: Error {e}")
