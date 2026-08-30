import mimetypes
import os
import sys
import threading
import re
from concurrent.futures import ThreadPoolExecutor
from threading import Lock

import boto3


# Configuration
R2_ACCOUNT_ID_ENV = "STARSECTOR_R2_ACCOUNT_ID"
R2_ACCESS_KEY_ID_ENV = "STARSECTOR_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY_ENV = "STARSECTOR_R2_SECRET_ACCESS_KEY"
R2_ENV_VARS = (
    R2_ACCOUNT_ID_ENV,
    R2_ACCESS_KEY_ID_ENV,
    R2_SECRET_ACCESS_KEY_ENV,
)
BUCKET_NAME = "starsector"
MAX_WORKERS = 32

# Paths to upload
DIRS_TO_UPLOAD = {
    "Starsector": "Starsector",
    "cheerpj-natives": "cheerpj-natives",
}

# Extension map for MIME types
mimetypes.add_type("application/java-archive", ".jar")
mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/html", ".html")
mimetypes.add_type("application/json", ".json")

# Globals for progress
total_files = 0
uploaded_files = 0
error_files = 0
print_lock = Lock()


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


def upload_file_task(s3_client, full_path, bucket_name, s3_key):
    global uploaded_files, error_files
    try:
        content_type, _ = mimetypes.guess_type(full_path)
        if not content_type:
            content_type = "application/octet-stream"

        extra_args = {"ContentType": content_type}

        s3_client.upload_file(
            Filename=full_path,
            Bucket=bucket_name,
            Key=s3_key,
            ExtraArgs=extra_args,
        )

        with print_lock:
            uploaded_files += 1
            if uploaded_files % 100 == 0:
                print(
                    f"Progress: {uploaded_files}/{total_files} "
                    f"(Errors: {error_files}) - Last: {s3_key}"
                )

    except Exception as error:
        with print_lock:
            error_files += 1
            print(f"FAILED: {s3_key} - {type(error).__name__}")


def collect_files(local_path, root_prefix):
    file_list = []
    if not os.path.exists(local_path):
        print(f"Error: Path not found: {local_path}")
        return []

    for root, dirs, files in os.walk(local_path):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, local_path)
            rel_path = rel_path.replace("\\", "/")
            s3_key = f"{root_prefix}/{rel_path}"
            file_list.append((full_path, s3_key))
    return file_list


def main():
    global total_files
    config = load_r2_config()
    print(f"Initializing R2 Client with {MAX_WORKERS} threads...")

    # Create a session to be thread-safe (client creation per thread is safer or share one)
    # boto3 client is thread-safe
    endpoint_url = (
        f"https://{config[R2_ACCOUNT_ID_ENV]}.r2.cloudflarestorage.com"
    )
    s3 = boto3.client(
        service_name="s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=config[R2_ACCESS_KEY_ID_ENV],
        aws_secret_access_key=config[R2_SECRET_ACCESS_KEY_ENV],
        region_name="auto",
    )

    base_dir = os.getcwd()
    all_uploads = []

    print("Scanning directories...")
    for dir_name, upload_prefix in DIRS_TO_UPLOAD.items():
        abs_path = os.path.join(base_dir, dir_name)
        files = collect_files(abs_path, upload_prefix)
        print(f"Found {len(files)} files in {dir_name}")
        all_uploads.extend(files)

    total_files = len(all_uploads)
    print(f"Total files to upload: {total_files}")
    print("Starting threaded upload...")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(upload_file_task, s3, fpath, BUCKET_NAME, key)
            for fpath, key in all_uploads
        ]

        # Wait for all (optional, or just let executor exit)
        # Using executor context manager waits automatically

    print(
        f"\nALL UPLOADS COMPLETE. Success: {uploaded_files}, "
        f"Errors: {error_files}"
    )


if __name__ == "__main__":
    main()
