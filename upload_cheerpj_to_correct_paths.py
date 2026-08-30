#!/usr/bin/env python3
"""
Upload CheerpJ files to the paths CheerpJ actually requests.
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

# Files to upload with correct paths
FILES_TO_UPLOAD = [
    ("cheerpj_temp/4.2/log", "log"),
    ("cheerpj_temp/4.2/ita_logo.png", "Starsector-0.97a-RC11/images/ita_logo.png"),
    ("cheerpj_temp/4.2/modules", "cheerpj/4.2/17/lib/modules"),
]


def upload_file(local_path, remote_key):
    """Upload file to R2."""
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version="s3v4"),
        )
        s3.upload_file(local_path, R2_BUCKET, remote_key)
        print(f"✓ {remote_key}")
        return True
    except Exception as error:
        print(f"✗ {remote_key}")
        print(f"  Error: {type(error).__name__}")
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
