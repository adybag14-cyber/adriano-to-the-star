
import os
import zipfile
import shutil

JAR_PATH = "files/lwjgl.jar"
TEMP_DIR = "temp_lwjgl_extract"
SYS_CLASS = "org/lwjgl/Sys.class"
TARGET_BYTES = b'\x12\x40\xB8\x00\x41' # ldc #64; invokestatic #65
NOP_BYTES = b'\x00\x00\x00\x00\x00'

def patch_jar():
    print(f"Patching {JAR_PATH}...")
    
    # 1. Extract
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    
    with zipfile.ZipFile(JAR_PATH, 'r') as zin:
        zin.extractall(TEMP_DIR)
        
    # 2. Patch Sys.class
    sys_path = os.path.join(TEMP_DIR, SYS_CLASS)
    with open(sys_path, 'rb') as f:
        content = f.read()
        
    if TARGET_BYTES in content:
        print("Found target bytes! Applying NOP patch...")
        new_content = content.replace(TARGET_BYTES, NOP_BYTES)
        with open(sys_path, 'wb') as f:
            f.write(new_content)
    else:
        print("ERROR: Target bytes not found in Sys.class!")
        return

    # 3. Repackage
    # Create new zip
    bak_path = JAR_PATH + ".bak"
    if not os.path.exists(bak_path):
        os.rename(JAR_PATH, bak_path)
    else:
        os.remove(JAR_PATH) # Overwrite current if backup exists
        
    with zipfile.ZipFile(JAR_PATH, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(TEMP_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, TEMP_DIR)
                zout.write(full_path, rel_path)
                
    print("Repackaging complete.")
    shutil.rmtree(TEMP_DIR)

if __name__ == "__main__":
    patch_jar()
