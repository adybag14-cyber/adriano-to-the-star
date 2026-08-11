#!/bin/bash
# Retry Script for OCI Instance Creation
# Loops continuously until successful

echo "Starting Infinite Retry Loop..."

# Configuration (Passed as environment variables or arguments)
# We use existing environment variables from the Stack or defaults below

# Hardcoded for simplicity in this specific user scenario
COMPARTMENT_ID="ocid1.tenancy.oc1..aaaaaaaan3fwo3yruzh7ucpbnlw4rhuytctzjh42gobfniscdda4cotv5lwq"
ADS=("YqAQ:UK-LONDON-1-AD-1" "YqAQ:UK-LONDON-1-AD-2")
SHAPE="VM.Standard.A1.Flex"
IMAGE_ID="ocid1.image.oc1.uk-london-1.aaaaaaaaw2hy6tmpi4k2mjbuj3japjqiw32fbaz6ffhglzkwpdy4pholqynq"

# 1. Accept Subnet ID as first argument (more reliable than env var)
SUBNET_ID="$1" 

# Create temp SSH key file because CLI requires a file path
echo "$TF_VAR_ssh_key" > /tmp/ssh_key.pub

echo "Targeting Subnet: $SUBNET_ID"

if [ -z "$SUBNET_ID" ]; then
    echo "ERROR: Subnet ID is empty!"
    exit 1
fi

attempt=0
ad_index=0

while true; do
  ((attempt++))
  # Cycle through ADs
  current_ad_index=$((ad_index % 2))
  AVAILABILITY_DOMAIN=${ADS[$current_ad_index]}

  echo "Attempt #$attempt - Targeting AD: $AVAILABILITY_DOMAIN"
  
  # Try to launch instance using OCI CLI
  # REMOVED: --auth instance_principal (likely causing the 404/Auth error on Stack runner)
  # The environment should already have necessary auth variables set by Resource Manager.
  
  OUTPUT=$(oci compute instance launch \
    --compartment-id "$COMPARTMENT_ID" \
    --availability-domain "$AVAILABILITY_DOMAIN" \
    --shape "$SHAPE" \
    --shape-config '{"ocpus":4,"memoryInGBs":24}' \
    --image-id "$IMAGE_ID" \
    --subnet-id "$SUBNET_ID" \
    --assign-public-ip true \
    --display-name "starsector-server" \
    --ssh-authorized-keys-file "/tmp/ssh_key.pub" \
    2>&1)
  
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "SUCCESS! Instance creation initiated."
    echo "$OUTPUT"
    # Clean up
    rm /tmp/ssh_key.pub
    exit 0
  else
    echo "Failed (Exit Code: $EXIT_CODE)"
    # Check for Out of Capacity (500 or 429 or text)
    if echo "$OUTPUT" | grep -q "Out of capacity"; then
        echo "Capacity error detected. Switching to next AD..."
        ((ad_index++))
    elif echo "$OUTPUT" | grep -q "500"; then
        echo "Internal Server Error (likely capacity). Retrying..."
    elif echo "$OUTPUT" | grep -q "NotAuthorizedOrNotFound"; then
         echo "CRITICAL: Auth error. Check permissions or IDs."
         echo "Details: $OUTPUT"
    else
        echo "Error Output: $OUTPUT"
        echo "Retrying anyway..."
    fi
  fi
  
  echo "Waiting 60 seconds..."
  sleep 60
done
