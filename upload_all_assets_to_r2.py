#!/usr/bin/env python3
"""
Upload all Starsector assets to R2 bucket using S3-compatible API.
This includes HTML, CheerpJ natives, and LWJGL browsercraft.
"""
import os
import boto3
from botocore.client import Config
from concurrent.futures import ThreadPoolExecutor

# R2 S3-compatible endpoint (account ID from API token)
R2_ENDPOINT = "https://3218be7fd3453af56a94673b5678580b.r2.cloudflarestorage.com"
R2_BUCKET = "starsector"
R2_ACCESS_KEY = "17566905d2f91ba37c0fbc865d225f71"
R2_SECRET_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"

# Files and directories to upload
ASSETS_TO_UPLOAD = [
    # Starsector HTML
    "Starsector-0.97a-RC11/starsector.html",
    
    # CheerpJ natives
    "cheerpj-natives/lwjgl-fixed.jar",
    "cheerpj-natives/lwjgl.jar",
    
    # LWJGL browsercraft
    "lwjgl-browsercraft/lwjgl-2.9.3.jar",
    "lwjgl-browsercraft/lwjgl_util-2.9.3.jar",
]

def upload_file(args):
    local_path, remote_key = args
    try:
        s3 = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version='s3v4')
        )
        s3.upload_file(local_path, R2_BUCKET, remote_key)
        print(f"✓ {remote_key}")
        return True
    except Exception as e:
        print(f"✗ {remote_key}")
        print(f"  Error: {str(e)}")
        return False

def main():
    print(f"Uploading assets to R2 bucket '{R2_BUCKET}'...")
    
    # Prepare upload tasks
    tasks = []
    for asset_path in ASSETS_TO_UPLOAD:
        if not os.path.exists(asset_path):
            print(f"⚠ Skipping {asset_path} (not found)")
            continue
        
        # Create remote key (same as local path)
        remote_key = asset_path.replace('\\', '/')
        tasks.append((asset_path, remote_key))
    
    print(f"Found {len(tasks)} assets to upload")
    
    # Upload with 8 threads (S3 API is more efficient)
    success_count = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(upload_file, tasks))
        success_count = sum(1 for r in results if r)
    
    print(f"\nUpload complete: {success_count}/{len(tasks)} files succeeded")

if __name__ == "__main__":
    main()
