import zipfile
import os
import sys

def extract_jar(jar_path, dest_dir):
    print(f"Extracting {jar_path} to {dest_dir}...")
    try:
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
        with zipfile.ZipFile(jar_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                try:
                    zip_ref.extract(member, dest_dir)
                except Exception as e:
                    print(f"Skipping {member.filename}: {e}")
        print("Done.")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    extract_jar("files/json.jar", "files/json_classes")
    extract_jar("files/starfarer_obf_unsigned.jar", "files/starfarer_classes")
    # Also extract commons?
    # extract_jar("files/commons-compiler.jar", "files/commons_classes")
