
import os
import re

def get_files_from_sw(sw_path):
    with open(sw_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract CRITICAL_RESOURCES array
    critical_match = re.search(r'const CRITICAL_RESOURCES = \[(.*?)\];', content, re.DOTALL)
    critical_files = []
    if critical_match:
        critical_block = critical_match.group(1)
        critical_files = [f.strip().strip("'").strip('"') for f in critical_block.split(',') if f.strip()]

    # Extract ALWAYS_FRESH_ASSETS set
    fresh_match = re.search(r'const ALWAYS_FRESH_ASSETS = new Set\(\[(.*?)\]\);', content, re.DOTALL)
    fresh_files = []
    if fresh_match:
        fresh_block = fresh_match.group(1)
        fresh_files = [f.strip().strip("'").strip('"') for f in fresh_block.split(',') if f.strip()]

    return critical_files + fresh_files

def check_files_exist(base_dir, file_list):
    missing_files = []
    for file_path in file_list:
        if file_path == '/': continue
        # Remove leading slash for local check
        local_path = file_path.lstrip('/')
        full_path = os.path.join(base_dir, local_path)
        if not os.path.exists(full_path):
            missing_files.append(file_path)
    return missing_files

if __name__ == "__main__":
    sw_path = r"c:\Users\Ady\Documents\starpro\sw.js"
    base_dir = r"c:\Users\Ady\Documents\starpro"
    
    files_to_check = get_files_from_sw(sw_path)
    missing = check_files_exist(base_dir, files_to_check)
    
    if missing:
        print("Missing files found in sw.js:")
        for f in missing:
            print(f)
    else:
        print("All files in sw.js exist.")
