import subprocess
import sys
import os

def check_syntax(file_path):
    print(f"Checking syntax for: {file_path}")
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        sys.exit(1)

    try:
        # Use node --check (flag -c) to validate syntax
        result = subprocess.run(['node', '--check', file_path], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Syntax Check: PASSED")
        else:
            print("Syntax Check: FAILED")
            print(result.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print("Error: 'node' executable not found in PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    file_to_check = 'tests/test_play_loader.spec.js'
    if len(sys.argv) > 1:
        file_to_check = sys.argv[1]
    
    check_syntax(file_to_check)