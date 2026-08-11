#!/usr/bin/env python3
"""
Download CheerpJ runtime files and upload to R2 bucket.
"""
import os
import requests
import boto3
from botocore.client import Config

# R2 S3-compatible endpoint
R2_ENDPOINT = "https://3218be7fd3453af56a94673b5678580b.r2.cloudflarestorage.com"
R2_BUCKET = "starsector"
R2_ACCESS_KEY = "17566905d2f91ba37c0fbc865d225f71"
R2_SECRET_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"

# CheerpJ files to download
CHEERPJ_FILES = [
    "4.2/loader.js",
    "4.2/cj3.js",
    "4.2/cj3.wasm",
    "4.2/cj3n17.wasm",
    "4.2/cheerpOS.js",
    "4.2/cheerpOS.wasm",
    "4.2/cheerpOS-meta.json",
    "4.2/x11.wasm",
    "4.2/x11.js",
    "4.2/cheerpj.js",
    "4.2/cheerpj.wasm",
    "4.2/log",
    "4.2/ita_logo.png",
    "4.2/cheerpj.css",
    "4.2/c.html",
    "4.2/c.js",
    "4.2/modules",
]

def download_file(url, local_path):
    """Download file from URL"""
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    # Create temp directory if needed
    temp_path = local_path.replace('cheerpj/', 'cheerpj_temp/')
    os.makedirs(os.path.dirname(temp_path), exist_ok=True)
    
    # Download to temp location first
    with open(temp_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"✓ Downloaded to {temp_path}")
    return temp_path

def upload_file(local_path, remote_key):
    """Upload file to R2"""
    try:
        s3 = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version='s3v4')
        )
        s3.upload_file(local_path, R2_BUCKET, remote_key)
        print(f"✓ Uploaded {remote_key}")
        return True
    except Exception as e:
        print(f"✗ {remote_key}")
        print(f"  Error: {str(e)}")
        return False

def patch_cj3js(local_path):
    """Patch cj3.js to fix Missing import: __syscall_pipe2"""
    print(f"Patching cj3.js...")
    with open(local_path, 'r') as f:
        content = f.read()
    
    patched = content.replace(
        'case "Missing import":',
        'case "Missing import": if (importName === "__syscall_pipe2") { console.log("[cj3.js] shim __syscall_pipe2"); return; }'
    )
    
    with open(local_path, 'w') as f:
        f.write(patched)
    print(f"✓ Patched cj3.js")

def main():
    print("Downloading CheerpJ files...")
    
    # Download files to temp directory
    temp_files = {}
    for file_path in CHEERPJ_FILES:
        url = f"https://cjrtnc.leaningtech.com/{file_path}"
        local_path = f"cheerpj/{file_path}"
        temp_path = download_file(url, local_path)
        temp_files[file_path] = temp_path
    
    # Patch cj3.js
    cj3_path = temp_files.get("4.2/cj3.js")
    if cj3_path and os.path.exists(cj3_path):
        patch_cj3js(cj3_path)
    
    print("\nUploading to R2...")
    
    # Upload files from temp directory
    success_count = 0
    for file_path in CHEERPJ_FILES:
        temp_path = temp_files[file_path]
        remote_key = f"cheerpj/{file_path}"
        if upload_file(temp_path, remote_key):
            success_count += 1
    
    print(f"\nUpload complete: {success_count}/{len(CHEERPJ_FILES)} files succeeded")

if __name__ == "__main__":
    main()
