
import os
import zipfile
import shutil
import struct

JAR_PATH = "files/starfarer_obf.jar"
TEMP_DIR = "temp_sf_extract"
CLASS_PATH = "com/fs/starfarer/launcher/ModManager.class"

def read_u2(data, offset):
    return struct.unpack('>H', data[offset:offset+2])[0]

def read_u4(data, offset):
    return struct.unpack('>I', data[offset:offset+4])[0]

def patch_modmanager():
    print(f"Patching {JAR_PATH}...")
    
    bak_path = JAR_PATH + ".bak"
    if not os.path.exists(bak_path):
        shutil.copy2(JAR_PATH, bak_path)
        
    temp_jar = JAR_PATH + ".tmp"
    
    with zipfile.ZipFile(JAR_PATH, 'r') as zin, zipfile.ZipFile(temp_jar, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == CLASS_PATH:
                print(f"Patching {item.filename}...")
                data = bytearray(zin.read(item.filename))
                
                # --- PATCH LOGIC START ---
                # Analyze Constant Pool
                magic = data[:4]
                if magic != b'\xCA\xFE\xBA\xBE':
                    print("Invalid magic")
                    zout.writestr(item, data)
                    continue

                cp_count = read_u2(data, 8)
                offset = 10
                cp_utf8 = {} 
                
                print(f"CP Count: {cp_count}")
                i = 1
                while i < cp_count:
                    tag = data[offset]
                    offset += 1
                    if tag == 1: # UTF8
                        length = read_u2(data, offset)
                        offset += 2
                        s = data[offset:offset+length].decode('utf-8', errors='ignore')
                        cp_utf8[i] = s
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
                    else: break
                    i += 1
                    
                updateList_idx = None
                for idx, s in cp_utf8.items():
                    if s == "updateList":
                        updateList_idx = idx
                        break
                
                if updateList_idx:
                    print(f"Found 'updateList' at CP index {updateList_idx}")
                    # Skip Headers
                    access_flags = read_u2(data, offset); offset += 2
                    this_class = read_u2(data, offset); offset += 2
                    super_class = read_u2(data, offset); offset += 2
                    interfaces_count = read_u2(data, offset); offset += 2
                    offset += interfaces_count * 2
                    
                    # Fields
                    fields_count = read_u2(data, offset); offset += 2
                    for _ in range(fields_count):
                        offset += 6 
                        attr_count = read_u2(data, offset); offset += 2
                        for _ in range(attr_count):
                            offset += 2 
                            attr_len = read_u4(data, offset)
                            offset += 4 + attr_len
                            
                    # Methods
                    methods_count = read_u2(data, offset); offset += 2
                    for m_idx in range(methods_count):
                        access = read_u2(data, offset)
                        name_idx = read_u2(data, offset+2)
                        desc_idx = read_u2(data, offset+4)
                        attr_count = read_u2(data, offset+6)
                        offset += 8
                        
                        if name_idx == updateList_idx:
                            print(f"Found method updateList")
                            for _ in range(attr_count):
                                attr_name_idx = read_u2(data, offset)
                                attr_len = read_u4(data, offset+2)
                                attr_name = cp_utf8.get(attr_name_idx, "")
                                if attr_name == "Code":
                                    code_start = offset + 14 
                                    desc = cp_utf8.get(desc_idx, "")
                                    if desc.endswith(")V"):
                                        print("Applying RETURN patch.")
                                        data[code_start] = 0xB1
                                offset += 6 + attr_len
                            break 
                        else:
                            for _ in range(attr_count):
                                attr_len = read_u4(data, offset+2)
                                offset += 6 + attr_len
                # --- PATCH LOGIC END ---
                
                zout.writestr(item, data)
            else:
                zout.writestr(item, zin.read(item.filename))
                
    # Replace
    os.remove(JAR_PATH)
    os.rename(temp_jar, JAR_PATH)
    print("Patch complete.")

if __name__ == "__main__":
    patch_modmanager()
