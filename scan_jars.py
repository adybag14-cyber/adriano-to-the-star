
import zipfile
import sys

jars = ["files/janino.jar", "files/starfarer_obf.jar"]

def check_main(content):
    # Simple heuristic: check for "main" and "([Ljava/lang/String;)V"
    # This is not perfect but indicative.
    s = content
    if b"main" in s and b"([Ljava/lang/String;)V" in s:
        return True
    return False

for jar_path in jars:
    try:
        with zipfile.ZipFile(jar_path, 'r') as z:
            print(f"Scanning {jar_path}...")
            for name in z.namelist():
                if name.endswith(".class"):
                    # For janino, look for Compiler/Main
                    if "janino" in jar_path:
                        if "Compiler" in name or "Main" in name:
                            print(f"  {name}")
                    
                    # For Starfarer, check specific classes
                    if "starfarer" in jar_path:
                        if "LoadingUtils" in name or "StarfarerSettings" in name:
                             with z.open(name) as f:
                                 content = f.read()
                                 has_main = check_main(content)
                                 print(f"  {name} - Has Main? {has_main}")

    except Exception as e:
        print(f"Error reading {jar_path}: {e}")
