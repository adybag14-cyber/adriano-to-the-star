
import zipfile
import sys

jar_path = "files/starfarer_obf.jar"
target = "com/fs/starfarer/Starfarer"

try:
    with zipfile.ZipFile(jar_path, 'r') as z:
        print(f"Scanning {jar_path}...")
        found = []
        for name in z.namelist():
            if name.endswith(".class") and "Starfarer" in name:
                found.append(name)
        
        print(f"Found {len(found)} classes matching 'Starfarer':")
        for f in sorted(found):
            print(f)
            
        # Check specific exact match
        if "com/fs/starfarer/Starfarer.class" in z.namelist():
            print("\n!!! CONFIRMED: com/fs/starfarer/Starfarer.class EXISTS !!!")
        else:
            print("\ncom/fs/starfarer/Starfarer.class NOT found.")

except Exception as e:
    print(f"Error reading JAR: {e}")
