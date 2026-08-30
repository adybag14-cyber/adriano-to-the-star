#!/usr/bin/env python3
"""
Upload LWJGL library files to R2 bucket.
"""
import os
import re

import boto3
from botocore.client import Config


R2_ACCOUNT_ID_ENV = "STARSECTOR_R2_ACCOUNT_ID"
R2_ACCESS_KEY_ID_ENV = "STARSECTOR_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY_ENV = "STARSECTOR_R2_SECRET_ACCESS_KEY"
R2_ENV_VARS = (
    R2_ACCOUNT_ID_ENV,
    R2_ACCESS_KEY_ID_ENV,
    R2_SECRET_ACCESS_KEY_ENV,
)
R2_BUCKET = "starsector"


def load_r2_config():
    """Load required R2 client settings without exposing their values."""
    config = {}
    missing = []
    for name in R2_ENV_VARS:
        value = os.environ.get(name)
        if value is None or not value.strip():
            missing.append(name)
        else:
            config[name] = value.strip()

    if missing:
        raise RuntimeError(
            "Missing required R2 environment variable(s): " + ", ".join(missing)
        )

    if not re.fullmatch(r"[0-9a-fA-F]{32}", config[R2_ACCOUNT_ID_ENV]):
        raise RuntimeError(
            f"{R2_ACCOUNT_ID_ENV} must be a 32-character hexadecimal account ID"
        )

    return config


def create_r2_client():
    """Create an authenticated R2 client from explicit environment settings."""
    config = load_r2_config()
    endpoint_url = (
        f"https://{config[R2_ACCOUNT_ID_ENV]}.r2.cloudflarestorage.com"
    )
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=config[R2_ACCESS_KEY_ID_ENV],
        aws_secret_access_key=config[R2_SECRET_ACCESS_KEY_ENV],
        config=Config(signature_version="s3v4"),
    )


# LWJGL library files to upload
LWJGL_FILES = [
    "lwjgl-browsercraft/libraries/gl4es.wasm",
    "lwjgl-browsercraft/libraries/jawt.js",
    "lwjgl-browsercraft/libraries/liblwjgl.so",
    "lwjgl-browsercraft/libraries/lwjgl.js",
]


def upload_file(local_path, remote_key):
    """Upload file to R2."""
    s3 = create_r2_client()
    try:
        s3.upload_file(local_path, R2_BUCKET, remote_key)
        print(f"✓ {remote_key}")
        return True
    except Exception as error:
        print(f"✗ {remote_key}")
        print(f"  Error: {type(error).__name__}")
        return False


def main():
    load_r2_config()
    print("Uploading LWJGL library files to R2...")

    # Upload files
    success_count = 0
    for file_path in LWJGL_FILES:
        if not os.path.exists(file_path):
            print(f"⚠ Skipping {file_path} (not found)")
            continue

        remote_key = file_path.replace("\\", "/")
        if upload_file(file_path, remote_key):
            success_count += 1

    print(f"\nUpload complete: {success_count}/{len(LWJGL_FILES)} files succeeded")


if __name__ == "__main__":
    main()
