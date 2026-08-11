import zipfile
import sys
import os

def check_jar(jar_path, target_class):
    if not os.path.exists(jar_path):
        print(f"File not found: {jar_path}")
        return

    try:
        with zipfile.ZipFile(jar_path, 'r') as z:
            namelist = z.namelist()
            matching = [n for n in namelist if target_class in n]
            if matching:
                print(f"Found in {jar_path}:")
                for m in matching:
                    print(f"  {m}")
            else:
                print(f"Not found in {jar_path} (searched for '{target_class}')")
    except Exception as e:
        print(f"Error reading {jar_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python list_jar.py <jar_path> <search_string>")
        sys.exit(1)

    jar_path = sys.argv[1]
    search_class = sys.argv[2]

    try:
        with zipfile.ZipFile(jar_path, 'r') as jar:
            file_list = jar.namelist()
            found = False
            for file_name in file_list:
                if search_class in file_name:
                    print(f"Found {search_class} in {jar_path}: {file_name}")
                    found = True
                    # Don't break, show all matches
            if not found:
                print(f"Not found {search_class} in {jar_path}")
    except FileNotFoundError:
        print(f"File not found: {jar_path}")
    except zipfile.BadZipFile:
        print(f"Bad zip file: {jar_path}")
