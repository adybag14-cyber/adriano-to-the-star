#!/usr/bin/env python3
"""
Check R2 bucket contents to verify CheerpJ files were uploaded correctly.
"""
import os
import re

import boto3
from botocore.client import Config


def require_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def require_account_id(name):
    value = require_env(name)
    if not re.fullmatch(r"[0-9a-fA-F]{32}", value):
        raise SystemExit(f"{name} must be a 32-character hexadecimal account ID")
    return value


# R2 S3-compatible endpoint
R2_ACCOUNT_ID = require_account_id("STARSECTOR_R2_ACCOUNT_ID")
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_BUCKET = "starsector"
R2_ACCESS_KEY = require_env("STARSECTOR_R2_ACCESS_KEY_ID")
R2_SECRET_KEY = require_env("STARSECTOR_R2_SECRET_ACCESS_KEY")


def main():
    print("Checking R2 bucket contents...")

    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )

    # List all objects in the bucket
    response = s3.list_objects_v2(Bucket=R2_BUCKET)

    if "Contents" in response:
        print(f"\nTotal objects in bucket: {len(response['Contents'])}")
        print("\nObjects:")
        for obj in response["Contents"]:
            key = obj["Key"]
            size = obj["Size"]
            last_modified = obj["LastModified"]
            print(f"  - {key} ({size} bytes)")
    else:
        print("\nBucket is empty!")

    # Check for CheerpJ files specifically
    print("\n\nChecking for CheerpJ files...")
    cheerpj_files = [
        "cheerpj/4.2/loader.js",
        "cheerpj/4.2/cj3.js",
        "cheerpj/4.2/cj3.wasm",
        "cheerpj/4.2/cj3n17.wasm",
    ]

    for file_key in cheerpj_files:
        try:
            response = s3.head_object(Bucket=R2_BUCKET, Key=file_key)
            print(f"✓ {file_key} exists ({response['ContentLength']} bytes)")
        except Exception as error:
            print(f"✗ {file_key} NOT FOUND: {type(error).__name__}")


if __name__ == "__main__":
    main()
