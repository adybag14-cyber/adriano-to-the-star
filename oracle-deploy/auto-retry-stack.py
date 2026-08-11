"""
Oracle Cloud Stack Auto-Retry Script
Triggers 'Apply' jobs for a specific Resource Manager Stack until successful.
"""

import oci
import time
import sys
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================
# Stack ID from your dashboard
STACK_ID = "ocid1.ormstack.oc1.uk-london-1.amaaaaaa65tdvriavuuvxw4gdrmllby7kzrigsxcbemq6fv6x6xgjkufyaga"

# Retry settings
RETRY_DELAY = 10     # Seconds to wait between job status checks
FAILURE_DELAY = 60   # Seconds to wait before retrying after a failed job

# ============================================
# SCRIPT
# ============================================

def main():
    print("=" * 50)
    print("Oracle Cloud Stack Auto-Retry Script")
    print("=" * 50)
    print(f"Target Stack: {STACK_ID}")
    print("Press Ctrl+C to stop at any time.\n")

    # Initialize OCI Client
    try:
        # Using default config location ~/.oci/config
        config = oci.config.from_file()
        rm_client = oci.resource_manager.ResourceManagerClient(config)
    except Exception as e:
        print(f"Error loading OCI config: {e}")
        print("Ensure ~/.oci/config exists and is correct.")
        sys.exit(1)

    attempt = 0

    while True:
        attempt += 1
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n{'=' * 50}")
        print(f"Batch Attempt #{attempt} - {timestamp}")
        print("=" * 50)

        try:
            # Create APPLY Job
            print("Creating 'APPLY' job...")
            create_job_details = oci.resource_manager.models.CreateJobDetails(
                stack_id=STACK_ID,
                display_name=f"auto-retry-apply-{timestamp}",
                operation="APPLY",
                job_operation_details=oci.resource_manager.models.CreateApplyJobOperationDetails(
                    execution_plan_strategy="AUTO_APPROVED"
                )
            )

            job = rm_client.create_job(create_job_details).data
            print(f"Job Created: {job.id}")
            print(f"Status: {job.lifecycle_state}")

            # Monitor Job
            while True:
                time.sleep(RETRY_DELAY)
                job_check = rm_client.get_job(job.id).data
                state = job_check.lifecycle_state
                print(f"Job State: {state} ...")

                if state == "SUCCEEDED":
                    print("\n" + "="*50)
                    print("SUCCESS! Stack applied successfully.")
                    print("="*50)
                    print(f"Job ID: {job.id}")
                    return # Exit script on success

                if state in ["FAILED", "CANCELED", "CANCELLING"]:
                    print(f"\nJob failed ({state}). Retrying in {FAILURE_DELAY} seconds...")
                    break # Break inner loop to retry outer loop
                
                # If ACCEPTED / IN_PROGRESS, continue waiting
        
        except oci.exceptions.ServiceError as e:
            print(f"\nOCI Error: {e.status} - {e.message}")
            if e.status == 429:
                print("Too Many Requests. Cooling down...")
                time.sleep(60)
            else:
                print(f"Retrying in {FAILURE_DELAY} seconds...")
        
        except Exception as e:
            print(f"\nUnexpected Error: {e}")
            print(f"Retrying in {FAILURE_DELAY} seconds...")

        time.sleep(FAILURE_DELAY)

if __name__ == "__main__":
    main()
