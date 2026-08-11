#!/usr/bin/env python3
"""
Upload CheerpJ files to the paths CheerpJ actually requests.
"""
import os
import boto3
from botocore.client import Config

# R2 S3-compatible endpoint
R2_ENDPOINT = "https://3218be7fd3453af56a94673b5678580b.r2.cloudflarestorage.com"
R2_BUCKET = "starsector"
R2_ACCESS_KEY = "17566905d2f91ba37c0fbc865d225f71"
R2_SECRET_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"

# Files to upload with correct paths
FILES_TO_UPLOAD = [
    ("cheerpj_temp/4.2/log", "log"),
    ("cheerpj_temp/4.2/ita_logo.png", "Starsector-0.97a-RC11/images/ita_logo.png"),
    ("cheerpj_temp/4.2/modules", "cheerpj/4.2/17/lib/modules"),
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
    print("Uploading CheerpJ files to correct paths...")
    
    # Upload files
    success_count = 0
    for local_path, remote_key in FILES_TO_UPLOAD:
        if not os.path.exists(local_path):
            print(f"⚠ Skipping {local_path} (not found)")
            continue
        
        if upload_file(local_path, remote_key):
            success_count += 1
    
    print(f"\nUpload complete: {success_count}/{len(FILES_TO_UPLOAD)} files succeeded")

if __name__ == "__main__":
    main()
