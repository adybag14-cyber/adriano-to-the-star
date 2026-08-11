
import zipfile
import os

def create_jar():
    zf = zipfile.ZipFile("files/config.jar", "w", zipfile.ZIP_DEFLATED)
    root_dir = "files"
    target_dir = "files/data/config"
    
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            full_path = os.path.join(root, file)
            # archive name should start with data/config
            # Relpath from 'files'
            arcname = os.path.relpath(full_path, root_dir)
            print(f"Adding {arcname}")
            zf.write(full_path, arcname)
    zf.close()
    print("Created files/config.jar")

if __name__ == "__main__":
    create_jar()
