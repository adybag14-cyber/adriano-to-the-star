#!/usr/bin/env python3
"""
Check R2 bucket contents to verify CheerpJ files were uploaded correctly.
"""
import boto3
from botocore.client import Config

# R2 S3-compatible endpoint
R2_ENDPOINT = "https://3218be7fd3453af56a94673b5678580b.r2.cloudflarestorage.com"
R2_BUCKET = "starsector"
R2_ACCESS_KEY = "17566905d2f91ba37c0fbc865d225f71"
R2_SECRET_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"

def main():
    print("Checking R2 bucket contents...")
    
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4')
    )
    
    # List all objects in the bucket
    response = s3.list_objects_v2(Bucket=R2_BUCKET)
    
    if 'Contents' in response:
        print(f"\nTotal objects in bucket: {len(response['Contents'])}")
        print("\nObjects:")
        for obj in response['Contents']:
            key = obj['Key']
            size = obj['Size']
            last_modified = obj['LastModified']
            print(f"  - {key} ({size} bytes)")
    else:
        print("\nBucket is empty!")
    
    # Check for CheerpJ files specifically
    print("\n\nChecking for CheerpJ files...")
    cheerpj_files = [
        "cheerpj/4.2/loader.js",
        "cheerpj/4.2/cj3.js",
        "cheerpj/4.2/cj3.wasm",
        "cheerpj/4.2/cj3n17.wasm"
    ]
    
    for file_key in cheerpj_files:
        try:
            response = s3.head_object(Bucket=R2_BUCKET, Key=file_key)
            print(f"✓ {file_key} exists ({response['ContentLength']} bytes)")
        except Exception as e:
            print(f"✗ {file_key} NOT FOUND: {str(e)}")

if __name__ == "__main__":
    main()
