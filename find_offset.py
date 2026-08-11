
import os

with open(r'cheerpj/4.2/cj3.js', 'rb') as f:
    data = f.read()

needle = b'UnsatisfiedLinkError'
if needle in data:
    idx = data.find(needle)
    print(f"Found {needle} at index {idx}")
    start = max(0, idx - 100)
    end = min(len(data), idx + 100)
    print(f"Context: {data[start:end]}")
else:
    print(f"Not found: {needle}")
