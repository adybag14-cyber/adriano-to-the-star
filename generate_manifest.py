import os
import json

# Configuration
TARGET_DIRS = ["graphics", "sounds", "data", "mods"]
OUTPUT_FILE = "assets.json"
EXCLUDE_EXTS = [".zip", ".rar", ".log", ".bak", ".psd"]

# Get the script's directory (Game Root)
root_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(root_dir)

asset_list = []

print(f"Scanning for assets in: {', '.join(TARGET_DIRS)}...")

for folder in TARGET_DIRS:
    if not os.path.exists(folder):
        print(f"Skipping missing folder: {folder}")
        continue
        
    for root, dirs, files in os.walk(folder):
        for file in files:
            # Skip unwanted extensions
            if any(file.lower().endswith(ext) for ext in EXCLUDE_EXTS):
                continue
                
            # Create relative path (e.g., "graphics/ships/hull.png")
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, root_dir)
            
            # Normalize slashes for Web (Windows uses backslashes)
            clean_path = rel_path.replace("\\", "/")
            
            asset_list.append(clean_path)

# Save to JSON
with open(OUTPUT_FILE, "w") as f:
    json.dump(asset_list, f, indent=0)

print(f"Manifest generated: {OUTPUT_FILE}")
print(f"Total assets indexed: {len(asset_list)}")