import re
import os

def find_patterns(filepath, pattern):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            matches = re.findall(pattern, content)
            return matches
    except Exception as e:
        return str(e)

print("Searching cj3.js for 'cj3n...'")
matches_cj3 = find_patterns('cheerpj_dist/4.2/cj3.js', r'cj3n[a-zA-Z0-9_]+')
print(f"Matches: {list(set(matches_cj3))}")

print("\nSearching cheerpOS.js for '*.wasm'")
matches_os = find_patterns('cheerpj_dist/4.2/cheerpOS.js', r'[a-zA-Z0-9_]+\.wasm')
print(f"Matches: {list(set(matches_os))}")
