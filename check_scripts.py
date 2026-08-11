
import os
import re

def check_missing_scripts():
    html_file = 'database.html'
    if not os.path.exists(html_file):
        print(f"Error: {html_file} not found")
        return

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all script src attributes
    scripts = re.findall(r'<script\s+[^>]*src=["\']([^"\']+)["\']', content)
    
    missing_count = 0
    print(f"Checking {len(scripts)} script references...")
    
    for script in scripts:
        # Skip external scripts
        if script.startswith('http') or script.startswith('//'):
            continue
            
        if not os.path.exists(script):
            print(f"MISSING: {script}")
            missing_count += 1
            
    if missing_count == 0:
        print("All local scripts found!")
    else:
        print(f"Found {missing_count} missing scripts.")

if __name__ == "__main__":
    check_missing_scripts()
