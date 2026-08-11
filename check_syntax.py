import subprocess
import sys
import os

def check_syntax(file_path):
    print(f"Checking syntax for: {file_path}")
    try:
        # Use node --check to verify syntax
        result = subprocess.run(["node", "--check", file_path], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(f"✅ Syntax OK: {file_path}")
            return True
        else:
            print(f"❌ Syntax Error in {file_path}:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"Error checking {file_path}: {e}")
        return False

files_to_check = [
    r"tests\e2e\starsector-console.spec.js",
    r"tests\e2e\debug-starsector.spec.cjs"
]

all_passed = True
for f in files_to_check:
    if not os.path.exists(f):
         print(f"File not found: {f}")
         continue
    if not check_syntax(f):
        all_passed = False

if all_passed:
    print("\nAll files passed syntax check.")
    sys.exit(0)
else:
    print("\nSome files failed syntax check.")
    sys.exit(1)

