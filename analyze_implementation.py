import re

# Searching for function definitions
KEYWORDS = ["function aqs(", "function asf("]
FILE = "cj3.js"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

print(f"--- Implementation Analysis of {FILE} ---")
for keyword in KEYWORDS:
    print(f"\nScanning for implementation: {keyword}")
    # Using literal search instead of complex regex to avoid errors
    pos = content.find(keyword)
    if pos != -1:
        start = pos
        end = min(len(content), pos + 500)
        snippet = content[start:end].replace("\n", " ")
        print(f"  [Found] ...{snippet}...")
    else:
        print("  [Not Found] trying alternative assignment pattern...")
        alt = keyword.split(" ")[1].replace("(", "") + "="
        pos = content.find(alt)
        if pos != -1:
            start = pos
            end = min(len(content), pos + 500)
            snippet = content[start:end].replace("\n", " ")
            print(f"  [Found Alt] ...{snippet}...")