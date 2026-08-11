import zipfile
import sys
import re

def find_main_classes(jar_path):
    try:
        with zipfile.ZipFile(jar_path, 'r') as jar:
            print(f"Scanning {jar_path}...")
            for info in jar.infolist():
                if info.filename.endswith('.class'):
                    # Convert path to class name
                    class_name = info.filename.replace('/', '.').replace('.class', '')
                    
                    # Filter for likely candidates
                    if "Starfarer" in class_name or "Main" in class_name or "Game" in class_name:
                         print(class_name)
                    
                    # Optional: Check for main method signature? (Harder without parsing bytecode)
                    # We'll just rely on names for now.

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_main_classes(sys.argv[1])
