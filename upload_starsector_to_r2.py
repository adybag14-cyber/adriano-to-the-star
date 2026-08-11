import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

BUCKET_NAME = "starsector"
LOCAL_DIR = "Starsector-0.97a-RC11"

def upload_file(args):
    local_path, remote_key = args
    # Use wrangler r2 object put command via npx with shell=True
    cmd = f'npx wrangler r2 object put {BUCKET_NAME}/{remote_key} --file "{local_path}"'
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
        print(f"✓ {remote_key}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {remote_key}")
        return False

def main():
    tasks = []
    
    # Walk through the Starsector-0.97a-RC11 directory
    for root, dirs, files in os.walk(LOCAL_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            # Create remote key by removing the base directory
            remote_key = local_path.replace(LOCAL_DIR + os.sep, "").replace(os.sep, "/")
            tasks.append((local_path, remote_key))
    
    print(f"Found {len(tasks)} files to upload to R2 bucket '{BUCKET_NAME}'")
    print("Starting upload with 32 threads...")
    
    success_count = 0
    with ThreadPoolExecutor(max_workers=32) as executor:
        results = list(executor.map(upload_file, tasks))
        success_count = sum(1 for r in results if r)
    
    print(f"\nUpload complete: {success_count}/{len(tasks)} files succeeded")

if __name__ == "__main__":
    main()
