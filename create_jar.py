import zipfile
import os

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            # archive name should be relative to 'overrides'
            arcname = os.path.relpath(file_path, path)
            print(f"Adding {arcname}")
            ziph.write(file_path, arcname)

if __name__ == '__main__':
    with zipfile.ZipFile('overrides.jar', 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipdir('overrides', zipf)
    print("Created overrides.jar")
