import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import boto3
from botocore.config import Config


R2_ACCOUNT_ID_ENV = "T5_R2_ACCOUNT_ID"
R2_ACCESS_KEY_ID_ENV = "T5_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY_ENV = "T5_R2_SECRET_ACCESS_KEY"
R2_ENV_VARS = (
    R2_ACCOUNT_ID_ENV,
    R2_ACCESS_KEY_ID_ENV,
    R2_SECRET_ACCESS_KEY_ENV,
)
BUCKET_NAME = "starisdons-swf-files"

# Source directory
SOURCE_DIR = (
    r"C:\Users\adyba\adriano-to-the-star-clean\experimental\sentient-browser"
    r"\models\t5_gemma2-q4f16_1"
)
R2_PREFIX = "t5_gemma2-q4f16_1"

# Thread count
NUM_THREADS = 32

# Thread-local S3 clients
thread_local = threading.local()


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


def get_s3_client():
    """Get or create a thread-local S3 client."""
    if not hasattr(thread_local, "s3"):
        config = load_r2_config()
        endpoint_url = (
            f"https://{config[R2_ACCOUNT_ID_ENV]}.r2.cloudflarestorage.com"
        )
        thread_local.s3 = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=config[R2_ACCESS_KEY_ID_ENV],
            aws_secret_access_key=config[R2_SECRET_ACCESS_KEY_ENV],
            config=Config(signature_version="s3v4"),
        )
    return thread_local.s3


def upload_file(args):
    """Upload a single file to R2."""
    filepath, s3_key = args
    file_size = os.path.getsize(filepath)

    # Determine content type
    content_type = "application/octet-stream"
    if s3_key.endswith(".json"):
        content_type = "application/json"
    elif s3_key.endswith(".wasm"):
        content_type = "application/wasm"
    elif s3_key.endswith(".bin"):
        content_type = "application/octet-stream"

    try:
        s3 = get_s3_client()
        s3.upload_file(
            filepath,
            BUCKET_NAME,
            s3_key,
            ExtraArgs={"ContentType": content_type},
        )
        return (s3_key, file_size, True, None)
    except Exception as error:
        return (s3_key, file_size, False, type(error).__name__)


def upload_to_r2():
    load_r2_config()

    # List all files to upload
    files_to_upload = []
    total_size = 0

    for root, dirs, files in os.walk(SOURCE_DIR):
        # Skip 'resolve' subdirectory if exists (original HF repo files)
        if "resolve" in dirs:
            dirs.remove("resolve")

        for filename in files:
            filepath = os.path.join(root, filename)
            # Calculate relative path for S3 key
            rel_path = os.path.relpath(filepath, SOURCE_DIR)
            s3_key = f"{R2_PREFIX}/{rel_path}".replace("\\", "/")
            file_size = os.path.getsize(filepath)
            files_to_upload.append((filepath, s3_key))
            total_size += file_size

    print("=== T5Gemma2 R2 Upload ===")
    print(
        f"Found {len(files_to_upload)} files to upload "
        f"({total_size / (1024 * 1024):.2f} MB total)"
    )
    print(f"Using {NUM_THREADS} threads for parallel upload\n")

    for filepath, key in files_to_upload:
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"  {key} ({size_mb:.2f} MB)")

    print("\n--- Starting Upload ---\n")

    # Parallel upload with ThreadPoolExecutor
    uploaded = 0
    failed = 0
    uploaded_bytes = 0

    with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
        futures = {
            executor.submit(upload_file, args): args for args in files_to_upload
        }

        for future in as_completed(futures):
            s3_key, file_size, success, error = future.result()
            if success:
                uploaded += 1
                uploaded_bytes += file_size
                print(f"  ✓ {s3_key} ({file_size / (1024 * 1024):.2f} MB)")
            else:
                failed += 1
                print(f"  ✗ {s3_key} FAILED: {error}")

    print("\n=== Upload Complete ===")
    print(
        f"Uploaded: {uploaded} files "
        f"({uploaded_bytes / (1024 * 1024):.2f} MB)"
    )
    if failed > 0:
        print(f"Failed: {failed} files")
    print(f"R2 object prefix: {R2_PREFIX}/")


if __name__ == "__main__":
    upload_to_r2()
