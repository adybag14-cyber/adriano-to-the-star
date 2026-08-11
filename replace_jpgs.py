import os
import shutil

source_png = "Starsector/starsector-core/graphics/ui/sector_age_young.png"
target_dir = "Starsector/starsector-core"

count = 0
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.lower().endswith(".jpg"):
            target_path = os.path.join(root, file)
            print(f"Replacing {target_path}...")
            shutil.copy2(source_png, target_path)
            count += 1

print(f"Replaced {count} JPEG files with PNG content.")
