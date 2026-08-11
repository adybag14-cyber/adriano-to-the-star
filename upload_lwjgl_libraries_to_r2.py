#!/usr/bin/env python3
"""
Upload LWJGL library files to R2 bucket.
"""
import os
import boto3
from botocore.client import Config

# R2 S3-compatible endpoint
R2_ENDPOINT = "https://3218be7fd3453af56a94673b5678580b.r2.cloudflarestorage.com"
R2_BUCKET = "starsector"
R2_ACCESS_KEY = "17566905d2f91ba37c0fbc865d225f71"
R2_SECRET_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"

# LWJGL library files to upload
LWJGL_FILES = [
    "lwjgl-browsercraft/libraries/gl4es.wasm",
    "lwjgl-browsercraft/libraries/jawt.js",
    "lwjgl-browsercraft/libraries/liblwjgl.so",
    "lwjgl-browsercraft/libraries/lwjgl.js",
]

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
        print(f"✓ {remote_key}")
        return True
    except Exception as e:
        print(f"✗ {remote_key}")
        print(f"  Error: {str(e)}")
        return False

def main():
    print("Uploading LWJGL library files to R2...")
    
    # Upload files
    success_count = 0
    for file_path in LWJGL_FILES:
        if not os.path.exists(file_path):
            print(f"⚠ Skipping {file_path} (not found)")
            continue
        
        remote_key = file_path.replace('\\', '/')
        if upload_file(file_path, remote_key):
            success_count += 1
    
    print(f"\nUpload complete: {success_count}/{len(LWJGL_FILES)} files succeeded")

if __name__ == "__main__":
    main()
