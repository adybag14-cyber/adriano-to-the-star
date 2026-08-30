#!/usr/bin/env python3
"""
Download CheerpJ runtime files and upload to R2 bucket.
"""
import os
import re

import boto3
import requests
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
    """Download file from URL."""
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()

    # Create temp directory if needed
    temp_path = local_path.replace("cheerpj/", "cheerpj_temp/")
    os.makedirs(os.path.dirname(temp_path), exist_ok=True)

    # Download to temp location first
    with open(temp_path, "wb") as file_handle:
        for chunk in response.iter_content(chunk_size=8192):
            file_handle.write(chunk)
    print(f"✓ Downloaded to {temp_path}")
    return temp_path


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
        print(f"✓ Uploaded {remote_key}")
        return True
    except Exception as error:
        print(f"✗ {remote_key}")
        print(f"  Error: {type(error).__name__}")
        return False


def patch_cj3js(local_path):
    """Patch cj3.js to fix Missing import: __syscall_pipe2."""
    print("Patching cj3.js...")
    with open(local_path, "r") as file_handle:
        content = file_handle.read()

    patched = content.replace(
        'case "Missing import":',
        'case "Missing import": if (importName === "__syscall_pipe2") { console.log("[cj3.js] shim __syscall_pipe2"); return; }',
    )

    with open(local_path, "w") as file_handle:
        file_handle.write(patched)
    print("✓ Patched cj3.js")


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
