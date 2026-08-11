import re

KEYWORDS = ["cj3GetClockMs", "cj3ThreadSleep", "cj3ThreadStop", "cj3ThreadCreate"]
FILE = "cj3.js"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

print(f"--- Deep Analysis of {FILE} ---")
for keyword in KEYWORDS:
    print(f"\nScanning for: {keyword}")
    # Search for property definitions or literal strings
    matches = [m.start() for m in re.finditer(re.escape(keyword), content)]
    print(f"Found {len(matches)} occurrences.")
    
    for i, pos in enumerate(matches):
        start = max(0, pos - 100)
        end = min(len(content), pos + len(keyword) + 100)
        snippet = content[start:end].replace("\n", " ")
        print(f"  [{i+1}] ...{snippet}...")
