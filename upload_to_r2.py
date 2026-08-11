import os
import subprocess
import glob
from concurrent.futures import ThreadPoolExecutor

BUCKET_NAME = "starsector-files"
LOCAL_DIR = "files"

def upload_file(args):
    local_path, remote_key = args
    cmd = ["wrangler", "r2", "object", "put", f"{BUCKET_NAME}/{remote_key}", "--file", local_path]
    # print(f"Uploading {local_path} -> {remote_key}...") 
    try:
        subprocess.run(cmd, check=True, capture_output=True, shell=True)
        print(f"SUCCESS: {remote_key}")
    except subprocess.CalledProcessError as e:
        print(f"FAILED: {remote_key} - {e.stderr.decode()}")

def main():
    tasks = []
    # Walk through the directory
    for root, dirs, files in os.walk(LOCAL_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            remote_key = local_path.replace(os.sep, "/")
            tasks.append((local_path, remote_key))
    
    print(f"Starting upload of {len(tasks)} files with 32 threads...")
    
    with ThreadPoolExecutor(max_workers=32) as executor:
        executor.map(upload_file, tasks)

    print("All uploads completed.")

if __name__ == "__main__":
    main()
