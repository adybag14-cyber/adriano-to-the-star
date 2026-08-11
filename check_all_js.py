import os
import subprocess
import sys

def check_js(file_path):
    try:
        # Use node --check to validate syntax
        result = subprocess.run(["node", "--check", file_path], capture_output=True, text=True)
        if result.returncode == 0:
            return True, None
        else:
            return False, result.stderr
    except FileNotFoundError:
        return False, "Node.js not found"
    except Exception as e:
        return False, str(e)

def main():
    root_dir = os.getcwd()
    js_files = []
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        
        # Exclude directories known to contain non-standard or vendor JS
        exclude_dirs = ['emsdk', 'cheerpj', 'cheerpj_dist', 'cheerpj-3.0', 'cheerpj-natives', 'public']
        for d in list(dirs):
            if d in exclude_dirs:
                dirs.remove(d)

        for file in files:
            if file.endswith('.js'):
                js_files.append(os.path.join(root, file))

    print(f"Found {len(js_files)} JS files.")
    errors = []
    for f in js_files:
        valid, error = check_js(f)
        if not valid:
            errors.append((f, error))
            print(f"ERROR: {f}\n{error}")
        else:
            # print(f"OK: {f}")
            pass

    if not errors:
        print("All JS files are valid.")
        sys.exit(0)
    else:
        print(f"\nFound {len(errors)} invalid JS files.")
        sys.exit(1)

if __name__ == "__main__":
    main()
