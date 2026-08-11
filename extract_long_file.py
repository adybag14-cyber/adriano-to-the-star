import zipfile
import os

jar_path = "files/starfarer_obf_unsigned.jar"
dest_file = "files/long_class_patch.class"
target_name_partial = "ooOOOO"

with zipfile.ZipFile(jar_path, 'r') as z:
    for name in z.namelist():
        if target_name_partial in name and name.endswith(".class"):
            print(f"Found: {name}")
            content = z.read(name)
            with open(dest_file, "wb") as f:
                f.write(content)
            print(f"Extracted to {dest_file}")
            break
