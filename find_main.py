
import zipfile
import sys
import os

def extract_strings(file_path, min_len=4):
    with open(file_path, 'rb') as f:
        content = f.read()
    
    result = ""
    current_str = []
    for byte in content:
        if 32 <= byte <= 126: # Printable ASCII
            current_str.append(chr(byte))
        else:
            if len(current_str) >= min_len:
                result += "".join(current_str) + "\n"
            current_str = []
    return result

jar_path = r"c:\Users\adyba\adriano-to-the-star-clean\Starsector\starsector-core\starfarer_obf.jar"
target_class = "com/fs/starfarer/Version.class"

try:
    with zipfile.ZipFile(jar_path, 'r') as z:
        files = z.namelist()
        found = False
        for f in files:
            if "Version" in f and f.endswith(".class"):
                print(f"Found: {f}")
                found = True
        
        if not found:
            print("Version class not found in obf jar.")
            # Try main jar
            jar_path = r"c:\Users\adyba\adriano-to-the-star-clean\Starsector\starsector-core\starfarer.api.jar" # Assuming api has it?
            print(f"Checking {jar_path}")
            
    if not found and os.path.exists(jar_path):
         with zipfile.ZipFile(jar_path, 'r') as z:
            for f in z.namelist():
                if "Version" in f and f.endswith(".class"):
                    print(f"Found: {f} in API jar")


except Exception as e:
    print(f"Error: {e}")
