
import struct

def analyze_class(filename):
    with open(filename, 'rb') as f:
        data = f.read()

    print(f"File size: {len(data)}")

    # Simple constant pool scan
    # Pattern: ldc "lwjgl" -> invokestatic
    # "lwjgl" string
    try:
        lwjgl_idx = data.index(b'lwjgl')
        print(f"Found 'lwjgl' at offset {lwjgl_idx}")
    except ValueError:
        print("'lwjgl' not found in raw bytes (might be ok if split)")

    # "loadLibrary"
    try:
        load_idx = data.index(b'loadLibrary')
        print(f"Found 'loadLibrary' at offset {load_idx}")
    except ValueError:
        print("'loadLibrary' not found")

    # Scan for opcode B8 (invokestatic) followed by index
    # logic is complex without full parser, but we can look for "loadLibrary" usages
    # simpler: find the sequence of bytes corresponding to the call.
    
    # We'll just dump hex around the string occurrences to verify structure
    # A true parser is better but extracting it is heavy.
    # Let's rely on the string constants being close to the code in small classes? 
    # No, constants are at start. Code is at end.
    
    # Dump last 500 bytes for manual inspection (Bytecode likely here)
    tail_len = 500
    tail = data[-tail_len:]
    print(f"\nHex dump of last {tail_len} bytes:")
    print(tail.hex())
    
    # Try to find '12' (ldc) followed by 'B8' (invokestatic) nearby
    # This is a weak heuristic but might spot the pattern
    import re
    # Convert data to hex string
    hex_data = data.hex()
    # Pattern: 12 .. b8 .. .. (ldc byte, invokestatic 2 bytes)
    # Note: LDC index is 1 byte, so 12 XX. Invokestatic is B8 YY YY.
    # So we look for 12 .. b8
    
    matches = [m.start() for m in re.finditer('12..b8', hex_data)]
    print(f"\nPotential ldc -> invokestatic patterns (hex offsets): {matches}")

analyze_class('org/lwjgl/Sys.class')
