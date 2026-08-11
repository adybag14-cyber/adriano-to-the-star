
import zipfile
import struct
import shutil
import os

JAR_PATH = "files/starfarer_obf.jar"
CLASS_PATH = "com/fs/starfarer/StarfarerLauncher.class"
TARGET_STRING = "../starfarer.res/res"
NEW_STRING = "."

def read_u2(data, offset):
    return struct.unpack('>H', data[offset:offset+2])[0]

def write_u2(data, offset, val):
    data[offset:offset+2] = struct.pack('>H', val)

def patch_launcher():
    print(f"Patching {JAR_PATH}...")
    bak_path = JAR_PATH + ".bak_launcher"
    if not os.path.exists(bak_path):
        shutil.copy2(JAR_PATH, bak_path)
        
    temp_jar = JAR_PATH + ".tmp_launcher"
    
    with zipfile.ZipFile(JAR_PATH, 'r') as zin, zipfile.ZipFile(temp_jar, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == CLASS_PATH:
                print(f"Patching {item.filename}...")
                data = bytearray(zin.read(item.filename))
                
                # CP Scan
                cp_count = read_u2(data, 8)
                offset = 10
                
                print(f"CP Count: {cp_count}")
                i = 1
                while i < cp_count:
                    tag = data[offset]
                    offset += 1
                    if tag == 1: # UTF8
                        length = read_u2(data, offset)
                        s_offset = offset + 2
                        s = data[s_offset:s_offset+length].decode('utf-8', errors='ignore')
                        
                        if s == TARGET_STRING:
                            print(f"Found target string at CP #{i}: '{s}'")
                            # Patching
                            new_bytes = NEW_STRING.encode('utf-8')
                            new_len = len(new_bytes)
                            
                            # Shift content
                            diff = length - new_len
                            if diff != 0:
                                print(f"Resizing buffer. Old len: {length}, New len: {new_len}, Diff: {diff}")
                                # We need to construct new data. 
                                # This is complex because CP index offsets in code might remain same (good),
                                # but the physical file layout changes.
                                
                                # Since we are just stream patching the class file structure, 
                                # and this is a variable length attribute, we can just slice it?
                                # YES, the constant pool is just a sequence. Indices refer to the COUNT sequence (1, 2, ...), not byte offset.
                                # So shifting bytes is fine as long as we fix the length prefix.
                                
                                pre_chunk = data[:s_offset-2] # Header + Tag + previous items
                                # write new length
                                len_chunk = struct.pack('>H', new_len)
                                # new string
                                str_chunk = new_bytes
                                # rest of file
                                post_chunk = data[s_offset+length:]
                                
                                data = pre_chunk + len_chunk + str_chunk + post_chunk
                                
                                # Since we modified `data` in place by reassignment, `offset` is now invalid for further iteration
                                # But we found our target, so we can just stop or break?
                                # Assuming there's only one instance?
                                # Let's verify if there are others or just break.
                                print("Patched path string.")
                                break 
                                
                        offset += 2 + length
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
                
                zout.writestr(item, data)
            else:
                zout.writestr(item, zin.read(item.filename))
    
    # Replace
    os.remove(JAR_PATH)
    os.rename(temp_jar, JAR_PATH)
    print("Patch complete.")

if __name__ == "__main__":
    patch_launcher()
