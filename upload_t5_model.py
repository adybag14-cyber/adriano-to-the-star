import boto3
import os
from botocore.config import Config
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# R2 credentials
ACCESS_KEY = "17566905d2f91ba37c0fbc865d225f71"
SECRET_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"
# R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
# We need to find the account ID - checking wrangler or using the worker URL pattern
ENDPOINT_URL = "https://5a9bfd2d1b4ff1ce6ef2c4f38fe8deca.r2.cloudflarestorage.com"
BUCKET_NAME = "starisdons-swf-files"  # Bucket name

# Source directory
SOURCE_DIR = r"C:\Users\adyba\adriano-to-the-star-clean\experimental\sentient-browser\models\t5_gemma2-q4f16_1"
R2_PREFIX = "t5_gemma2-q4f16_1"

# Thread count
NUM_THREADS = 32

# Thread-local S3 clients
thread_local = threading.local()

def get_s3_client():
    """Get or create a thread-local S3 client."""
    if not hasattr(thread_local, 's3'):
        thread_local.s3 = boto3.client(
            's3',
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY,
            config=Config(signature_version='s3v4')
        )
    return thread_local.s3

def upload_file(args):
    """Upload a single file to R2."""
    filepath, s3_key = args
    file_size = os.path.getsize(filepath)
    
    # Determine content type
    content_type = 'application/octet-stream'
    if s3_key.endswith('.json'):
        content_type = 'application/json'
    elif s3_key.endswith('.wasm'):
        content_type = 'application/wasm'
    elif s3_key.endswith('.bin'):
        content_type = 'application/octet-stream'
    
    try:
        s3 = get_s3_client()
        s3.upload_file(
            filepath, 
            BUCKET_NAME, 
            s3_key,
            ExtraArgs={'ContentType': content_type}
        )
        return (s3_key, file_size, True, None)
    except Exception as e:
        return (s3_key, file_size, False, str(e))

def upload_to_r2():
    # List all files to upload
    files_to_upload = []
    total_size = 0
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        # Skip 'resolve' subdirectory if exists (original HF repo files)
        if 'resolve' in dirs:
            dirs.remove('resolve')
            
        for filename in files:
            filepath = os.path.join(root, filename)
            # Calculate relative path for S3 key
            rel_path = os.path.relpath(filepath, SOURCE_DIR)
            s3_key = f"{R2_PREFIX}/{rel_path}".replace("\\", "/")
            file_size = os.path.getsize(filepath)
            files_to_upload.append((filepath, s3_key))
            total_size += file_size
    
    print(f"=== T5Gemma2 R2 Upload ===")
    print(f"Found {len(files_to_upload)} files to upload ({total_size / (1024*1024):.2f} MB total)")
    print(f"Using {NUM_THREADS} threads for parallel upload\n")
    
    for fp, key in files_to_upload:
        size_mb = os.path.getsize(fp) / (1024 * 1024)
        print(f"  {key} ({size_mb:.2f} MB)")
    
    print(f"\n--- Starting Upload ---\n")
    
    # Parallel upload with ThreadPoolExecutor
    uploaded = 0
    failed = 0
    uploaded_bytes = 0
    
    with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
        futures = {executor.submit(upload_file, args): args for args in files_to_upload}
        
        for future in as_completed(futures):
            s3_key, file_size, success, error = future.result()
            if success:
                uploaded += 1
                uploaded_bytes += file_size
                print(f"  ✓ {s3_key} ({file_size / (1024*1024):.2f} MB)")
            else:
                failed += 1
                print(f"  ✗ {s3_key} FAILED: {error}")
    
    print(f"\n=== Upload Complete ===")
    print(f"Uploaded: {uploaded} files ({uploaded_bytes / (1024*1024):.2f} MB)")
    if failed > 0:
        print(f"Failed: {failed} files")
    print(f"\nFiles accessible at: https://throbbing-queen-9903.adybag14.workers.dev/{R2_PREFIX}/")

if __name__ == "__main__":
    upload_to_r2()
