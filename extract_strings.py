import string

def extract_strings(filename, min_length=4):
    with open(filename, "rb") as f:
        content = f.read()
    
    results = []
    current = []
    for byte in content:
        char = chr(byte)
        if char in string.printable and byte >= 32 and byte <= 126:
            current.append(char)
        else:
            if len(current) >= min_length:
                results.append("".join(current))
            current = []
    
    # Final check
    if len(current) >= min_length:
        results.append("".join(current))
        
    return results

filename = "cj3n17.wasm"
print(f"Extracting strings from {filename}...")
found_strings = extract_strings(filename)

with open("analysis/wasm_analysis.txt", "w", encoding="utf-8") as out:
    for s in found_strings:
        out.write(s + "\n")

print(f"Done. Found {len(found_strings)} strings.")