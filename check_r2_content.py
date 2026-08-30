import os
import re
import sys

import boto3


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


# Configuration
ACCOUNT_ID = require_account_id("STARSECTOR_R2_ACCOUNT_ID")
ACCESS_KEY_ID = require_env("STARSECTOR_R2_ACCESS_KEY_ID")
SECRET_ACCESS_KEY = require_env("STARSECTOR_R2_SECRET_ACCESS_KEY")
BUCKET_NAME = "starsector"
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"


def list_files():
    print("Initializing R2 Client...")
    try:
        s3 = boto3.client(
            service_name="s3",
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY_ID,
            aws_secret_access_key=SECRET_ACCESS_KEY,
            region_name="auto",
        )
    except Exception as error:
        print(f"Failed to create client: {type(error).__name__}")
        sys.exit(1)

    print(f"Listing top 20 files in bucket '{BUCKET_NAME}'...")
    try:
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=20)
        if "Contents" in response:
            for obj in response["Contents"]:
                print(f"Key: {obj['Key']} | Size: {obj['Size']}")
        else:
            print("Bucket is empty or no files found.")

        # Check specific critical file
        critical_key = "cheerpj-natives/natives/javajpeg.js"
        print(f"\nChecking specific key: {critical_key}")
        try:
            head = s3.head_object(Bucket=BUCKET_NAME, Key=critical_key)
            print(f"FOUND: {critical_key} - ContentType: {head.get('ContentType')}")
        except Exception as error:
            print(f"MISSING: {critical_key} - {type(error).__name__}")

    except Exception as error:
        print(f"Error listing bucket: {type(error).__name__}")


if __name__ == "__main__":
    list_files()
