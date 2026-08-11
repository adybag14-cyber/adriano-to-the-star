
import zipfile
import struct
import os

JAR_PATH = "files/starfarer_obf.jar"
CLASS_PATH = "com/fs/starfarer/StarfarerLauncher.class"

def read_u2(data, offset):
    return struct.unpack('>H', data[offset:offset+2])[0]

def scan_strings():
    with zipfile.ZipFile(JAR_PATH, 'r') as z:
        try:
            data = z.read(CLASS_PATH)
        except KeyError:
            print(f"Could not find {CLASS_PATH}")
            # Try to search for it
            for n in z.namelist():
                if "StarfarerLauncher" in n:
                    print(f"Found candidate: {n}")
            return

    print(f"Read {len(data)} bytes from {CLASS_PATH}")
    
    # Simple CP scanner
    cp_count = read_u2(data, 8)
    offset = 10
    print(f"CP Count: {cp_count}")
    
    i = 1
    while i < cp_count:
        if offset >= len(data): break
        tag = data[offset]
        offset += 1
        if tag == 1: # UTF8
            length = read_u2(data, offset)
            offset += 2
            s = data[offset:offset+length].decode('utf-8', errors='ignore')
            if "starfarer.res" in s or "data/config" in s:
                print(f"[{i}] FOUND TARGET STRING: '{s}'")
            offset += length
        elif tag == 7: offset += 2
        elif tag == 9: offset += 4
        elif tag == 10: offset += 4
        elif tag == 11: offset += 4
        elif tag == 8: offset += 2
        elif tag == 3: offset += 4
        elif tag == 4: offset += 4
        elif tag == 12: offset += 4
        elif tag == 5: offset += 8; i += 1
        elif tag == 6: offset += 8; i += 1
        elif tag == 15: offset += 3
        elif tag == 16: offset += 2
        elif tag == 18: offset += 4
        else:
            print(f"Unknown tag {tag} at {offset-1}")
            break
        i += 1

if __name__ == "__main__":
    scan_strings()
