
import os

def search_in_file(filepath, search_strings):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            
        print(f"Scanning {filepath} ({len(content)} bytes)...")
        
        for s in search_strings:
            b_s = s.encode('utf-8')
            if b_s in content:
                print(f"FOUND: '{s}'")
                # Print context (e.g., 50 bytes before and after)
                indices = [i for i in range(len(content)) if content.startswith(b_s, i)]
                for i in indices[:5]: # Show max 5 occurrences
                    start = max(0, i - 100)
                    end = min(len(content), i + len(b_s) + 100)
                    context = content[start:end]
                    print(f"  Offset {i}: ...{context}...")
            else:
                print(f"NOT FOUND: '{s}'")
                
    except Exception as e:
        print(f"Error: {e}")

filepath = r"cheerpj\4.2\cj3.js"
search_strings = [
    "java.library.path",
    "UnsatisfiedLinkError",
    "loadLibrary",
    "bootclasspath"
]

search_in_file(filepath, search_strings)
