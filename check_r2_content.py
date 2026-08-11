import boto3
import sys

# Configuration
ACCOUNT_ID = "3218be7fd3453af56a94673b5678580b"
ACCESS_KEY_ID = "17566905d2f91ba37c0fbc865d225f71"
SECRET_ACCESS_KEY = "9366c12e39d6e68c53659446542a7742f06360fbd36f181410cee918e50322e8"
BUCKET_NAME = "starsector"
ENDPOINT_URL = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

def list_files():
    print("Initializing R2 Client...")
    try:
        s3 = boto3.client(
            service_name='s3',
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY_ID,
            aws_secret_access_key=SECRET_ACCESS_KEY,
            region_name='auto'
        )
    except Exception as e:
        print(f"Failed to create client: {e}")
        sys.exit(1)

    print(f"Listing top 20 files in bucket '{BUCKET_NAME}'...")
    try:
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=20)
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"Key: {obj['Key']} | Size: {obj['Size']}")
        else:
            print("Bucket is empty or no files found.")
            
        # Check specific critical file
        critical_key = "cheerpj-natives/natives/javajpeg.js"
        print(f"\nChecking specific key: {critical_key}")
        try:
            head = s3.head_object(Bucket=BUCKET_NAME, Key=critical_key)
            print(f"FOUND: {critical_key} - ContentType: {head.get('ContentType')}")
        except Exception as e:
            print(f"MISSING: {critical_key} - {e}")

    except Exception as e:
        print(f"Error listing bucket: {e}")

if __name__ == "__main__":
    list_files()
