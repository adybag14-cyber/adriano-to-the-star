
import urllib.request

base_url = "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0.2.46"
filenames = [
    "Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
    "Llama-3.2-1B-Instruct-q4f16_1-webgpu.wasm",
    "Llama-3.2-1B-Instruct-q4f16_0-ctx4k_cs1k-webgpu.wasm",
    "Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    "Llama-3.2-1B-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm"
]

for f in filenames:
    url = f"{base_url}/{f}"
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req) as response:
            print(f"{f}: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"{f}: {e.code}")
    except Exception as e:
        print(f"{f}: Error {e}")
